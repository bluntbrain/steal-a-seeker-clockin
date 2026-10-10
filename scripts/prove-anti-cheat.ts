// proves the server only counts runs it replays itself: a valid level 1 run is accepted with a server-computed score,
// while forged scores, altered or impossible inputs and repeats are rejected or earn nothing.
// usage: npx tsx scripts/prove-anti-cheat.ts          the server's own verifier, offline (also runs in ci)
//        npx tsx scripts/prove-anti-cheat.ts --live   also signs in a throwaway wallet on production and submits the runs
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {generateKeyPairSync,sign} from 'node:crypto';
import bs58 from 'bs58';
import {createSignInMessage} from '@solana/wallet-standard-util';
import {verifyReplay} from '../server/replay';
import {fixtureReplay} from '../tests/fixtures/replay';
import rules from '../shared/rules-manifest.json';
import type {Replay} from '../shared/replay';

const API=process.env.API_URL??'https://seeker-api-production-41b3.up.railway.app';
const live=process.argv.includes('--live');
const lines:string[]=[];
let failures=0;
const log=(line='')=>{lines.push(line);console.log(line);};
const check=(label:string,ok:boolean,detail:string)=>{if(!ok)failures++;log(`${ok?'PASS':'FAIL'}  ${label}\n      ${detail}`);};
// schema errors arrive as a json list of issues; keep one readable line per issue
const reason=(e:unknown)=>{const text=e instanceof Error?e.message:String(e);try{const issues=JSON.parse(text) as {path:(string|number)[];message:string}[];return issues.map(i=>`${i.path.join('.')||'replay'}: ${i.message}`).join('; ');}catch{return text;}};
const rejected=(run:()=>unknown)=>{try{const r=run() as {status?:string};return {rejected:false,status:r?.status};}catch(e){return {rejected:true,reason:reason(e)};}};

const {state,replay}=fixtureReplay('practice');
const forged={...replay,score:999999} as Replay;
const altered=structuredClone(replay);for(const c of altered.chunks)c.buttons=0;
const impossible:Replay={version:1,chunks:[{x:128,y:0,buttons:0,ticks:1}]};
const afterWin=structuredClone(replay);afterWin.chunks.push({x:0,y:0,buttons:0,ticks:1});
const oversized:Replay={version:1,chunks:[{x:0,y:0,buttons:0,ticks:14400}]};

log(`Steal a Seeker anti-cheat proof, ${new Date().toISOString()}`);
log(`Rules hash ${rules.rulesHash}`);
log(`Level 1 run: ${replay.chunks.length} input chunks, recorded by the game's own simulation (tests/fixtures/replay.ts)`);
log('');
log('Part 1: the server verifier, offline (server/replay.ts)');
const valid=verifyReplay('practice',replay);
check('valid run is accepted and scored by the server',valid.status==='won'&&valid.score===state.score,`status ${valid.status}, server score ${valid.score}, ${valid.ticks} ticks, health ${valid.battery}`);
const f=rejected(()=>verifyReplay('practice',forged));
check('a run that sends its own score of 999,999 is rejected',f.rejected,f.rejected?`rejected: ${f.reason}`:`accepted with status ${f.status}`);
const a=rejected(()=>verifyReplay('practice',altered));
check('a run with inputs removed does not count as a win',a.rejected||a.status!=='won',a.rejected?`rejected: ${a.reason}`:`replayed to status ${a.status}`);
const i=rejected(()=>verifyReplay('practice',impossible));
check('an impossible move is rejected',i.rejected,i.rejected?`rejected: ${i.reason}`:`accepted with status ${i.status}`);
const w=rejected(()=>verifyReplay('practice',afterWin));
check('inputs sent after the win are rejected',w.rejected,w.rejected?`rejected: ${w.reason}`:`accepted with status ${w.status}`);
const o=rejected(()=>verifyReplay('practice',oversized));
check('an oversized run is rejected',o.rejected,o.rejected?`rejected: ${o.reason}`:`accepted with status ${o.status}`);

