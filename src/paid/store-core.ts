import type {PaidEntry} from '../../shared/paid';
import type {Replay} from '../../shared/replay';
import {assertPaidRules,isReplayPrefix,replayTicks} from './recovery';

type Storage={read:(key:string)=>Promise<string|null>;write:(key:string,value:string)=>Promise<void>};
export type SavedPaidRun={version:1;wallet:string;entryId:string;startKey:string;runId:string|null;rulesHash:string;expiresAt:string|null;replay:Replay};
export function createPaidStore(storage:Storage){
 const queues=new Map<string,Promise<unknown>>();
 const key=(e:PaidEntry)=>`seeker.paid.devnet.${e.wallet}.${e.id}`;
 async function serial<T>(e:PaidEntry,fn:()=>Promise<T>){const k=key(e),previous=queues.get(k)??Promise.resolve();const next=previous.catch(()=>{}).then(fn);queues.set(k,next);try{return await next;}finally{if(queues.get(k)===next)queues.delete(k);}}
 async function read(e:PaidEntry){
  const raw=await storage.read(key(e));if(!raw)return null;
  let saved:SavedPaidRun;try{saved=JSON.parse(raw);}catch{throw new Error('Saved run is unreadable. It has not been overwritten.');}
  if(!saved||saved.version!==1||typeof saved.startKey!=='string'||!saved.startKey||saved.wallet!==e.wallet||saved.entryId!==e.id||saved.rulesHash!==e.manifest.rulesHash||!(saved.runId===null||typeof saved.runId==='string'))throw new Error('Saved run does not match this entry.');
  if(saved.runId&&(saved.startKey!==e.run?.startKey||saved.runId!==e.run?.id||saved.expiresAt!==e.run.expiresAt))throw new Error('Saved run ticket or deadline does not match the server.');
  replayTicks(saved.replay,e.manifest.hardLimitSeconds*30);
  if(saved.runId===null&&saved.replay.chunks.length)throw new Error('An unstarted entry cannot contain a run.');
  return saved;
 }
 const write=(e:PaidEntry,s:SavedPaidRun)=>storage.write(key(e),JSON.stringify(s));
 return {
  read:(e:PaidEntry)=>serial(e,()=>read(e)),
  // Must complete before requesting Start. Its presence proves this installation
  // had not begun simulating if the Start response is lost before initialization.
  prepare:(e:PaidEntry)=>serial(e,async()=>{assertPaidRules(e);if(e.status!=='ready'||e.run)throw new Error('Only an unstarted entry can prepare a run.');const old=await read(e);if(old)return old.startKey;const saved:SavedPaidRun={version:1,wallet:e.wallet,entryId:e.id,startKey:crypto.randomUUID(),runId:null,rulesHash:e.manifest.rulesHash,expiresAt:null,replay:{version:1,chunks:[]}};await write(e,saved);return saved.startKey;}),
  open:(e:PaidEntry)=>serial(e,async()=>{
   assertPaidRules(e);if(!e.run||e.status!=='running')throw new Error('This entry is not a running attempt.');
   const old=await read(e);if(!old)throw new Error('This device has no saved input log for the started run. Reinstalling cannot restart a paid attempt. Check its status after the deadline.');
   if(old.startKey!==e.run.startKey)throw new Error('This attempt started on another installation. This device cannot replace its input log.');
   if(old.runId)return old;
   const saved={...old,runId:e.run.id,expiresAt:e.run.expiresAt};await write(e,saved);return saved;
  }),
  checkpoint:(e:PaidEntry,input:Replay)=>{
   // Freeze now, before waiting for an older write. The UI recorder keeps growing.
   const replay:Replay={version:1,chunks:input.chunks.map(c=>({...c}))};
   return serial(e,async()=>{
    assertPaidRules(e);replayTicks(replay,e.manifest.hardLimitSeconds*30);
    const saved=await read(e);if(!saved?.runId||saved.runId!==e.run?.id)throw new Error('The paid run was not saved before gameplay.');
    if(isReplayPrefix(replay,saved.replay))return; // A delayed older snapshot cannot roll back progress.
    if(!isReplayPrefix(saved.replay,replay))throw new Error('The saved run and new inputs disagree. Neither has been silently replaced.');
    await write(e,{...saved,replay});
   });
  },
 };
}
