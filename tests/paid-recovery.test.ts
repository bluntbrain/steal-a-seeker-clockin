import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import type {PaidEntry} from '../shared/paid';
import type {Replay,ReplayChunk} from '../shared/replay';
import rules from '../shared/rules-manifest.json';
import {createPaidStore} from '../src/paid/store-core';
import {assertPaidRules,replayTicks,restorePaidState} from '../src/paid/recovery';
import {recordStep} from '../src/game/recording';
import {getLevel,type MissionId} from '../src/game/level';
import fixtures from '../verification/native-replay-fixtures.json';
const wallet='11111111111111111111111111111111';
function entry():PaidEntry{
 const id=randomUUID(),now=new Date().toISOString();
 return {id,wallet,status:'ready',manifest:{mission:'battery-dash',rulesHash:rules.rulesHash,levelHash:rules.levelHashes['battery-dash'],seed:0,loadout:'standard',hardLimitSeconds:240},readyUntil:new Date(Date.now()+86400000).toISOString(),run:null,return:null,detail:null,quote:{id,wallet,cluster:'solana:devnet',mint:wallet,tokenProgram:wallet,decimals:6,amount:'10000000',recipient:wallet,source:wallet,destination:wallet,reference:wallet,memo:`seeker-entry:${id}`,createdAt:now,expiresAt:now,signature:null,detail:null}};
}
const started=(e:PaidEntry,startKey:string):PaidEntry=>({...e,status:'running',run:{id:randomUUID(),wallet:e.wallet,startKey,manifest:e.manifest,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+420000).toISOString(),result:null}});
const replay=(ticks:number):Replay=>({version:1,chunks:[{x:0,y:-127,buttons:0,ticks}]});
function memory(){const values=new Map<string,string>();let fail=false;return {values,fail:(v:boolean)=>{fail=v;},read:async(k:string)=>values.get(k)??null,write:async(k:string,v:string)=>{if(fail)throw new Error('Disk full');values.set(k,v);}};}
test('a lost Start response recovers the original run from a pre-start marker; reinstall cannot reset it',async()=>{
 const disk=memory(),store=createPaidStore(disk),e=entry();const startKey=await store.prepare(e);const run=started(e,startKey);
 const recovered=await createPaidStore(disk).open(run);assert.equal(recovered.runId,run.run!.id);assert.equal(recovered.expiresAt,run.run!.expiresAt);assert.equal(recovered.replay.chunks.length,0);
 await assert.rejects(createPaidStore(memory()).open(run),/no saved input log/);
});
test('serialized snapshots survive reload and delayed snapshots cannot roll back a paid run',async()=>{
 const disk=memory(),store=createPaidStore(disk),e=entry();const startKey=await store.prepare(e);const run=started(e,startKey);await store.open(run);
 await Promise.all([store.checkpoint(run,replay(30)),store.checkpoint(run,replay(60)),store.checkpoint(run,replay(10))]);
 const saved=await createPaidStore(disk).open(run);assert.equal(replayTicks(saved.replay,7200),60);assert.equal(saved.expiresAt,run.run!.expiresAt);
 await assert.rejects(store.checkpoint(run,{version:1,chunks:[{x:127,y:0,buttons:0,ticks:90}]}),/disagree/);
 assert.equal(replayTicks((await store.read(run))!.replay,7200),60);
});
test('a second installation cannot turn another Start request into an empty recovered run',async()=>{
 const first=createPaidStore(memory()),second=createPaidStore(memory()),e=entry();
 const firstKey=await first.prepare(e),secondKey=await second.prepare(e);assert.notEqual(firstKey,secondKey);
 const run=started(e,firstKey);await first.open(run);await assert.rejects(second.open(run),/another installation/);
 assert.equal((await second.read(run))!.runId,null);
});
test('failed storage blocks initialization or checkpoint, retains data and allows a serialized retry',async()=>{
 const disk=memory(),store=createPaidStore(disk),e=entry();disk.fail(true);await assert.rejects(store.prepare(e),/Disk full/);disk.fail(false);const startKey=await store.prepare(e);const run=started(e,startKey);
 disk.fail(true);await assert.rejects(store.open(run),/Disk full/);disk.fail(false);await store.open(run);await store.checkpoint(run,replay(30));
 disk.fail(true);await assert.rejects(store.checkpoint(run,replay(60)),/Disk full/);assert.equal(replayTicks((await store.read(run))!.replay,7200),30);
 disk.fail(false);await store.checkpoint(run,replay(60));assert.equal(replayTicks((await store.read(run))!.replay,7200),60);
});
test('wallet, run, rule and deadline mismatches cannot resume another attempt or overwrite corrupt data',async()=>{
 const disk=memory(),store=createPaidStore(disk),e=entry();const startKey=await store.prepare(e);const run=started(e,startKey);await store.open(run);
 await assert.rejects(store.open({...run,wallet:'OtherWallet'}),/no saved input log/);
 await assert.rejects(store.open({...run,run:{...run.run!,id:randomUUID()}}),/ticket or deadline/);
 await assert.rejects(store.open({...run,run:{...run.run!,expiresAt:new Date(Date.now()+999999).toISOString()}}),/ticket or deadline/);
 assert.throws(()=>assertPaidRules({...run,manifest:{...run.manifest,seed:7}} as unknown as PaidEntry),/different game rules/);
 const k=[...disk.values.keys()][0]!;disk.values.set(k,'{broken');await assert.rejects(store.checkpoint(run,replay(30)),/unreadable/);assert.equal(disk.values.get(k),'{broken');
});
test('saved replays reject invalid axes, repeated action edges and oversized runs',()=>{
 for(const c of [{x:128,y:0,buttons:0,ticks:1},{x:0,y:0,buttons:2,ticks:2},{x:0,y:0,buttons:0,ticks:7201},{x:0,y:NaN,buttons:0,ticks:1}])assert.throws(()=>replayTicks({version:1,chunks:[c]},7200));
 assert.equal(replayTicks({version:1,chunks:[]},7200),0);
});
test('restored partial runs continue with identical state and recording across all native parity fixtures',()=>{
 for(const f of fixtures.cases){
  const input=f.replay as Replay,mission=f.mission as MissionId;replayTicks(input,getLevel(mission).hardLimitSeconds*30);
  const split=Math.max(1,Math.floor(input.chunks.length/2)),prefix:Replay={version:1,chunks:input.chunks.slice(0,split).map(c=>({...c}))};
  const state=restorePaidState(mission,prefix),recording:ReplayChunk[]=prefix.chunks.map(c=>({...c}));let dash=state.dashSeen,tool=state.toolSeen;
  for(const c of input.chunks.slice(split))for(let n=0;n<c.ticks;n++){if(c.buttons&2)dash++;if(c.buttons&4)tool++;recordStep(state,{x:c.x/127,y:c.y/127,interact:!!(c.buttons&1),dash,tool},recording);}
  assert.deepEqual(state,restorePaidState(mission,input),f.name);assert.deepEqual(recording,input.chunks,f.name);
 }
});