async function call(method:string,path:string,body?:unknown,token?:string){
 const response=await fetch(API+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});
 const text=await response.text();let json:unknown;try{json=JSON.parse(text);}catch{json=text;}
 return {status:response.status,json:json as Record<string,unknown>};
}
async function liveProof(){
 log('');
 log(`Part 2: the live production server (${API})`);
 // a throwaway wallet: the key exists only in memory for this run and is never written anywhere
 const keys=generateKeyPairSync('ed25519'),wallet=bs58.encode(keys.publicKey.export({type:'spki',format:'der'}).subarray(-32));
 const challenge=await call('POST','/auth/challenge',{wallet});
 const payload=(challenge.json as {payload:Parameters<typeof createSignInMessage>[0]}).payload,message=createSignInMessage(payload);
 const auth=await call('POST','/auth/verify',{id:(challenge.json as {id:string}).id,wallet,signedMessage:Buffer.from(message).toString('base64'),signature:sign(null,message,keys.privateKey).toString('base64')});
 const token=(auth.json as {token?:string}).token;
 check('throwaway wallet signs in with a Sign In With Solana message',auth.status===200&&!!token,`wallet ${wallet}, HTTP ${auth.status}, session token [hidden]`);
 if(!token)return;
 const submit=(run:unknown)=>call('POST','/campaign/runs',{mission:'practice',rulesHash:rules.rulesHash,replay:run},token);
 const error=(r:{json:Record<string,unknown>})=>String((r.json as {error?:string}).error??JSON.stringify(r.json)).slice(0,160);
 // exact codes, so a rate limit (429) can never pass as a rejection
 const r1=await submit(forged);
 check('forged score is refused before any leaderboard update',r1.status===400,`HTTP ${r1.status}: ${error(r1)}`);
 const r2=await submit(altered);
 check('altered inputs are refused',r2.status===422,`HTTP ${r2.status}: ${error(r2)}`);
 const r3=await submit(impossible);
 check('impossible input is refused',r3.status===400,`HTTP ${r3.status}: ${error(r3)}`);
 const before=await call('GET','/campaign/leaderboard',undefined,token);
 check('the leaderboard has no row for this wallet after three bad runs',before.status===200&&(before.json as {personal:unknown}).personal===null,`personal row: ${JSON.stringify((before.json as {personal:unknown}).personal)}`);
 const r4=await submit(replay);
 const award=(r4.json as {creditAward?:{credits:number}}).creditAward,runs=(r4.json as {runs?:{mission:string;score:number}[]}).runs??[];
 const scored=runs.find(r=>r.mission==='practice');
 check('the valid run is accepted and the server stores its own score',r4.status===200&&scored?.score===state.score,`HTTP ${r4.status}, stored score ${scored?.score}, credits awarded ${award?.credits}`);
 const r5=await submit(replay);
 check('sending the same run again earns nothing',r5.status===200&&(r5.json as {creditAward?:{credits:number}}).creditAward?.credits===0,`HTTP ${r5.status}, credits awarded ${(r5.json as {creditAward?:{credits:number}}).creditAward?.credits}`);
 const after=await call('GET','/campaign/leaderboard',undefined,token);
 const row=(after.json as {personal?:{rank:number;score:number;cleared:number}}).personal;
 check('the leaderboard now ranks this wallet with the server score',!!row&&row.score===state.score&&row.cleared===1,`rank ${row?.rank}, ${row?.cleared} level, ${row?.score} points`);
}

(async()=>{
 if(live)await liveProof();
 log('');
 log(failures?`${failures} check(s) failed`:'All checks passed');
 const out=join(dirname(fileURLToPath(import.meta.url)),'..','verification','anti-cheat')+'/';mkdirSync(out,{recursive:true});
 writeFileSync(out+(live?'live-trace.txt':'local-trace.txt'),lines.join('\n')+'\n');
 process.exitCode=failures?1:0;
})().catch(e=>{console.error(e instanceof Error?`${e.message} ${(e as {cause?:{code?:string;message?:string}}).cause?.code??""} ${(e as {cause?:{message?:string}}).cause?.message??""}`:e);process.exitCode=1;});
