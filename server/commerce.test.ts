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
import type {Order,PaymentQuote,SignInChallenge} from '../shared/commerce';
import {RankedService,dailyMission} from './ranked-service';
import {fixtureReplay} from '../tests/fixtures/replay';
import {PaidService} from './paid-service';
import {OperatorReview,type ReviewRequest} from './operator-review';
import {ReplayInvalidError,verifyReplayInWorker} from './replay-runner';
import type {PaidEntry} from '../shared/paid';
import {paymentTransaction} from '../src/commerce/payment';
import {initialState,idleInput} from '../src/game/simulation';
import {recordStep} from '../src/game/recording';
import type {ReplayChunk} from '../shared/replay';
import {ReturnService, RETURN_FEE_RESERVE, type ReturnChain, type ReturnInspection, type SignedReturn} from './returns';
import type {DailyManifest,RunTicket} from '../shared/ranked';
const b58=(b:Uint8Array)=>getBase58Decoder().decode(b),pub=()=>b58(randomBytes(32));
const pool=database('postgresql://localhost/seeker_clockin_test');
const transactions=new Map<string,unknown>(),references=new Map<string,string[]>();
let chainHeight=100,chainUnavailable=false;
const chain:PaymentChain={ready:async()=>{},verify:async(o,s)=>verifyPayment(o,s,transactions.get(s)??null),find:async r=>{if(chainUnavailable)throw new Error('RPC unavailable');return references.get(r)||[];},lifetime:async()=>({blockhash:pub(),lastValidBlockHeight:String(chainHeight+150),contextSlot:String(chainHeight+1000)}),height:async()=>chainHeight};
let rankClock=new Date('2026-01-01T12:00:00Z');while(dailyMission(rankClock)!=='practice')rankClock=new Date(rankClock.getTime()+86400000);
const ranked=new RankedService(pool,{now:()=>rankClock});
let service:CommerceService,app:Awaited<ReturnType<typeof createApp>>;
before(async()=>{assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name,'seeker_clockin_test');await migrate(pool);await pool.query('TRUNCATE league_weeks,daily_manifests,wallets,auth_challenges,sessions,orders,order_attempts,payment_receipts,entitlements,transfer_receipts CASCADE');const mint=pub(),recipient=pub();const [destination]=await findAssociatedTokenPda({owner:address(recipient),mint:address(mint),tokenProgram:address(TOKEN_PROGRAM)});service=new CommerceService(pool,chain,{mint,recipient,destination,decimals:6,identityUri:'https://github.com/bluntbrain'});app=await createApp(service,ranked);});
after(async()=>{await app.close();await pool.end();});
let testClient=0;
async function login(){const remoteAddress=`127.0.1.${++testClient}`,keys=generateKeyPairSync('ed25519'),wallet=b58(keys.publicKey.export({type:'spki',format:'der'}).subarray(-32));const response=await app.inject({method:'POST',url:'/auth/challenge',remoteAddress,payload:{wallet}});assert.equal(response.statusCode,200);const c=response.json<SignInChallenge>(),message=createSignInMessage(c.payload),signature=sign(null,message,keys.privateKey);const payload={id:c.id,wallet,signedMessage:Buffer.from(message).toString('base64'),signature:signature.toString('base64')};const auth=await app.inject({method:'POST',url:'/auth/verify',remoteAddress,payload});assert.equal(auth.statusCode,200,auth.body);return {keys,wallet,token:auth.json().token,headers:{authorization:`Bearer ${auth.json().token}`},payload};}
function paidTx(o:PaymentQuote,sig:string){const keys=[o.wallet,o.source,o.mint,o.destination,o.reference,TOKEN_PROGRAM,MEMO_PROGRAM];const data=Buffer.alloc(10);data[0]=12;data.writeBigUInt64LE(BigInt(o.amount),1);data[9]=o.decimals;const balance=(accountIndex:number,owner:string,amount:string)=>({accountIndex,owner,mint:o.mint,uiTokenAmount:{amount,decimals:o.decimals}});return {slot:42,blockTime:Math.floor(Date.now()/1000),transaction:{signatures:[sig],message:{header:{numRequiredSignatures:1},accountKeys:keys,instructions:[{programIdIndex:5,accounts:[1,2,3,0,4],data:b58(data)},{programIdIndex:6,accounts:[],data:b58(Buffer.from(o.memo))}]}},meta:{err:null,preTokenBalances:[balance(1,o.wallet,o.amount),balance(3,o.recipient,'0')],postTokenBalances:[balance(1,o.wallet,'0'),balance(3,o.recipient,o.amount)]}};}
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
 const user=await login(),other=await login(),key=randomUUID(),order=await quote(user,'campaign',key);assert.equal(order.amount,'100000000');assert.equal((await quote(user,'campaign',key)).id,order.id);
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

test('leaderboard returns the nearest better rank outside the top fifty, while exact ties share rank',async()=>{
 const base=await ranked.daily(),day='2025-01-02',manifest={...base,day};await pool.query('INSERT INTO daily_manifests(day,manifest) VALUES($1,$2)',[day,manifest]);
 const people=Array.from({length:64},()=>pub());
 for(const [i,wallet] of people.entries()){await pool.query('INSERT INTO wallets(address) VALUES($1)',[wallet]);await pool.query("INSERT INTO ranked_runs(id,wallet,day,request_key,manifest,status,issued_at,expires_at,result) VALUES($1,$2,$3,$4,$5,'verified',now(),now(),$6)",[randomUUID(),wallet,day,randomUUID(),manifest,{status:'won',score:20000-(i>=62?62:i),ticks:400,seconds:400/30,battery:100,delivered:1,spotted:false}]);}
 const board=await ranked.leaderboard(day,people[63]);assert.equal(board.entries.length,50);assert.equal(board.personal?.rank,63);assert.equal(board.rival?.rank,62);assert.equal(board.rival?.wallet,people[61]);assert.equal(board.rival!.score-board.personal!.score,1);
 assert.equal((await ranked.leaderboard(day,people[0])).rival,null);assert.equal((await ranked.leaderboard(day)).personal,null);
});

