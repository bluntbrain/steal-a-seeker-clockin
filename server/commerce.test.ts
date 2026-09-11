import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID,generateKeyPairSync,sign} from 'node:crypto';
import {getBase58Decoder,address} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {createSignInMessage} from '@solana/wallet-standard-util';
import {database,migrate} from './db';
import {CommerceService} from './service';
import {createApp} from './app';
import {verifyPayment,TOKEN_PROGRAM,MEMO_PROGRAM,type PaymentChain} from './chain';
import type {Order,SignInChallenge} from '../shared/commerce';
import {RankedService,dailyMission} from './ranked-service';
import {fixtureReplay} from '../tests/fixtures/replay';
import type {DailyManifest,RunTicket} from '../shared/ranked';
const b58=(b:Uint8Array)=>getBase58Decoder().decode(b),pub=()=>b58(randomBytes(32));
const pool=database('postgresql://localhost/seeker_clockin_test');
const transactions=new Map<string,unknown>(),references=new Map<string,string[]>();
let chainHeight=100,chainUnavailable=false;
const chain:PaymentChain={ready:async()=>{},verify:async(o,s)=>verifyPayment(o,s,transactions.get(s)??null),find:async r=>{if(chainUnavailable)throw new Error('RPC unavailable');return references.get(r)||[];},lifetime:async()=>({blockhash:pub(),lastValidBlockHeight:String(chainHeight+150),contextSlot:String(chainHeight+1000)}),height:async()=>chainHeight};
let rankClock=new Date('2026-01-01T12:00:00Z');while(dailyMission(rankClock)!=='practice')rankClock=new Date(rankClock.getTime()+86400000);
const ranked=new RankedService(pool,{now:()=>rankClock});
let service:CommerceService,app:Awaited<ReturnType<typeof createApp>>;
before(async()=>{assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name,'seeker_clockin_test');await migrate(pool);await pool.query('TRUNCATE wallets,auth_challenges,sessions,orders,order_attempts,payment_receipts,entitlements CASCADE');const mint=pub(),recipient=pub();const [destination]=await findAssociatedTokenPda({owner:address(recipient),mint:address(mint),tokenProgram:address(TOKEN_PROGRAM)});service=new CommerceService(pool,chain,{mint,recipient,destination,decimals:6,identityUri:'https://github.com/bluntbrain'});app=await createApp(service,ranked);});
after(async()=>{await app.close();await pool.end();});
async function login(){const keys=generateKeyPairSync('ed25519'),wallet=b58(keys.publicKey.export({type:'spki',format:'der'}).subarray(-32));const response=await app.inject({method:'POST',url:'/auth/challenge',payload:{wallet}});assert.equal(response.statusCode,200);const c=response.json<SignInChallenge>(),message=createSignInMessage(c.payload),signature=sign(null,message,keys.privateKey);const payload={id:c.id,wallet,signedMessage:Buffer.from(message).toString('base64'),signature:signature.toString('base64')};const auth=await app.inject({method:'POST',url:'/auth/verify',payload});assert.equal(auth.statusCode,200,auth.body);return {keys,wallet,token:auth.json().token,headers:{authorization:`Bearer ${auth.json().token}`},payload};}
function paidTx(o:Order,sig:string){const keys=[o.wallet,o.source,o.mint,o.destination,o.reference,TOKEN_PROGRAM,MEMO_PROGRAM];const data=Buffer.alloc(10);data[0]=12;data.writeBigUInt64LE(BigInt(o.amount),1);data[9]=o.decimals;const balance=(accountIndex:number,owner:string,amount:string)=>({accountIndex,owner,mint:o.mint,uiTokenAmount:{amount,decimals:o.decimals}});return {slot:42,blockTime:Math.floor(Date.now()/1000),transaction:{signatures:[sig],message:{header:{numRequiredSignatures:1},accountKeys:keys,instructions:[{programIdIndex:5,accounts:[1,2,3,0,4],data:b58(data)},{programIdIndex:6,accounts:[],data:b58(Buffer.from(o.memo))}]}},meta:{err:null,preTokenBalances:[balance(1,o.wallet,o.amount),balance(3,o.recipient,'0')],postTokenBalances:[balance(1,o.wallet,'0'),balance(3,o.recipient,o.amount)]}};}
async function quote(user:Awaited<ReturnType<typeof login>>,sku='campaign',idempotencyKey=randomUUID()){const r=await app.inject({method:'POST',url:'/orders',headers:user.headers,payload:{sku,idempotencyKey}});assert.equal(r.statusCode,200,r.body);return r.json<Order>();}
test('signed authentication consumes one nonce, enforces account isolation and supports revocation',async()=>{
 assert.equal((await app.inject({method:'GET',url:'/me'})).statusCode,401);
 const user=await login();assert.equal((await app.inject({method:'POST',url:'/auth/verify',payload:user.payload})).statusCode,401);
 const c=(await app.inject({method:'POST',url:'/auth/challenge',payload:{wallet:user.wallet}})).json<SignInChallenge>();assert.equal((await app.inject({method:'POST',url:'/auth/verify',payload:{...user.payload,id:c.id}})).statusCode,401,'Old signed message cannot satisfy a new nonce');
 const expired=await login();await pool.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE wallet=$1",[expired.wallet]);assert.equal((await app.inject({method:'GET',url:'/me',headers:expired.headers})).statusCode,401);
 const expiryChallenge=await service.challenge(expired.wallet);const expiryMessage=createSignInMessage(expiryChallenge.payload);await pool.query("UPDATE auth_challenges SET expires_at=now()-interval '1 second' WHERE id=$1",[expiryChallenge.id]);assert.equal((await app.inject({method:'POST',url:'/auth/verify',payload:{id:expiryChallenge.id,wallet:expired.wallet,signedMessage:Buffer.from(expiryMessage).toString('base64'),signature:sign(null,expiryMessage,expired.keys.privateKey).toString('base64')}})).statusCode,401);
 assert.equal((await app.inject({method:'GET',url:'/me',headers:user.headers})).json().wallet,user.wallet);
 await app.inject({method:'POST',url:'/auth/logout',headers:user.headers});assert.equal((await app.inject({method:'GET',url:'/me',headers:user.headers})).statusCode,401);
});
test('orders bind prices, isolate wallets, reject forged transfers and fulfill duplicate callbacks only once',async()=>{
 const user=await login(),other=await login(),key=randomUUID(),order=await quote(user,'campaign',key);assert.equal(order.amount,'50000000');assert.equal((await quote(user,'campaign',key)).id,order.id);
 assert.equal((await app.inject({method:'POST',url:'/orders',headers:user.headers,payload:{sku:'night-courier',idempotencyKey:key}})).statusCode,409);
 assert.equal((await app.inject({method:'GET',url:`/orders/${order.id}`,headers:other.headers})).statusCode,404);
 assert.equal((await app.inject({method:'POST',url:'/orders',headers:user.headers,payload:{sku:'campaign',idempotencyKey:randomUUID(),amount:'1'}})).statusCode,400);
 const forged=b58(randomBytes(64)),bad=paidTx(order,forged);bad.transaction.message.accountKeys[2]=pub();transactions.set(forged,bad);
 await app.inject({method:'POST',url:`/orders/${order.id}/transaction`,headers:user.headers,payload:{signature:forged}});assert.deepEqual((await service.me(user.wallet)).entitlements,[]);
 const sig=b58(randomBytes(64));transactions.set(sig,paidTx(order,sig));const send=()=>app.inject({method:'POST',url:`/orders/${order.id}/transaction`,headers:user.headers,payload:{signature:sig}});
 const results=await Promise.all([send(),send()]);for(const r of results){assert.equal(r.statusCode,200,r.body);assert.equal(r.json().status,'fulfilled');}
 assert.deepEqual((await service.me(user.wallet)).entitlements,['campaign']);assert.equal(Number((await pool.query('SELECT count(*) FROM payment_receipts WHERE order_id=$1',[order.id])).rows[0].count),1);
 assert.equal((await app.inject({method:'POST',url:'/orders',headers:user.headers,payload:{sku:'campaign',idempotencyKey:randomUUID()}})).statusCode,409);
 assert.deepEqual((await service.me(other.wallet)).entitlements,[]);
});
test('lost callback is recovered by reference and restored from a new service instance; equipment requires ownership',async()=>{
 const user=await login(),o=await quote(user,'night-courier'),sig=b58(randomBytes(64));transactions.set(sig,paidTx(o,sig));references.set(o.reference,[sig]);
 assert.equal((await app.inject({method:'PUT',url:'/me/equipment',headers:user.headers,payload:{sku:'night-courier'}})).statusCode,403);
 const recovered=await app.inject({method:'POST',url:`/orders/${o.id}/reconcile`,headers:user.headers});assert.equal(recovered.statusCode,200,recovered.body);assert.equal(recovered.json().status,'fulfilled');
 const restarted=new CommerceService(pool,chain,service.config);assert.deepEqual((await restarted.me(user.wallet)).entitlements,['night-courier']);
 const equipped=await app.inject({method:'PUT',url:'/me/equipment',headers:user.headers,payload:{sku:'night-courier'}});assert.equal(equipped.json().equipment.outfit,'night-courier');
});
test('payment verifier rejects wrong buyer, token, amount, destination, reference, failed execution and absent finality',async()=>{
 const user=await login(),order=await quote(user),sig=b58(randomBytes(64)),good=paidTx(order,sig);assert.equal(verifyPayment(order,sig,good).state,'verified');assert.equal(verifyPayment(order,sig,null).state,'pending');
 const mutations:((v:ReturnType<typeof paidTx>)=>void)[]=[v=>{v.transaction.message.header.numRequiredSignatures=0;},v=>{v.transaction.message.accountKeys[2]=pub();},v=>{v.transaction.message.accountKeys[3]=pub();},v=>{v.transaction.message.accountKeys[4]=pub();},v=>{v.transaction.message.accountKeys[5]=pub();},v=>{v.transaction.message.instructions[0]!.data=b58(Buffer.alloc(10));},v=>{v.transaction.message.instructions.pop();},v=>{v.meta.postTokenBalances[1]!.uiTokenAmount.amount='0';},v=>{v.meta.preTokenBalances[0]!.owner=pub();}];
 for(const mutate of mutations){const bad=structuredClone(good);mutate(bad);assert.equal(verifyPayment(order,sig,bad).state,'invalid');}
 assert.equal(verifyPayment(order,sig,{...good,meta:{...good.meta,err:{InstructionError:[0,'Custom']}}}).state,'invalid');
 assert.equal(verifyPayment(order,sig,{...good,blockTime:Math.floor(new Date(order.expiresAt).getTime()/1000)+60}).state,'needs_review');
});

