import {Worker} from 'node:worker_threads';
import {URL} from 'node:url';
import type {MissionId} from '../src/game/level';
import {replayInput,type ReplayResult} from './replay';
let active=0;
export class ReplayBusyError extends Error{}
// Verification runs outside the API event loop and cannot monopolize it with
// repeated pathfinding. No API route calls this until tickets are implemented.
export function verifyReplayInWorker(mission:MissionId,input:unknown,options:{timeoutMs?:number}={}):Promise<ReplayResult>{
 if(active>=2)return Promise.reject(new ReplayBusyError('Verification capacity is busy. Try again shortly.'));
 const replay=replayInput.parse(input),worker=new Worker(new URL('./replay-worker.mjs',import.meta.url),{workerData:{mission,replay},resourceLimits:{maxOldGenerationSizeMb:128}});active++;
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(result?:ReplayResult,error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);void worker.terminate().then(()=>{active--;if(error)reject(error);else resolve(result!);},()=>{active--;reject(new Error('Replay worker shutdown failed.'));});};
  const timer=setTimeout(()=>finish(undefined,new Error('Replay verification exceeded its time budget.')),Math.max(1,Math.min(10000,options.timeoutMs??5000)));
  worker.once('message',(message:{ok:boolean;result?:ReplayResult;error?:string})=>message.ok?finish(message.result):finish(undefined,new Error(message.error||'Replay rejected.')));
  worker.once('error',()=>finish(undefined,new Error('Replay verifier could not finish.')));
  worker.once('exit',()=>{if(!settled)finish(undefined,new Error('Replay verifier exited without a result.'));});
 });
}