async function returnHarness(tokens=100_000_000n,lamports=100_000_000n,returnConfig?:{mint:string;treasury:string;source:string;decimals:number}){
 await pool.query('TRUNCATE return_allocations,return_attempts,return_reservations CASCADE');
 await pool.query("DELETE FROM transfer_receipts WHERE source_kind='paid_entry'");
 const user=await login(),other=await login(),config=returnConfig??{mint:pub(),treasury:pub(),source:pub(),decimals:6};
 const sent:SignedReturn[]=[],prepared:SignedReturn[]=[],minimumSlots:number[]=[];
 let inspection:ReturnInspection={state:'pending',detail:'Waiting.'},sendError=false,prepareError=false,beforeBroadcastError=false,onBalanceRead:(()=>Promise<void>)|undefined,beforeSave:(()=>Promise<void>)|undefined;
 const chain:ReturnChain={available:async min=>{minimumSlots.push(min??0);if(onBalanceRead)await onBalanceRead();return {tokens,lamports};},prepare:async()=>{const signed={signature:b58(randomBytes(64)),wire:randomBytes(80).toString('base64'),blockhash:pub(),lastValidHeight:'500',contextSlot:'200'};prepared.push(signed);if(beforeSave)await beforeSave();if(prepareError)throw new Error('Crash before persistence');return signed;},inspect:async()=>inspection,broadcast:async attempt=>{assert.equal((await pool.query('SELECT wire FROM return_attempts WHERE signature=$1',[attempt.signature])).rows[0]?.wire,attempt.wire,'bytes must exist durably before broadcast');if(beforeBroadcastError)throw new Error('Crash before broadcast');sent.push(attempt);if(sendError)throw new Error('RPC response lost after broadcast');}};
 const service=new ReturnService(pool,chain,config);
 const retry=async()=>{await pool.query("UPDATE return_allocations SET process_after=now()-interval '1 second',lease_until=NULL");};
 return {user,other,config,chain,service,sent,prepared,minimumSlots,retry,setInspection:(i:ReturnInspection)=>{inspection=i;},setSendError:(v:boolean)=>{sendError=v;},setPrepareError:(v:boolean)=>{prepareError=v;},setBeforeBroadcastError:(v:boolean)=>{beforeBroadcastError=v;},onBalanceRead:(fn:()=>Promise<void>)=>{onBalanceRead=fn;},beforeSave:(fn:()=>Promise<void>)=>{beforeSave=fn;}};
}
test('return reservations serialize capacity, preserve idempotency and cover token plus SOL liabilities',async()=>{
 const h=await returnHarness(10_000_000n,RETURN_FEE_RESERVE),key=randomUUID();
 const results=await Promise.allSettled([h.service.reserve(h.user.wallet,key,10_000_000n),h.service.reserve(h.other.wallet,randomUUID(),10_000_000n)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
 const row=(await pool.query('SELECT * FROM return_reservations')).rows[0];assert.equal((await h.service.reserve(row.wallet,row.external_key,10_000_000n)).id,row.id);
 await assert.rejects(h.service.reserve(row.wallet,row.external_key,1n),/different return/);
 await h.service.release(row.id,'unpaid-finalized-expiry');await h.service.reserve(h.user.wallet,randomUUID(),10_000_000n);
 const insufficientFee=await returnHarness(100_000_000n,RETURN_FEE_RESERVE-1n);await assert.rejects(insufficientFee.service.reserve(insufficientFee.user.wallet,randomUUID(),1n),/network costs/);
});
test('one return allocation per entry, owner-only status, and allocated liability cannot be released',async()=>{
 const h=await returnHarness(),r=await h.service.reserve(h.user.wallet,randomUUID(),10_000_000n);
 const [a,b]=await Promise.all([h.service.allocate(r.id,'success'),h.service.allocate(r.id,'success')]);assert.equal(a.id,b.id);
 await assert.rejects(h.service.allocate(r.id,'refund'),/different allocated outcome/);await assert.rejects(h.service.release(r.id,'verified-loss'),/cannot be released/);
 await assert.rejects(h.service.status(h.other.wallet,a.id),/not found/);const status=await h.service.status(h.user.wallet,a.id);assert.equal(status.state,'queued');assert(!('wire' in status));
 const mine=await app.inject({method:'GET',url:`/returns/${a.id}`,headers:h.user.headers});assert.equal(mine.statusCode,200);assert.equal(mine.json().wallet,h.user.wallet);assert(!('wire' in mine.json()));assert.equal((await app.inject({method:'GET',url:`/returns/${a.id}`,headers:h.other.headers})).statusCode,404);assert.equal((await app.inject({method:'GET',url:`/returns/${a.id}`})).statusCode,401);assert.equal((await app.inject({method:'POST',url:`/returns/${a.id}`,headers:h.user.headers,payload:{outcome:'success'}})).statusCode,404);
});
test('lost return callback and process restart reuse the exact persisted signature and settle once',async()=>{
 const h=await returnHarness(),r=await h.service.reserve(h.user.wallet,randomUUID(),10_000_000n),a=await h.service.allocate(r.id,'success');
 h.setSendError(true);await h.service.process();assert.equal(h.sent.length,1);assert.equal(h.prepared.length,1);
 await h.retry();h.setSendError(false);const restarted=new ReturnService(pool,h.chain,h.config);await restarted.process();assert.equal(h.sent.length,2);assert.equal(h.sent[0]!.signature,h.sent[1]!.signature);assert.equal(h.sent[0]!.wire,h.sent[1]!.wire);assert.equal(h.prepared.length,1);
 await h.retry();h.setInspection({state:'settled',slot:999});await restarted.process();assert.equal((await h.service.status(h.user.wallet,a.id)).state,'settled');assert.equal((await pool.query('SELECT state FROM return_reservations WHERE id=$1',[r.id])).rows[0].state,'settled');
 await h.retry();assert.equal(await restarted.process(),false);assert.equal(h.sent.length,2);
 await h.service.reserve(h.user.wallet,randomUUID(),1n);assert.equal(h.minimumSlots.at(-1),999,'new capacity reads cannot precede the settled payout');
});
test('return worker crash before persistence never broadcasts the discarded transaction',async()=>{
 const h=await returnHarness(),r=await h.service.reserve(h.user.wallet,randomUUID(),10_000_000n);await h.service.allocate(r.id,'refund');h.setPrepareError(true);
 await h.service.process();assert.equal(h.sent.length,0);assert.equal((await pool.query('SELECT count(*) FROM return_attempts')).rows[0].count,'0');
 h.setPrepareError(false);await h.retry();await h.service.process();assert.equal(h.prepared.length,2);assert.equal(h.sent.length,1);assert.equal(h.sent[0]!.signature,h.prepared[1]!.signature);
});
test('stale return worker cannot persist or broadcast after its lease is replaced',async()=>{
 const h=await returnHarness(),r=await h.service.reserve(h.user.wallet,randomUUID(),10_000_000n),a=await h.service.allocate(r.id,'success');
 h.beforeSave(async()=>{await pool.query("UPDATE return_allocations SET lease_token=$2,lease_until=now()+interval '10 minutes' WHERE id=$1",[a.id,randomUUID()]);});
 await h.service.process();assert.equal(h.sent.length,0);assert.equal((await pool.query('SELECT count(*) FROM return_attempts')).rows[0].count,'0');
 assert.equal(await h.service.process(),false);
});
test('expired return lifetime replaces only after definitive inspection; unexpected finalized transfer keeps reserve',async()=>{
 const h=await returnHarness(),r=await h.service.reserve(h.user.wallet,randomUUID(),10_000_000n),a=await h.service.allocate(r.id,'success');
 await h.service.process();h.setInspection({state:'expired',detail:'Finalized non-execution.'});await h.retry();await h.service.process();assert.equal(h.prepared.length,2);assert.notEqual(h.sent[0]!.signature,h.sent[1]!.signature);
 assert.equal((await pool.query('SELECT state FROM return_attempts ORDER BY sequence')).rows[0].state,'expired');
 h.setInspection({state:'review',detail:'Wrong transfer.'});await h.retry();await h.service.process();assert.equal((await h.service.status(h.user.wallet,a.id)).state,'review');assert.equal((await pool.query('SELECT state FROM return_reservations WHERE id=$1',[r.id])).rows[0].state,'held');
});
test('two settlement workers claim one job and a replacement recovers a persisted unbroadcast attempt',async()=>{
 const h=await returnHarness(),r=await h.service.reserve(h.user.wallet,randomUUID(),10_000_000n),a=await h.service.allocate(r.id,'success');
 h.setBeforeBroadcastError(true);const outcomes=await Promise.all([h.service.process(),new ReturnService(pool,h.chain,h.config).process()]);assert.equal(outcomes.filter(Boolean).length,1);assert.equal(h.prepared.length,1);assert.equal(h.sent.length,0);assert.equal((await pool.query('SELECT count(*) FROM return_attempts WHERE allocation_id=$1',[a.id])).rows[0].count,'1');
 h.setBeforeBroadcastError(false);await h.retry();await new ReturnService(pool,h.chain,h.config).process();assert.equal(h.sent.length,1);assert.equal(h.prepared.length,1);
});

test('settlement cannot release a liability while a reservation holds a pre-transfer balance snapshot',async()=>{
 const h=await returnHarness(20_000_000n),r=await h.service.reserve(h.user.wallet,randomUUID(),10_000_000n),a=await h.service.allocate(r.id,'success');await h.service.process();await h.retry();h.setInspection({state:'settled',slot:999});
 let releaseBalance!:()=>void,observed!:()=>void;
 const balanceCaptured=new Promise<void>(resolve=>{observed=resolve;}),continueBalance=new Promise<void>(resolve=>{releaseBalance=resolve;});
 h.onBalanceRead(async()=>{observed();await continueBalance;});
 const reserved=h.service.reserve(h.other.wallet,randomUUID(),20_000_000n).then(value=>({ok:true,value}),error=>({ok:false,error}));
 await balanceCaptured;const settled=h.service.process();
 let waiting=false;try{const deadline=Date.now()+2000;while(Date.now()<deadline){const rows=await pool.query("SELECT 1 FROM pg_locks WHERE locktype='advisory' AND objid=1936024940 AND NOT granted AND database=(SELECT oid FROM pg_database WHERE datname=current_database())");if(rows.rowCount){waiting=true;break;}await new Promise(resolve=>setTimeout(resolve,10));}}finally{releaseBalance();}
 const result=await reserved;await settled;assert(waiting,'settlement must wait on the capacity lock');assert.equal(result.ok,false,'the in-flight liability still consumes the stale balance');assert.equal((await h.service.status(h.user.wallet,a.id)).state,'settled');
});

async function paidHarness(t:{after:(fn:()=>Promise<void>)=>void},options:{tokens?:bigint;verify?:typeof import('./replay-runner').verifyReplayInWorker}={}){
 const h=await returnHarness(options.tokens??100_000_000n,100_000_000n,{mint:service.config.mint,treasury:service.config.recipient,source:service.config.destination,decimals:service.config.decimals});
 const pass=await quote(h.user),passSig=b58(randomBytes(64));transactions.set(passSig,paidTx(pass,passSig));await service.attach(h.user.wallet,pass.id,passSig);
 let now=new Date(),height=100,unavailable=false;
 const txs=new Map<string,unknown>(),refs=new Map<string,string[]>();
 const entryChain:PaymentChain={ready:async()=>{if(unavailable)throw new Error('RPC unavailable');},verify:async(o,s)=>verifyPayment(o,s,txs.get(s)??null),find:async ref=>{if(unavailable)throw new Error('RPC unavailable');return refs.get(ref)??[];},lifetime:async()=>{if(unavailable)throw new Error('RPC unavailable');return {blockhash:pub(),lastValidBlockHeight:String(height+150),contextSlot:'200'};},height:async()=>height};
 const make=()=>new PaidService(pool,entryChain,service.config,h.service,{enabled:true,now:()=>now,...(options.verify?{verify:options.verify}:{})});
 const paid=make(),api=await createApp(service,ranked,paid);t.after(()=>api.close());
 const post=(path:string,body:Record<string,unknown>={},user=h.user)=>api.inject({method:'POST',url:path,headers:user.headers,payload:body});
 const quoteEntry=async()=>{const r=await post('/paid/entries',{requestKey:randomUUID(),termsVersion:'devnet-v1'});assert.equal(r.statusCode,200,r.body);return r.json<PaidEntry>();};
 const pay=async(entry:PaidEntry,attach=true)=>{const sig=b58(randomBytes(64)),tx=paidTx(entry.quote,sig);tx.blockTime=Math.floor(now.getTime()/1000);txs.set(sig,tx);refs.set(entry.quote.reference,[sig]);if(attach){const r=await post(`/paid/entries/${entry.id}/transaction`,{signature:sig});assert.equal(r.statusCode,200,r.body);return {entry:r.json<PaidEntry>(),sig,tx};}return {entry,sig,tx};};
 const startKeys=new Map<string,string>();
 const start=async(entry:PaidEntry)=>{const startKey=startKeys.get(entry.id)??randomUUID();startKeys.set(entry.id,startKey);const r=await post(`/paid/entries/${entry.id}/start`,{rulesHash:entry.manifest.rulesHash,startKey});assert.equal(r.statusCode,200,r.body);return r.json<PaidEntry>();};
 return {...h,paid,api,post,quoteEntry,pay,start,txs,refs,entryChain,restart:make,advance:(ms:number)=>{now=new Date(now.getTime()+ms);},blocks:(n:number)=>{height=n;},rpcUnavailable:(v:boolean)=>{unavailable=v;}};
}
test('paid entry requires terms and campaign ownership, reserves once, and refuses insufficient return capacity',async t=>{
 const h=await paidHarness(t);assert.equal((await app.inject({method:'GET',url:'/paid/challenge'})).json().enabled,false);
 assert.equal((await h.post('/paid/entries',{requestKey:randomUUID()})).statusCode,400);
 assert.equal((await h.post('/paid/entries',{requestKey:randomUUID(),termsVersion:'devnet-v1',amount:'1'})).statusCode,400);
 assert.equal((await h.post('/paid/entries',{requestKey:randomUUID(),termsVersion:'devnet-v1'},h.other)).statusCode,403);
 const [a,b]=await Promise.all([h.quoteEntry(),h.quoteEntry()]);assert.equal(a.id,b.id);assert.equal(a.quote.amount,'10000000');assert.equal(a.status,'quoted');assert.equal((await pool.query('SELECT count(*) FROM return_reservations')).rows[0].count,'1');
 assert.equal((await h.post(`/paid/entries/${a.id}/start`,{rulesHash:a.manifest.rulesHash,startKey:randomUUID()})).statusCode,409);
 const empty=await paidHarness(t,{tokens:0n});assert.equal((await empty.post('/paid/entries',{requestKey:randomUUID(),termsVersion:'devnet-v1'})).statusCode,503);assert.equal((await pool.query('SELECT count(*) FROM paid_entries')).rows[0].count,'0');assert.equal((await pool.query('SELECT count(*) FROM return_reservations')).rows[0].count,'0');
});
test('paid approvals keep identical bytes and lost callbacks restore one unstarted entry',async t=>{
 const h=await paidHarness(t),entry=await h.quoteEntry();
 assert.equal((await h.api.inject({method:'GET',url:`/paid/entries/${entry.id}`,headers:h.other.headers})).statusCode,404);
 const first=(await h.post(`/paid/entries/${entry.id}/prepare`)).json<PaidEntry>(),second=(await h.post(`/paid/entries/${entry.id}/prepare`)).json<PaidEntry>();assert(first.quote.payment);assert.equal(first.quote.payment.id,second.quote.payment?.id);assert.deepEqual(paymentTransaction(first.quote).messageBytes,paymentTransaction(second.quote).messageBytes);
 const {sig}=await h.pay(entry,false);const recovered=await h.restart().reconcile(h.user.wallet,entry.id);assert.equal(recovered.status,'ready');assert.equal(recovered.quote.signature,sig);assert.equal(recovered.run,null);assert(recovered.readyUntil);
 const retry=(await h.post(`/paid/entries/${entry.id}/transaction`,{signature:sig})).json<PaidEntry>();assert.equal(retry.status,'ready');assert.equal((await pool.query("SELECT count(*) FROM transfer_receipts WHERE source_kind='paid_entry' AND source_id=$1",[entry.id])).rows[0].count,'1');
});
test('paid approval expiry never replaces a pending or incompletely described transfer',async t=>{
 const h=await paidHarness(t),entry=await h.quoteEntry(),first=(await h.post(`/paid/entries/${entry.id}/prepare`)).json<PaidEntry>();h.blocks(251);
 const sig=b58(randomBytes(64));h.refs.set(entry.quote.reference,[sig]);h.txs.set(sig,{slot:222,meta:{},transaction:{}});
 const blocked=await h.post(`/paid/entries/${entry.id}/prepare`);assert.equal(blocked.statusCode,409);assert.equal((await h.paid.get(h.user.wallet,entry.id)).quote.payment?.id,first.quote.payment?.id);
 h.refs.clear();h.txs.clear();await pool.query("UPDATE paid_payment_attempts SET state='invalid' WHERE entry_id=$1",[entry.id]);
 const replacement=(await h.post(`/paid/entries/${entry.id}/prepare`)).json<PaidEntry>();assert.notEqual(replacement.quote.payment?.id,first.quote.payment?.id);assert.notDeepEqual(paymentTransaction(replacement.quote).messageBytes,paymentTransaction(first.quote).messageBytes);
 h.rpcUnavailable(true);assert.equal((await h.post(`/paid/entries/${entry.id}/prepare`)).statusCode,503);
});
test('unpaid expiry releases its reserve only after finalized lifetime reconciliation and late payment goes to review',async t=>{
 const h=await paidHarness(t),entry=await h.quoteEntry();await h.post(`/paid/entries/${entry.id}/prepare`);h.advance(16*60_000);
 await h.paid.reconcile(h.user.wallet,entry.id);assert.equal((await h.paid.get(h.user.wallet,entry.id)).status,'verifying_payment');
 h.blocks(251);await h.paid.reconcile(h.user.wallet,entry.id);assert.equal((await h.paid.get(h.user.wallet,entry.id)).status,'expired');assert.equal((await pool.query('SELECT state FROM return_reservations')).rows[0].state,'released');
 const next=await h.quoteEntry();assert.notEqual(next.id,entry.id);const late=await h.pay(entry);assert.equal(late.entry.status,'review');assert.equal((await h.paid.get(h.user.wallet,next.id)).status,'quoted','late-review bookkeeping must not collide with the active-entry index');
});
test('paid start is idempotent, cannot cross wallets or rules, and a verified escape allocates one return',async t=>{
 const h=await paidHarness(t),entry=(await h.pay(await h.quoteEntry())).entry;
 assert.equal((await h.post(`/paid/entries/${entry.id}/start`,{rulesHash:entry.manifest.rulesHash,startKey:randomUUID()},h.other)).statusCode,404);
 assert.equal((await h.post(`/paid/entries/${entry.id}/start`,{rulesHash:'0'.repeat(64),startKey:randomUUID()})).statusCode,409);
 const running=await h.start(entry),again=await h.start(entry);assert.equal(running.run?.id,again.run?.id);assert.equal(running.run?.expiresAt,again.run?.expiresAt);assert.equal((await h.post(`/paid/entries/${entry.id}/start`,{rulesHash:entry.manifest.rulesHash,startKey:randomUUID()})).statusCode,409);assert.equal((await h.post(`/paid/entries/${entry.id}/cancel`)).statusCode,409);
 const {state,replay}=fixtureReplay('battery-dash');assert.equal(state.status,'won');const input={runId:running.run!.id,rulesHash:entry.manifest.rulesHash,replay};
 assert.equal((await h.post(`/paid/entries/${entry.id}/finish`,input)).statusCode,400,'instant replay is rejected');h.advance(state.ticks/30*1000+1000);
 assert.equal((await h.post(`/paid/entries/${entry.id}/finish`,{...input,score:999999})).statusCode,400);const submit=()=>h.post(`/paid/entries/${entry.id}/finish`,input);assert.equal((await submit()).json().status,'verifying_run');assert.equal((await submit()).json().status,'verifying_run');
 assert.equal((await h.post(`/paid/entries/${entry.id}/finish`,{...input,replay:{version:1,chunks:[{x:0,y:0,buttons:0,ticks:1}]}})).statusCode,409);
 await Promise.all([h.paid.process(),h.restart().process()]);const won=await h.paid.get(h.user.wallet,entry.id);assert.equal(won.status,'won');assert.equal(won.run?.result?.score,state.score);assert.equal(won.return?.amount,'10000000');assert.equal((await pool.query('SELECT count(*) FROM return_allocations')).rows[0].count,'1');
 await h.service.process();h.setInspection({state:'settled',slot:999});await h.retry();await h.service.process();const returned=await h.paid.get(h.user.wallet,entry.id);assert.equal(returned.status,'returned');assert.equal(returned.return?.state,'settled');assert.equal((await submit()).json().status,'returned');assert.equal(h.prepared.length,1);assert.equal(h.sent.length,1);
});
test('verified paid timeout releases only its reserve and creates no return',async t=>{
 const h=await paidHarness(t),entry=await h.start((await h.pay(await h.quoteEntry())).entry),state=initialState('battery-dash'),chunks:ReplayChunk[]=[];
 while(state.status==='playing')recordStep(state,idleInput(),chunks);assert(['caught','timeout'].includes(state.status));h.advance(state.ticks/30*1000+1000);
 await h.paid.submit(h.user.wallet,entry.id,{runId:entry.run!.id,rulesHash:entry.manifest.rulesHash,replay:{version:1,chunks}});await h.paid.process();
 const lost=await h.paid.get(h.user.wallet,entry.id);assert.equal(lost.status,'lost');assert.equal(lost.return,null);assert.equal((await pool.query('SELECT state FROM return_reservations')).rows[0].state,'released');assert.equal((await pool.query('SELECT count(*) FROM return_allocations')).rows[0].count,'0');
});
test('unstarted cancellations and the 24-hour window queue one refund; started missing evidence stays held',async t=>{
 const h=await paidHarness(t),entry=(await h.pay(await h.quoteEntry())).entry;
 const [a,b]=await Promise.all([h.post(`/paid/entries/${entry.id}/cancel`),h.post(`/paid/entries/${entry.id}/cancel`)]);assert.equal(a.statusCode,200);assert.equal(a.json().return.id,b.json().return.id);assert.equal(a.json().status,'refunding');assert.equal((await h.post(`/paid/entries/${entry.id}/start`,{rulesHash:entry.manifest.rulesHash,startKey:randomUUID()})).statusCode,409);
 const expired=await paidHarness(t),paid=(await expired.pay(await expired.quoteEntry())).entry;expired.advance(24*3600_000+1);await expired.paid.process();assert.equal((await expired.paid.get(expired.user.wallet,paid.id)).status,'refunding');
 const missing=await paidHarness(t),started=await missing.start((await missing.pay(await missing.quoteEntry())).entry);missing.advance((started.manifest.hardLimitSeconds+181)*1000);await missing.paid.process();assert.equal((await missing.paid.get(missing.user.wallet,started.id)).status,'review');assert.equal((await pool.query('SELECT state FROM return_reservations')).rows[0].state,'held');assert.equal((await pool.query('SELECT count(*) FROM return_allocations')).rows[0].count,'0');
});
test('paid infrastructure verification failures refund after retries instead of reporting a player loss',async t=>{
 const h=await paidHarness(t,{verify:async()=>{throw new Error('Worker unavailable');}}),entry=await h.start((await h.pay(await h.quoteEntry())).entry),{state,replay}=fixtureReplay('battery-dash');h.advance(state.ticks/30*1000+1000);
 await h.paid.submit(h.user.wallet,entry.id,{runId:entry.run!.id,rulesHash:entry.manifest.rulesHash,replay});
 for(let i=0;i<5;i++){await pool.query("UPDATE paid_entries SET verify_after=now()-interval '1 second' WHERE id=$1",[entry.id]);await h.paid.process();}
 const refunded=await h.paid.get(h.user.wallet,entry.id);assert.equal(refunded.status,'refunding');assert.equal(refunded.return?.outcome,'refund');assert.equal(refunded.run?.result,null);assert.equal((await pool.query('SELECT count(*) FROM return_allocations')).rows[0].count,'1');
});
test('a transfer instruction already used by another product cannot fund a paid entry',async t=>{
 const h=await paidHarness(t),entry=await h.quoteEntry(),payment=await h.pay(entry,false);
 await pool.query("INSERT INTO transfer_receipts(signature,instruction_index,source_kind,source_id,slot) VALUES($1,0,'order',$2,42)",[payment.sig,randomUUID()]);
 const result=await h.post(`/paid/entries/${entry.id}/transaction`,{signature:payment.sig});assert.equal(result.json().status,'review');assert.equal(result.json().run,null);assert.equal((await pool.query('SELECT state FROM return_reservations')).rows[0].state,'held');
});
test('pausing new entries preserves reconciliation, cancellation and queued returns',async t=>{
 const h=await paidHarness(t),entry=await h.quoteEntry();await h.post(`/paid/entries/${entry.id}/prepare`);
 await h.pay(entry,false);h.paid.enabled=false;
 assert.equal((await h.api.inject({method:'GET',url:'/paid/challenge'})).json().enabled,false);
 assert.equal((await h.post('/paid/entries',{requestKey:randomUUID(),termsVersion:'devnet-v1'})).statusCode,503);
 const restored=(await h.post(`/paid/entries/${entry.id}/reconcile`)).json<PaidEntry>();assert.equal(restored.status,'ready');
 assert.equal((await h.post(`/paid/entries/${entry.id}/start`,{rulesHash:entry.manifest.rulesHash,startKey:randomUUID()})).statusCode,503);
 const refund=(await h.post(`/paid/entries/${entry.id}/cancel`)).json<PaidEntry>();assert.equal(refund.status,'refunding');
 await h.service.process();h.setInspection({state:'settled',slot:1000});await h.retry();await h.service.process();
 assert.equal((await h.paid.get(h.user.wallet,entry.id)).status,'refunded');assert.equal(h.prepared.length,1);
});
function operatorRequest(action:ReviewRequest['action'],targetId:string,expectedHash:string):ReviewRequest{return {id:randomUUID(),action,targetId,expectedHash,actor:'test-operator',note:'Reviewed preserved evidence in this isolated test.',};}
async function reviewedMissingRun(t:Parameters<typeof paidHarness>[0]){const h=await paidHarness(t),entry=await h.start((await h.pay(await h.quoteEntry())).entry);h.advance(421000);await h.paid.process();assert.equal((await h.paid.get(h.user.wallet,entry.id)).status,'review');return {...h,entry,review:new OperatorReview(pool,h.entryChain,h.service)};}
test('operator refund is audited once and concurrent or altered retries cannot allocate twice',async t=>{
 const h=await reviewedMissingRun(t),snapshot=await h.review.inspectEntry(h.entry.id),request=operatorRequest('refund-entry',h.entry.id,snapshot.expectedHash);
 assert.equal((await h.api.inject({method:'POST',url:'/operator/reviews',headers:h.user.headers,payload:request})).statusCode,404);
 const [a,b]=await Promise.all([h.review.apply(request),h.review.apply(request)]);assert.deepEqual(a,b);assert.equal(a.status,'refunding');assert.equal((await pool.query('SELECT count(*) FROM return_allocations')).rows[0].count,'1');
 assert.equal((await pool.query('SELECT count(*) FROM operator_reviews WHERE id=$1',[request.id])).rows[0].count,'1');
 await assert.rejects(h.review.apply({...request,note:'A different instruction is not the same retry.'}),/different instructions/);
 await assert.rejects(h.review.apply({...request,id:randomUUID()}),/changed/);
 await h.service.process();h.setInspection({state:'settled',slot:2000});await h.retry();await h.service.process();assert.equal((await h.paid.get(h.user.wallet,h.entry.id)).status,'refunded');
});
test('operator entry review refuses RPC uncertainty, missing receipts and stale decisions without altering reserves',async t=>{
 const h=await reviewedMissingRun(t),snapshot=await h.review.inspectEntry(h.entry.id),request=operatorRequest('refund-entry',h.entry.id,snapshot.expectedHash);
 h.rpcUnavailable(true);await assert.rejects(h.review.apply(request),/RPC unavailable/);h.rpcUnavailable(false);
 const original=h.txs.get(h.entry.quote.signature!);h.txs.delete(h.entry.quote.signature!);await assert.rejects(h.review.apply(request),/could not be reconfirmed/);h.txs.set(h.entry.quote.signature!,original);
 await pool.query("UPDATE paid_entries SET detail='New evidence arrived' WHERE id=$1",[h.entry.id]);await assert.rejects(h.review.apply(request),/changed/);
 const fresh=operatorRequest('refund-entry',h.entry.id,(await h.review.inspectEntry(h.entry.id)).expectedHash);await pool.query("DELETE FROM transfer_receipts WHERE source_kind='paid_entry' AND source_id=$1",[h.entry.id]);await assert.rejects(h.review.apply(fresh),/matching payment receipt/);
 assert.equal((await pool.query('SELECT count(*) FROM return_allocations')).rows[0].count,'0');assert.equal((await pool.query('SELECT state FROM return_reservations')).rows[0].state,'held');assert.equal((await pool.query('SELECT count(*) FROM operator_reviews WHERE id=ANY($1::uuid[])',[[request.id,fresh.id]])).rows[0].count,'0');
});
test('operator retry uses the intact stored replay and the pinned verifier rather than an assigned score',async t=>{
 let broken=true;const h=await paidHarness(t,{verify:async(...args)=>{if(broken)throw new ReplayInvalidError('Archived verifier temporarily unavailable');return verifyReplayInWorker(...args);}}),entry=await h.start((await h.pay(await h.quoteEntry())).entry),{state,replay}=fixtureReplay('battery-dash');h.advance(state.ticks/30*1000+1000);await h.paid.submit(h.user.wallet,entry.id,{runId:entry.run!.id,rulesHash:entry.manifest.rulesHash,replay});await h.paid.process();
 const review=new OperatorReview(pool,h.entryChain,h.service),snapshot=await review.inspectEntry(entry.id);assert.equal(snapshot.status,'review');
 const changed=JSON.parse(JSON.stringify(replay));changed.chunks[0].x=changed.chunks[0].x===0?1:0;
 await pool.query('UPDATE paid_entries SET replay=$2 WHERE id=$1',[entry.id,changed]);await assert.rejects(review.apply(operatorRequest('retry-replay',entry.id,snapshot.expectedHash)),/No intact/);
 await pool.query('UPDATE paid_entries SET replay=$2 WHERE id=$1',[entry.id,replay]);
 const result=await review.apply(operatorRequest('retry-replay',entry.id,snapshot.expectedHash));assert.equal(result.status,'verifying_run');broken=false;await h.paid.process();const won=await h.paid.get(h.user.wallet,entry.id);assert.equal(won.status,'won');assert.equal(won.run?.result?.score,state.score);assert.equal(won.return?.outcome,'success');
});
test('retrying a return in review preserves its active signed bytes and waits for verified finality',async t=>{
 const h=await reviewedMissingRun(t),refund=await h.review.apply(operatorRequest('refund-entry',h.entry.id,(await h.review.inspectEntry(h.entry.id)).expectedHash)),id=String(refund.allocationId);
 await h.service.process();h.setInspection({state:'review',detail:'History needs another provider.'});await h.retry();await h.service.process();const snapshot=await h.review.inspectReturn(id);assert.equal(snapshot.state,'review');assert(snapshot.activeAttempt);
 const before=(await pool.query('SELECT signature,wire FROM return_attempts WHERE id=$1',[snapshot.activeAttempt])).rows[0];await h.review.apply(operatorRequest('retry-return',id,snapshot.expectedHash));h.setInspection({state:'pending',detail:'Still waiting for finality.'});await h.service.process();assert.equal(h.prepared.length,1);assert.equal(h.sent[1]?.signature,before.signature);assert.equal(h.sent[1]?.wire,before.wire);
 h.setInspection({state:'settled',slot:2001});await h.retry();await h.service.process();const settled=await h.review.inspectReturn(id);assert.equal(settled.state,'settled');await assert.rejects(h.review.apply(operatorRequest('retry-return',id,settled.expectedHash)),/Only a held/);
});
test('operator retry grants a bounded new return budget after eight conclusively failed lifetimes',async t=>{
 const h=await reviewedMissingRun(t),refund=await h.review.apply(operatorRequest('refund-entry',h.entry.id,(await h.review.inspectEntry(h.entry.id)).expectedHash)),id=String(refund.allocationId);
 await h.service.process();h.setInspection({state:'failed',detail:'Finalized failure.'});for(let i=0;i<8;i++){await h.retry();await h.service.process();}assert.equal(h.prepared.length,8);
 const snapshot=await h.review.inspectReturn(id);assert.equal(snapshot.state,'review');assert.equal(snapshot.activeAttempt,null);assert.equal(snapshot.attempts,8);
 await h.review.apply(operatorRequest('retry-return',id,snapshot.expectedHash));await h.service.process();assert.equal(h.prepared.length,9);assert.equal((await h.review.inspectReturn(id)).attemptCeiling,16);
});
test('reviewing an original entry cannot hide an unresolved additional payment',async t=>{
 const h=await reviewedMissingRun(t);await h.pay(h.entry);
 const snapshot=await h.review.inspectEntry(h.entry.id);await assert.rejects(h.review.apply(operatorRequest('refund-entry',h.entry.id,snapshot.expectedHash)),/additional payment is unresolved/);
 assert.equal((await pool.query('SELECT count(*) FROM return_allocations')).rows[0].count,'0');assert.equal((await h.paid.get(h.user.wallet,h.entry.id)).status,'review');
});

test('campaign v2 reserves before approval, verifies all missions and settles one rebate through the collection treasury',async()=>{
 const {CampaignService}=await import('./campaign-service'),{CAMPAIGN_IDS}=await import('../src/game/level'),rules=(await import('../shared/rules-manifest.json')).default;
 const config={...service.config,campaignOffer:true},h=await returnHarness(1000_000_000n,100_000_000n,{mint:config.mint,treasury:config.recipient,source:config.destination,decimals:config.decimals});
 const commerce=new CommerceService(pool,chain,config);commerce.campaignReturns=h.service;const campaign=new CampaignService(pool,h.service);
 const order=await commerce.createOrder(h.user.wallet,'campaign',randomUUID());assert.equal(order.amount,'100000000');assert.equal(order.campaignTerms?.rebate,25);
 assert.equal((await pool.query('SELECT count(*) FROM campaign_rebates')).rows[0].count,'0');
 const prepared=await commerce.preparePayment(h.user.wallet,order.id);assert(prepared.payment);
 await commerce.preparePayment(h.user.wallet,order.id);assert.equal((await pool.query('SELECT count(*) FROM campaign_rebates')).rows[0].count,'1');
 await assert.rejects(campaign.claim(h.user.wallet),/pass required/);
 const sig=b58(randomBytes(64));transactions.set(sig,paidTx(order,sig));await commerce.attach(h.user.wallet,order.id,sig);assert.equal((await commerce.me(h.user.wallet)).entitlements.includes('campaign'),true);
 await assert.rejects(campaign.claim(h.user.wallet),/12 missions/);
 // A fabricated cloud save never authorizes the rebate.
 await commerce.syncProgress(h.user.wallet,{version:1,missions:Object.fromEntries(CAMPAIGN_IDS.map(id=>[id,{stars:3,seconds:1,score:99999,battery:100,completions:1}]))});
 await assert.rejects(campaign.claim(h.user.wallet),/12 missions/);
 await assert.rejects(campaign.submit(h.other.wallet,'practice',rules.rulesHash,fixtureReplay().replay),/pass required/);
 await assert.rejects(campaign.submit(h.user.wallet,'practice',rules.rulesHash,{version:1,chunks:[{ticks:1,x:0,y:0,buttons:0}]}),/extraction/);
 for(const mission of CAMPAIGN_IDS){const {state,replay}=fixtureReplay(mission);assert.equal(state.status,'won',mission);await campaign.submit(h.user.wallet,mission,rules.rulesHash,replay);}
 await campaign.submit(h.user.wallet,'practice',rules.rulesHash,fixtureReplay().replay);assert.equal((await campaign.summary(h.user.wallet)).runs.length,12);
 const [one,two]=await Promise.all([campaign.claim(h.user.wallet),campaign.claim(h.user.wallet)]);assert.equal(one.returnId,two.returnId);assert.equal(one.rebate,25);
 const board=await campaign.leaderboard();assert.equal(board.find(r=>r.wallet===h.user.wallet)?.cleared,12);
 await h.service.process();h.setInspection({state:'settled',slot:100});await h.retry();await new ReturnService(pool,h.chain,h.config).process();
 assert.equal((await campaign.summary(h.user.wallet)).state,'settled');assert.equal(h.sent.length,1);assert.equal((await pool.query('SELECT amount FROM return_reservations')).rows[0].amount,'25000000');
 await campaign.claim(h.user.wallet);assert.equal(h.sent.length,1);
});

test('unfunded campaign rebate never prepares a payment authorization',async()=>{
 const config={...service.config,campaignOffer:true},h=await returnHarness(0n,0n,{mint:config.mint,treasury:config.recipient,source:config.destination,decimals:config.decimals}),commerce=new CommerceService(pool,chain,config);commerce.campaignReturns=h.service;
 const order=await commerce.createOrder(h.user.wallet,'campaign',randomUUID());await assert.rejects(commerce.preparePayment(h.user.wallet,order.id),/cannot reserve/);
 assert.equal((await commerce.getOrder(h.user.wallet,order.id)).payment,undefined);assert.equal((await pool.query('SELECT count(*) FROM campaign_rebates')).rows[0].count,'0');
});

test('abandoned campaign approvals release only after proven non-payment and a later purchase gets a fresh reservation',async()=>{
 const config={...service.config,campaignOffer:true},h=await returnHarness(100_000_000n,100_000_000n,{mint:config.mint,treasury:config.recipient,source:config.destination,decimals:config.decimals}),commerce=new CommerceService(pool,chain,config);commerce.campaignReturns=h.service;
 const order=await commerce.createOrder(h.user.wallet,'campaign',randomUUID());await commerce.preparePayment(h.user.wallet,order.id);const old=(await pool.query('SELECT reservation_id FROM campaign_rebates WHERE wallet=$1',[h.user.wallet])).rows[0].reservation_id;
 assert.equal(await commerce.releaseUnpaidCampaignReservations(),0);
 await pool.query("UPDATE orders SET expires_at=now()-interval '1 minute' WHERE id=$1",[order.id]);assert.equal(await commerce.releaseUnpaidCampaignReservations(),0);
 chainHeight+=151;chainUnavailable=true;await assert.rejects(commerce.releaseUnpaidCampaignReservations());chainUnavailable=false;
 assert.equal((await pool.query('SELECT state FROM return_reservations WHERE id=$1',[old])).rows[0].state,'held');assert.equal(await commerce.releaseUnpaidCampaignReservations(),1);
 assert.equal((await pool.query('SELECT state FROM return_reservations WHERE id=$1',[old])).rows[0].state,'released');
 const next=await commerce.createOrder(h.user.wallet,'campaign',randomUUID());await commerce.preparePayment(h.user.wallet,next.id);assert.notEqual((await pool.query('SELECT reservation_id FROM campaign_rebates WHERE wallet=$1',[h.user.wallet])).rows[0].reservation_id,old);
});

test('USD quotes bind method, reject currency replay, cancel only unprepared quotes, and fulfill native SOL',async()=>{
 const {priceProduct}=await import('./pricing');
 const rates={SKR:'0.0183675',SOL:'101.305',at:Date.now()},config={...service.config,usdPricing:true};
 const priced=new CommerceService(pool,chain,config,{rates:async()=>rates}),api=await createApp(priced,ranked);
 try{
 const catalog=(await api.inject({method:'GET',url:'/catalog'})).json();assert.deepEqual(catalog.paymentCurrencies,['SKR','SOL']);assert.equal(catalog.products.find((p:any)=>p.id==='campaign').usdCents,1000);assert.equal(catalog.products.find((p:any)=>p.id==='campaign').price,undefined);
 const user=await login(),key=randomUUID();
 const first=await api.inject({method:'POST',url:'/orders',headers:user.headers,payload:{sku:'campaign',currency:'SKR',idempotencyKey:key}});assert.equal(first.statusCode,200,first.body);const skr=first.json<Order>();assert.equal(skr.amount,priceProduct('campaign','SKR',rates,6).amount);
 const reused=await api.inject({method:'POST',url:'/orders',headers:user.headers,payload:{sku:'campaign',currency:'SOL',idempotencyKey:key}});assert.equal(reused.statusCode,409);
 assert.equal((await api.inject({method:'POST',url:`/orders/${skr.id}/cancel`,headers:user.headers,payload:{}})).statusCode,200);
 const sol=await priced.createOrder(user.wallet,'campaign',randomUUID(),'SOL');assert.equal(sol.currency,'SOL');assert.equal(sol.pricing!.usdCents>=1000,true);
 const prepared=await priced.preparePayment(user.wallet,sol.id);await assert.rejects(priced.cancelQuote(user.wallet,sol.id),/already prepared/);
 const sig=b58(randomBytes(64));const tx=nativeTx(prepared,sig);assert.equal(verifyPayment(prepared,sig,tx).state,'verified');
 for(const change of [(v:any)=>{v.transaction.message.accountKeys[1]=pub();},(v:any)=>{v.transaction.message.accountKeys[2]=pub();},(v:any)=>{v.transaction.message.header.numRequiredSignatures=0;},(v:any)=>{v.meta.postBalances[1]=0;},(v:any)=>{v.transaction.message.instructions[0].data=b58(Buffer.alloc(12));},(v:any)=>{v.transaction.message.instructions.pop();}]){const bad=structuredClone(tx);change(bad);assert.equal(verifyPayment(prepared,sig,bad).state,'invalid');}
 transactions.set(sig,tx);references.set(sol.reference,[sig]);await priced.reconcile(sol.id);assert.equal((await priced.getOrder(user.wallet,sol.id)).status,'fulfilled');assert.ok((await priced.me(user.wallet)).entitlements.includes('campaign'));
 await assert.rejects(priced.createOrder(user.wallet,'campaign',randomUUID(),'SKR'),/already own/);
 }finally{await api.close();}
});
function nativeTx(o:Order,sig:string){const data=Buffer.alloc(12);data.writeUInt32LE(2);data.writeBigUInt64LE(BigInt(o.amount),4);return {slot:42,blockTime:Math.floor(Date.now()/1000),transaction:{signatures:[sig],message:{header:{numRequiredSignatures:1},accountKeys:[o.wallet,o.recipient,o.reference,'11111111111111111111111111111111',MEMO_PROGRAM],instructions:[{programIdIndex:3,accounts:[0,1,2],data:b58(data)},{programIdIndex:4,accounts:[],data:b58(Buffer.from(o.memo))}]}},meta:{err:null,preBalances:[1000000000,0,0,0,0],postBalances:[1000000000-Number(o.amount)-5000,Number(o.amount),0,0,0]}};}

test('SOL campaign reserves TEST SKR reward and preserves quote across a restart',async()=>{
 const config={...service.config,campaignOffer:true,usdPricing:true},h=await returnHarness(1000_000_000n,100_000_000n,{mint:config.mint,treasury:config.recipient,source:config.destination,decimals:config.decimals});
 const feed={rates:async()=>({SKR:'0.02',SOL:'100',at:Date.now()})};const priced=new CommerceService(pool,chain,config,feed);priced.campaignReturns=h.service;
 const user=await login(),sol=await priced.createOrder(user.wallet,'campaign',randomUUID(),'SOL');await priced.preparePayment(user.wallet,sol.id);
 const reserve=(await pool.query('SELECT r.* FROM campaign_rebates c JOIN return_reservations r ON r.id=c.reservation_id WHERE c.wallet=$1',[user.wallet])).rows[0];assert.equal(reserve.mint,config.mint);assert.equal(reserve.amount,'25000000');
 const restarted=new CommerceService(pool,chain,config,feed),restored=await restarted.getOrder(user.wallet,sol.id);assert.equal(restored.currency,'SOL');assert.deepEqual(restored.pricing,sol.pricing);
 const sig=b58(randomBytes(64));transactions.set(sig,nativeTx(restored,sig));await priced.attach(user.wallet,sol.id,sig);assert.equal((await priced.getOrder(user.wallet,sol.id)).status,'fulfilled');
});

test('restore expires unpaid approvals and never resurrects a dropped callback signature',async()=>{
 const user=await login(),o=await quote(user),prepared=await service.preparePayment(user.wallet,o.id),sig=b58(randomBytes(64));
 await service.attach(user.wallet,o.id,sig);assert.equal((await service.getOrder(user.wallet,o.id)).status,'verifying');
 await pool.query("UPDATE orders SET expires_at=now()-interval '1 minute' WHERE id=$1",[o.id]);
 await service.reconcile(o.id);assert.equal((await service.getOrder(user.wallet,o.id)).status,'verifying','A live blockhash must remain locked');
 chainHeight=Number(prepared.payment!.lastValidBlockHeight)+1;
 chainUnavailable=true;try{await assert.rejects(service.reconcile(o.id));}finally{chainUnavailable=false;}
 assert.equal((await service.getOrder(user.wallet,o.id)).status,'verifying','RPC failures must never release payment locks');
 await service.reconcile(o.id);await service.reconcile(o.id);
 const ended=await service.getOrder(user.wallet,o.id);assert.equal(ended.status,'quoted');assert.equal(ended.payment,undefined);assert.equal(ended.signature,null);
 assert.equal((await pool.query('SELECT state FROM order_attempts WHERE signature=$1',[sig])).rows[0].state,'expired');
 await service.check(prepared,sig,{state:'pending',detail:'Stale concurrent RPC response'});
 assert.equal((await service.getOrder(user.wallet,o.id)).status,'quoted');
 assert.notEqual((await quote(user)).id,o.id);
 await service.check(ended,sig,{state:'needs_review',detail:'A late transfer requires review.'});
 assert.equal((await service.getOrder(user.wallet,o.id)).status,'needs_review','Expired attempt history must not hide a late payment');
});

test('weekly board sums one best verified win per day, excludes other weeks and shares exact ties',async()=>{
 const weeklyService=new RankedService(pool,{now:()=>new Date('2032-05-19T12:00:00Z')}),people=[pub(),pub(),pub()];
 for(const w of people)await pool.query('INSERT INTO wallets(address) VALUES($1)',[w]);
 const manifest=await weeklyService.daily();
 async function add(w:string,day:string,score:number,ticks:number,status='verified',outcome='won'){
  await pool.query('INSERT INTO daily_manifests(day,manifest) VALUES($1,$2) ON CONFLICT DO NOTHING',[day,{...manifest,day}]);
  await pool.query('INSERT INTO ranked_runs(id,wallet,day,request_key,manifest,status,issued_at,expires_at,result) VALUES($1,$2,$3,$4,$5,$6,now(),now(),$7)',[randomUUID(),w,day,randomUUID(),{...manifest,day},status,{status:outcome,score,ticks}]);
 }
 await add(people[0]!, '2032-05-17',100,600);await add(people[0]!, '2032-05-17',100,300);await add(people[0]!, '2032-05-18',200,300);
 await add(people[0]!, '2032-05-16',99999,1);await add(people[0]!, '2032-05-24',99999,1);
 await add(people[0]!, '2032-05-19',99999,1,'verifying');await add(people[0]!, '2032-05-19',99999,1,'verified','caught');
 await add(people[1]!, '2032-05-17',300,600);await add(people[2]!, '2032-05-17',300,900);
 const board=await weeklyService.weekly(people[2]);assert.equal(board.week,'2032-05-17');assert.equal(board.participants,3);assert.equal(board.personal?.rank,3);assert.equal(board.rival?.rank,1);
 const first=board.entries.find(r=>r.wallet===people[0]);assert.equal(first?.score,300);assert.equal(first?.ticks,600);assert.equal(first?.days,2);assert.equal(first?.rank,1);assert.equal(board.entries.find(r=>r.wallet===people[1])?.rank,1);
 const empty=await new RankedService(pool,{now:()=>new Date('2032-06-01')}).weekly();assert.equal(empty.participants,0);assert.deepEqual(empty.entries,[]);
 const response=await app.inject({method:'GET',url:'/weekly/leaderboard'});assert.equal(response.statusCode,200);assert.equal(response.json().personal,null);
});

test('weekly contracts enforce five atomic starts, idempotency, ownership and independent contract budgets',async()=>{
 const {LeagueService}=await import('./league-service');let clock=new Date('2034-04-03T12:00:00Z');const r=new RankedService(pool,{now:()=>clock}),league=new LeagueService(pool,r,()=>clock),manifest=await league.manifest(),c=manifest.contracts[0]!,user=await campaignOwner(),unowned=await login();
 const input={contractId:c.id,rulesHash:manifest.rulesHash,requestKey:randomUUID()};await assert.rejects(league.start(unowned.wallet,input),/Campaign access/);
 const [one,two]=await Promise.all([league.start(user.wallet,input),league.start(user.wallet,input)]);assert.equal(one.id,two.id);assert.equal((await league.summary(user.wallet)).attempts[c.id],1);
 await r.abandon(user.wallet,one.id);
 for(let i=0;i<3;i++){const t=await league.start(user.wallet,{...input,requestKey:randomUUID()});await r.abandon(user.wallet,t.id);}
 const last=await Promise.allSettled([league.start(user.wallet,{...input,requestKey:randomUUID()}),league.start(user.wallet,{...input,requestKey:randomUUID()})]);assert.equal(last.filter(v=>v.status==='fulfilled').length,1);const active=last.find(v=>v.status==='fulfilled') as PromiseFulfilledResult<RunTicket>;await r.abandon(user.wallet,active.value.id);
 await assert.rejects(league.start(user.wallet,{...input,requestKey:randomUUID()}),/five ranked attempts/);assert.equal((await league.summary(user.wallet)).attempts[c.id],5);
 const different=await league.start(user.wallet,{...input,contractId:manifest.contracts[1]!.id,requestKey:randomUUID()});await r.abandon(user.wallet,different.id);
 clock=new Date('2034-04-10T12:00:00Z');const fresh=await league.summary(user.wallet);assert.deepEqual(fresh.attempts,{});assert.notEqual(fresh.contracts[0]!.id,c.id);
});

test('weekly contract replay, normalized scores, earned outfit and immutable history survive reset',async()=>{
 const {LeagueService}=await import('./league-service'),{solveContract}=await import('../scripts/qa-contracts'),{contractPoints}=await import('../shared/contracts');let clock=new Date('2026-09-14T12:00:00Z');const r=new RankedService(pool,{now:()=>clock}),league=new LeagueService(pool,r,()=>clock),user=await campaignOwner(),manifest=await league.manifest();
 await assert.rejects(league.equip(user.wallet),/Clear all three/);
 for(const c of manifest.contracts){const solved=solveContract(c);assert(solved);const t=await league.start(user.wallet,{contractId:c.id,rulesHash:manifest.rulesHash,requestKey:randomUUID()});clock=new Date(clock.getTime()+(solved.ticks/30+3)*1000);await r.submit(user.wallet,t.id,{rulesHash:t.manifest.rulesHash,replay:solved.replay});await r.process();const run=await r.get(user.wallet,t.id);assert.equal(run.status,'verified');assert.equal(run.result?.status,'won');const summary=await league.summary(user.wallet);assert.equal(summary.board.personal?.best.find(b=>b.contract===c.id)?.points,contractPoints(run.result!,c.level));}
 const full=await league.summary(user.wallet);assert.equal(full.board.personal?.cleared,3);assert.equal(full.earned,true);assert(full.board.personal!.points<=30000);await league.equip(user.wallet);assert.equal((await service.me(user.wallet)).equipment.outfit,'ghost-courier');
 clock=new Date('2026-09-21T00:16:00Z');const next=await league.summary(user.wallet);assert.equal(next.board.personal,null);assert.equal(next.earned,true);assert.equal(next.history.length,1);assert.equal(next.history[0]!.personal?.points,full.board.personal?.points);assert.equal(next.history[0]!.final,true);await league.archive();assert.equal((await league.summary(user.wallet)).history.length,1);assert.equal((await service.me(user.wallet)).equipment.outfit,'ghost-courier');
});

test('contract verification retries the same failed infrastructure job without spending another attempt',async()=>{
 const {LeagueService}=await import('./league-service'),{solveContract}=await import('../scripts/qa-contracts');let clock=new Date('2026-10-05T12:00:00Z');const r=new RankedService(pool,{now:()=>clock}),league=new LeagueService(pool,r,()=>clock),user=await campaignOwner(),manifest=await league.manifest(),c=manifest.contracts[0]!,solved=solveContract(c);assert(solved);
 const t=await league.start(user.wallet,{contractId:c.id,rulesHash:manifest.rulesHash,requestKey:randomUUID()});clock=new Date(clock.getTime()+(solved.ticks/30+3)*1000);await r.submit(user.wallet,t.id,{rulesHash:t.manifest.rulesHash,replay:solved.replay});await pool.query("UPDATE ranked_runs SET status='error',detail='Simulated infrastructure outage' WHERE id=$1",[t.id]);
 const retry=await r.submit(user.wallet,t.id,{rulesHash:t.manifest.rulesHash,replay:solved.replay});assert.equal(retry.status,'verifying');assert.equal((await league.summary(user.wallet)).attempts[c.id],1);await r.process();assert.equal((await r.get(user.wallet,t.id)).result?.status,'won');
});

test('Mainnet test orders enforce allowlist, store Mainnet and use reduced prices with idempotent verification',async()=>{
 const user=await login(),rates={SKR:'0.02',SOL:'100',at:Date.now()};
 const main=new CommerceService(pool,chain,{...service.config,cluster:'solana:mainnet',priceDivisor:10,allowlist:[user.wallet],usdPricing:true,campaignOffer:false},{rates:async()=>rates});
 await assert.rejects(main.challenge(pub()),/limited to/);
 await assert.rejects(main.createOrder(pub(),'campaign',randomUUID(),'SOL'),/not enabled/);
 const challenge=await main.challenge(user.wallet);assert.equal(challenge.payload.chainId,'solana:mainnet');assert.match(challenge.payload.statement,/Mainnet/);
 const order=await main.createOrder(user.wallet,'campaign',randomUUID(),'SKR');assert.equal(order.cluster,'solana:mainnet');assert.equal(order.amount,'50000000');assert.equal(order.pricing?.usdCents,100);
 const sig=b58(randomBytes(64));transactions.set(sig,paidTx(order,sig));
 // Verification remains bound to the exact token/recipient/amount; only the deployment's cluster and price change.
 const api=await createApp(main,ranked);
 try{for(let i=0;i<2;i++){const r=await api.inject({method:'POST',url:`/orders/${order.id}/transaction`,headers:user.headers,payload:{signature:sig}});assert.equal(r.statusCode,200,r.body);assert.equal(r.json().status,'fulfilled');}
 assert.equal(Number((await pool.query('SELECT count(*) FROM payment_receipts WHERE order_id=$1',[order.id])).rows[0].count),1);
 }finally{await api.close();}
});

test('weekly pass without rebate prepares and fulfills without reward funding; existing rebate terms remain intact',async()=>{
 const user=await login(),priorUser=await login(),old=new CommerceService(pool,chain,{...service.config,campaignOffer:true,rebateSkr:25});
 const earlier=await old.createOrder(priorUser.wallet,'campaign',randomUUID());assert.equal(earlier.campaignTerms?.rebate,25);
 const weekly=new CommerceService(pool,chain,{...service.config,campaignOffer:true,rebateSkr:0});
 const order=await weekly.createOrder(user.wallet,'campaign',randomUUID());assert.equal(order.campaignTerms,undefined);
 const prepared=await weekly.preparePayment(user.wallet,order.id);assert(prepared.payment);assert.equal(Number((await pool.query('SELECT count(*) FROM campaign_rebates WHERE wallet=$1',[user.wallet])).rows[0].count),0);
 const sig=b58(randomBytes(64));transactions.set(sig,paidTx(order,sig));await weekly.attach(user.wallet,order.id,sig);assert((await weekly.me(user.wallet)).entitlements.includes('campaign'));
 assert.equal((await weekly.getOrder(priorUser.wallet,earlier.id)).campaignTerms?.rebate,25);
});

test('wallet-managed send with lost callback stays locked until finalized expiry, without waiting for quote expiry',async()=>{
 const user=await login(),o=await quote(user),prepared=await service.preparePayment(user.wallet,o.id);
 await service.reconcile(o.id);
 assert.deepEqual((await service.getOrder(user.wallet,o.id)).payment,prepared.payment,'A live approval cannot be reissued');
 chainHeight=Number(prepared.payment!.lastValidBlockHeight)+1;
 chainUnavailable=true;try{await assert.rejects(service.reconcile(o.id));}finally{chainUnavailable=false;}
 assert.deepEqual((await service.getOrder(user.wallet,o.id)).payment,prepared.payment);
 await service.reconcile(o.id);
 const cleared=await service.getOrder(user.wallet,o.id);
 assert.equal(cleared.status,'quoted');assert.equal(cleared.payment,undefined);
 assert.ok(new Date(cleared.expiresAt).getTime()>Date.now(),'Price quote remains valid');
 const next=await service.preparePayment(user.wallet,o.id);assert.notEqual(next.payment!.id,prepared.payment!.id);
 const sig=b58(randomBytes(64));transactions.set(sig,paidTx(next,sig));references.set(o.reference,[sig]);
 await service.reconcile(o.id);assert.equal((await service.getOrder(user.wallet,o.id)).status,'fulfilled');
 assert.deepEqual((await service.me(user.wallet)).entitlements,['campaign']);
});