test('campaign progress sync requires access, preserves best records and isolates wallets',async()=>{
 const user=await login(),other=await login(),payload={version:1,missions:{practice:{stars:2,seconds:25,score:11500,battery:60,completions:2}}};
 assert.equal((await app.inject({method:'PUT',url:'/me/progress',headers:user.headers,payload})).statusCode,403);
 const order=await quote(user),sig=b58(randomBytes(64));transactions.set(sig,paidTx(order,sig));await service.attach(user.wallet,order.id,sig);
 const result=await app.inject({method:'PUT',url:'/me/progress',headers:user.headers,payload});assert.equal(result.statusCode,200,result.body);assert.deepEqual(result.json().progress,payload);
 const better={version:1,missions:{practice:{stars:3,seconds:20,score:12000,battery:80,completions:3}}};
 await Promise.all([app.inject({method:'PUT',url:'/me/progress',headers:user.headers,payload:better}),app.inject({method:'PUT',url:'/me/progress',headers:user.headers,payload})]);
 assert.deepEqual((await service.me(user.wallet)).progress,better);assert.deepEqual((await service.me(other.wallet)).progress,{});
 assert.equal((await app.inject({method:'PUT',url:'/me/progress',headers:user.headers,payload:{...payload,wallet:other.wallet}})).statusCode,400);
 assert.equal((await app.inject({method:'PUT',url:'/me/progress',headers:user.headers,payload:{version:1,missions:{practice:{...payload.missions.practice,stars:8}}}})).statusCode,400);
});

