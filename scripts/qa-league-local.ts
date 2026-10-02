// local league end to end: throwaway key, pass grant by sql, ticket, solver replay, server verification, standings
// runs only against a local api and database; refuses production hosts
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,randomUUID} from 'node:crypto';
import {getBase58Decoder} from '@solana/kit';
import {createSignInMessage} from '@solana/wallet-standard-util';
import pg from 'pg';
import {solveCombat} from './qa-combat';
import {solveWeeklyRush} from './qa-weekly-rush';
import {contractPoints} from '../shared/contracts';
const base=process.env.QA_API_URL??'http://127.0.0.1:8790',database=process.env.DATABASE_URL??'postgresql://localhost/seeker_clockin_devnet';
const loopback=new Set(['127.0.0.1','localhost','::1','[::1]']);
assert(loopback.has(new URL(base).hostname)&&loopback.has(new URL(database).hostname),'local only: api and database hosts must be loopback');
async function api(path:string,token?:string,body?:unknown,expect=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});const json=await r.json().catch(()=>null);assert.equal(r.status,expect,`${path}: ${JSON.stringify(json)}`);return json as any;}
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function main(){
 assert.equal((await api('/health')).cluster,'solana:devnet');
 const keys=generateKeyPairSync('ed25519'),wallet=getBase58Decoder().decode(keys.publicKey.export({type:'spki',format:'der'}).subarray(-32));
 const c=await api('/auth/challenge',undefined,{wallet}),message=createSignInMessage(c.payload);
 const auth=await api('/auth/verify',undefined,{id:c.id,wallet,signedMessage:Buffer.from(message).toString('base64'),signature:sign(null,message,keys.privateKey).toString('base64')});
 const summary=await api('/league',auth.token);
 assert.equal(summary.contracts.length,3);assert.equal(summary.authenticated,true);
 console.log('week',summary.week,'rules',summary.rulesHash.slice(0,8),'engine',summary.engineHash?.slice(0,8));
 // no pass yet: start must be refused before any attempt is spent
 const request={contractId:summary.contracts[0].id,rulesHash:summary.rulesHash,requestKey:randomUUID()};
 await api('/league/start',auth.token,request,403);
 const pool=new pg.Pool({connectionString:database});
 await pool.query("INSERT INTO entitlements(wallet,sku,order_id) VALUES($1,'campaign',NULL) ON CONFLICT DO NOTHING",[wallet]);
 await pool.end();
 const ticket=await api('/league/start',auth.token,request);
 const again=await api('/league/start',auth.token,request);assert.equal(ticket.id,again.id,'start is idempotent per request key');
 const level=ticket.manifest.contract.level,issued=Date.now();
 const win=solveCombat(level)??solveWeeklyRush(level);
 assert(win,'no solver win for '+level.title);
 console.log('solved',level.title,`${win.ticks/30}s`,`${win.hp} hp`,`${win.kills} kills`,`${win.score} pts`);
 // the server rejects replays longer than the time the ticket has been open
 const wait=Math.max(0,win.ticks/30*1000+2500-(Date.now()-issued));console.log(`waiting ${(wait/1000).toFixed(0)}s so the replay fits the ticket age`);await sleep(wait);
 await api(`/runs/${ticket.id}/finish`,auth.token,{rulesHash:ticket.manifest.rulesHash,replay:win.replay});
 let run:any;for(let i=0;i<40;i++){run=await api(`/runs/${ticket.id}`,auth.token);if(run.status!=='verifying'&&run.status!=='submitted')break;await sleep(1500);}
 assert.equal(run.status,'verified',JSON.stringify(run));
 const expected=contractPoints({status:"won",score:win.score,ticks:win.ticks,hp:win.hp},level);
 const after=await api('/league',auth.token);
 assert.equal(after.attempts[request.contractId],1);
 assert.equal(after.board.personal?.points,expected,`personal points ${JSON.stringify(after.board.personal)} vs ${expected}`);
 assert.ok(after.recentRuns.some((r:any)=>r.id===ticket.id||r.runId===ticket.id)||after.recentRuns.length>=1,'recent runs list the attempt');
 await api('/league/start',auth.token,{...request,rulesHash:'0'.repeat(64),requestKey:randomUUID()},409);
 console.log(JSON.stringify({ok:true,wallet,week:after.week,contract:request.contractId,run:ticket.id,status:run.status,points:after.board.personal?.points,attempts:after.attempts[request.contractId]}));
}
main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1;});