test('payment preparation is wallet-bound and concurrent retries reuse the same transaction lifetime',async()=>{
 const user=await login(),other=await login(),o=await quote(user);
 const prepare=()=>app.inject({method:'POST',url:`/orders/${o.id}/prepare`,headers:user.headers,payload:{}});
 assert.equal((await app.inject({method:'POST',url:`/orders/${o.id}/prepare`,headers:other.headers,payload:{}})).statusCode,404);
 const [a,b]=await Promise.all([prepare(),prepare()]);assert.equal(a.statusCode,200,a.body);assert.equal(b.statusCode,200,b.body);
 assert.deepEqual(a.json().payment,b.json().payment);assert.equal(a.json().status,'verifying');
 assert.deepEqual((await prepare()).json().payment,a.json().payment);
});
test('expired approval rotates only after finalized reference scan; missing callback restores the purchase',async()=>{
 const user=await login(),o=await quote(user),first=await service.preparePayment(user.wallet,o.id);
 chainHeight=Number(first.payment!.lastValidBlockHeight)+1;
 chainUnavailable=true;try{await assert.rejects(service.preparePayment(user.wallet,o.id),/RPC unavailable/);}finally{chainUnavailable=false;}
 assert.deepEqual((await service.getOrder(user.wallet,o.id)).payment,first.payment,'RPC failure must preserve pending authorization');
 const next=await service.preparePayment(user.wallet,o.id);assert.notEqual(next.payment!.id,first.payment!.id);
 const sig=b58(randomBytes(64));transactions.set(sig,paidTx(next,sig));references.set(next.reference,[sig]);
 chainHeight=Number(next.payment!.lastValidBlockHeight)+1;
 const restored=await service.preparePayment(user.wallet,o.id);assert.equal(restored.status,'fulfilled');assert.equal(restored.payment!.id,next.payment!.id,'No new payment is prepared after recovery');
 assert.deepEqual((await service.me(user.wallet)).entitlements,['campaign']);
});
test('incomplete finalized RPC history blocks reapproval; an expired unpaid quote can be replaced',async()=>{
 const user=await login(),o=await quote(user),first=await service.preparePayment(user.wallet,o.id);chainHeight=Number(first.payment!.lastValidBlockHeight)+1;
 const sig=b58(randomBytes(64));references.set(o.reference,[sig]);await assert.rejects(service.preparePayment(user.wallet,o.id),/reconciliation/);assert.deepEqual((await service.getOrder(user.wallet,o.id)).payment,first.payment);
 references.set(o.reference,[]);await pool.query("UPDATE orders SET expires_at=now()-interval '1 minute' WHERE id=$1",[o.id]);
 const expired=await service.preparePayment(user.wallet,o.id);assert.equal(expired.status,'quoted');assert.equal(expired.payment,undefined);
 const replacement=await quote(user);assert.notEqual(replacement.id,o.id);
});

async function campaignOwner(){const user=await login(),o=await quote(user),sig=b58(randomBytes(64));transactions.set(sig,paidTx(o,sig));await service.attach(user.wallet,o.id,sig);return user;}
async function rankStart(user:Awaited<ReturnType<typeof login>>){const manifest=await ranked.daily();const r=await app.inject({method:'POST',url:'/runs',headers:user.headers,payload:{day:manifest.day,rulesHash:manifest.rulesHash,requestKey:randomUUID()}});assert.equal(r.statusCode,200,r.body);return r.json<RunTicket>();}
test('daily tickets bind rules, require campaign ownership and reject another wallet, stale clients and instant runs',async()=>{
 const unowned=await login(),manifest=(await app.inject({method:'GET',url:'/daily'})).json<DailyManifest>();assert.equal(manifest.mission,'practice');assert.equal(manifest.seed,0);assert.equal(manifest.loadout,'standard');
 const payload={day:manifest.day,rulesHash:manifest.rulesHash,requestKey:randomUUID()};assert.equal((await app.inject({method:'POST',url:'/runs',headers:unowned.headers,payload})).statusCode,403);
 const user=await campaignOwner();assert.equal((await app.inject({method:'POST',url:'/runs',headers:user.headers,payload:{...payload,rulesHash:'a'.repeat(64)}})).statusCode,409);
 const run=await rankStart(user);assert.equal((await app.inject({method:'GET',url:`/runs/${run.id}`,headers:unowned.headers})).statusCode,404);
 assert.equal((await app.inject({method:'POST',url:'/runs',headers:user.headers,payload})).statusCode,409);
 const body={rulesHash:manifest.rulesHash,replay:fixtureReplay().replay};assert.equal((await app.inject({method:'POST',url:`/runs/${run.id}/finish`,headers:user.headers,payload:body})).statusCode,400);
 const abandon=await app.inject({method:'POST',url:`/runs/${run.id}/abandon`,headers:user.headers,payload:{}});assert.equal(abandon.json().status,'abandoned');
 rankClock=new Date(rankClock.getTime()+20000);assert.equal((await app.inject({method:'POST',url:`/runs/${run.id}/finish`,headers:user.headers,payload:body})).statusCode,409);
});
test('ranked input replay survives worker restart, rejects changed reuse and publishes only a computed best',async()=>{
 const user=await campaignOwner(),run=await rankStart(user),{state,replay}=fixtureReplay();assert.equal(state.status,'won');rankClock=new Date(rankClock.getTime()+20000);
 const payload={rulesHash:run.manifest.rulesHash,replay},send=()=>app.inject({method:'POST',url:`/runs/${run.id}/finish`,headers:user.headers,payload});
 const first=await send();assert.equal(first.statusCode,200,first.body);assert.equal(first.json().status,'verifying');assert.equal((await send()).json().status,'verifying');
 assert.equal((await app.inject({method:'POST',url:`/runs/${run.id}/finish`,headers:user.headers,payload:{...payload,replay:{version:1,chunks:[{x:0,y:0,buttons:0,ticks:1}]}}})).statusCode,409);
 await pool.query("UPDATE ranked_runs SET lease_until=now()+interval '1 minute' WHERE id=$1",[run.id]);assert.equal(await ranked.process(),0);
 await pool.query("UPDATE ranked_runs SET lease_until=now()-interval '1 second' WHERE id=$1",[run.id]);const restarted=new RankedService(pool,{now:()=>rankClock});assert.equal(await restarted.process(),1);
 const finished=await ranked.get(user.wallet,run.id);assert.equal(finished.status,'verified');assert.equal(finished.result?.score,state.score);assert.equal(finished.result?.ticks,state.ticks);
 assert.equal((await send()).json().status,'verified');assert.equal(await ranked.process(),0);
 const board=(await app.inject({method:'GET',url:`/daily/${run.manifest.day}/leaderboard`,headers:user.headers})).json();assert.equal(board.personal.wallet,user.wallet);assert.equal(board.personal.score,state.score);assert.equal(board.entries.filter((x:{wallet:string})=>x.wallet===user.wallet).length,1);
 const next=await rankStart(user);rankClock=new Date(rankClock.getTime()+20000);await ranked.submit(user.wallet,next.id,{rulesHash:next.manifest.rulesHash,replay});await ranked.process();assert.equal((await ranked.leaderboard(run.manifest.day,user.wallet)).entries.filter(x=>x.wallet===user.wallet).length,1);
});
test('expired tickets, unfinished runs and invalid action replays never enter the leaderboard',async()=>{
 const user=await campaignOwner(),expired=await rankStart(user);rankClock=new Date(new Date(expired.expiresAt).getTime()+1);
 await assert.rejects(ranked.submit(user.wallet,expired.id,{rulesHash:expired.manifest.rulesHash,replay:{version:1,chunks:[{x:0,y:0,buttons:0,ticks:1}]}}),/expired/);
 const incomplete=await rankStart(user);rankClock=new Date(rankClock.getTime()+1000);await ranked.submit(user.wallet,incomplete.id,{rulesHash:incomplete.manifest.rulesHash,replay:{version:1,chunks:[{x:0,y:0,buttons:0,ticks:1}]}});await ranked.process();assert.equal((await ranked.get(user.wallet,incomplete.id)).status,'rejected');
 const invalid=await rankStart(user);rankClock=new Date(rankClock.getTime()+1000);await ranked.submit(user.wallet,invalid.id,{rulesHash:invalid.manifest.rulesHash,replay:{version:1,chunks:[{x:0,y:0,buttons:2,ticks:2}]}});await ranked.process();assert.equal((await ranked.get(user.wallet,invalid.id)).status,'rejected');assert.equal((await ranked.leaderboard(invalid.manifest.day,user.wallet)).personal,null);
});

test('leaderboard keeps top fifty rows and the signed-in player even when sixty players tie',async()=>{
 const manifest=await ranked.daily(),day='2025-01-01';await pool.query('INSERT INTO daily_manifests(day,manifest) VALUES($1,$2) ON CONFLICT DO NOTHING',[day,{...manifest,day}]);
 const wallets=Array.from({length:60},()=>pub()).sort();
 for(const wallet of wallets){await pool.query('INSERT INTO wallets(address) VALUES($1)',[wallet]);await pool.query("INSERT INTO ranked_runs(id,wallet,day,request_key,manifest,status,issued_at,expires_at,result) VALUES($1,$2,$3,$4,$5,'verified',now(),now(),$6)",[randomUUID(),wallet,day,randomUUID(),{...manifest,day},{status:'won',score:12000,ticks:400,seconds:400/30,battery:100,delivered:1,spotted:false}]);}
 const board=await ranked.leaderboard(day,wallets[59]);assert.equal(board.entries.length,50);assert.deepEqual(board.entries.map(e=>e.wallet),wallets.slice(0,50));assert.equal(board.personal?.wallet,wallets[59]);assert.equal(board.personal?.rank,1);assert(board.entries.every(e=>e.rank===1));
});
