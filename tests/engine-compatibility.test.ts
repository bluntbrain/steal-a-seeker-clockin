import test from 'node:test';
import assert from 'node:assert/strict';
import frozen from './fixtures/weekly-2026-09-14.json';
import frozen6 from './fixtures/weekly-revision6-before-encounters.json';
import campaign8 from './fixtures/campaign-revision8.json';
import campaign9 from './fixtures/campaign-revision9.json';
import campaign10 from './fixtures/campaign-revision10.json';
import campaign11 from './fixtures/campaign-revision11.json';
import campaign12 from './fixtures/campaign-revision12.json';
import campaign16 from './fixtures/campaign-revision16.json';
import type {LevelDefinition} from '../src/game/level';
import engine from '../shared/weekly-engine.json';
import rules from '../shared/rules-manifest.json';
// frozen weekly manifests stay as fixtures of published rooms whose archived verifiers must keep agreeing with the live source
type WeeklyCompatibility={rulesHash:string;engineHash?:string;contracts:{name:string;level:LevelDefinition}[]};
import {currentWeeklyEngine} from '../server/rules-version';
import {checkRuleBundle} from '../server/rule-bundle';
import {verifyReplay} from '../server/replay';
import {solveCombat} from '../scripts/qa-combat';
import type {Replay} from '../shared/replay';
import {initialState,idleInput} from '../src/game/simulation';
import {recordStep} from '../src/game/recording';

const manifest=frozen as unknown as WeeklyCompatibility;
test('the engine fingerprint matches the hashed rule files',async()=>{
 assert.deepEqual(await currentWeeklyEngine(),engine);
 assert.notEqual(manifest.rulesHash,rules.rulesHash);
});
test('the frozen active week has identical winning and delayed outcomes in its archived verifier',async()=>{
 const archived=await import((await checkRuleBundle(manifest.rulesHash)).href);
 for(const c of manifest.contracts){
  const win=solveCombat(c.level);assert(win,`${c.name}: no winning input sequence`);
  assert.equal(verifyReplay(c.level.mission,win.replay,c.level).status,'won');
  for(const delay of [0,6,15,30,60,120]){
   const s=initialState(c.level.mission,c.level),replay:Replay={version:2,chunks:[]};
   // A delayed route can die earlier. Stop recording at that terminal result,
   // just like the app, rather than sending impossible post-death input.
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&s.status==='playing';i++)recordStep(s,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(c.level.mission,replay,c.level),archived.verifyReplay(c.level.mission,replay,c.level),`${c.name}: delay ${delay}`);
  }
 }
});

test('scout encounters preserve revision-6 published wins and delayed replay outcomes',async()=>{
 const week=frozen6 as unknown as WeeklyCompatibility;
 const archived=await import((await checkRuleBundle(week.rulesHash)).href);
 for(const c of week.contracts){
  const win=solveCombat(c.level);assert(win);
  for(const delay of [0,15,60,120]){
   const state=initialState(c.level.mission,c.level),replay:Replay={version:2,chunks:[]};
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&state.status==='playing';i++)recordStep(state,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(c.level.mission,replay,c.level),archived.verifyReplay(c.level.mission,replay,c.level));
  }
 }
});

test('revision 7 campaigns retain their archived verifier outcomes after roaming update',async()=>{
 const hash='8c9a48902b47a267149ec1f46d37d25fa3df89f9b2ab1098f9ecaba151dfbae6';
 const {legacyCombatLevel}=await import('../src/game/combat-levels');
 const {CAMPAIGN_IDS}=await import('../src/game/level');
 const archived=await import((await checkRuleBundle(hash)).href);
 for(const mission of CAMPAIGN_IDS){const level=legacyCombatLevel(mission),win=solveCombat(level);assert(win);
  for(const delay of [0,45,120]){const state=initialState(mission,level),replay:Replay={version:2,chunks:[]};
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&state.status==='playing';i++)recordStep(state,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(mission,replay,level),archived.verifyReplay(mission,replay,level));
  }
 }
});

test('revision 8 replays keep their published outcomes after combat contact is fixed',async()=>{
 const archived=await import((await checkRuleBundle(campaign8.rulesHash)).href);
 for(const level of campaign8.levels as LevelDefinition[]){const win=solveCombat(level);assert(win);
  for(const delay of [0,45,120]){const state=initialState(level.mission,level),replay:Replay={version:2,chunks:[]};
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&state.status==='playing';i++)recordStep(state,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(level.mission,replay,level),archived.verifyReplay(level.mission,replay,level),`${level.title}: delay ${delay}`);
  }
 }
});

test('revision 9 campaign replays retain their published results after heist encounters',async()=>{
 const archived=await import((await checkRuleBundle(campaign9.rulesHash)).href);
 for(const level of campaign9.levels as LevelDefinition[]){const win=solveCombat(level);assert(win);
  for(const delay of [0,45,120]){const state=initialState(level.mission,level),replay:Replay={version:2,chunks:[]};
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&state.status==='playing';i++)recordStep(state,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(level.mission,replay,level),archived.verifyReplay(level.mission,replay,level),`${level.title}: delay ${delay}`);
  }
 }
});

test('revision 10 outcomes and weekly eligibility survive the revision 11 pressure increase',async()=>{
 const archived=await import((await checkRuleBundle(campaign10.rulesHash)).href);
 for(const level of campaign10.levels as LevelDefinition[]){
  const win=solveCombat(level);assert(win);
  for(const delay of [0,45,120]){
   const state=initialState(level.mission,level),replay:Replay={version:2,chunks:[]};
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&state.status==='playing';i++)recordStep(state,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(level.mission,replay,level),archived.verifyReplay(level.mission,replay,level),`${level.title}: delay ${delay}`);
  }
 }
});

test('shipped revision 11 replays and frozen weeks keep their original movement',async()=>{
 const archived=await import((await checkRuleBundle(campaign11.rulesHash)).href);
 for(const level of campaign11.levels as LevelDefinition[]){
  const win=solveCombat(level);assert(win);
  for(const delay of [0,45,120]){
   const state=initialState(level.mission,level),replay:Replay={version:2,chunks:[]};
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&state.status==='playing';i++)recordStep(state,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(level.mission,replay,level),archived.verifyReplay(level.mission,replay,level),`${level.title}: delay ${delay}`);
  }
 }
});

test('revision 12 movement stays unchanged when district speed boosts ship',async()=>{
 const archived=await import((await checkRuleBundle(campaign12.rulesHash)).href);
 for(const level of campaign12.levels as LevelDefinition[]){
  const win=solveCombat(level);assert(win);
  for(const delay of [0,45,120]){
   const state=initialState(level.mission,level),replay:Replay={version:2,chunks:[]};
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&state.status==='playing';i++)recordStep(state,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(level.mission,replay,level),archived.verifyReplay(level.mission,replay,level),`${level.title}: delay ${delay}`);
  }
 }
});

test('revision 13 replays and active weeks remain unchanged after target following ships',async()=>{
 const fixture=(await import('./fixtures/campaign-revision13.json')).default;
 const archived=await import((await checkRuleBundle(fixture.rulesHash)).href);
 for(const level of fixture.levels as LevelDefinition[]){
  const win=solveCombat(level);assert(win,level.title);
  assert.deepEqual(verifyReplay(level.mission,win.replay,level),archived.verifyReplay(level.mission,win.replay,level));
 }
});

test('revision 14 targeting replays retain archived results after knife rollout',async()=>{
 const {default:snapshot}=await import('./fixtures/campaign-revision14.json');
 const archived=await import((await checkRuleBundle(snapshot.rules.rulesHash)).href);
 for(const level of snapshot.levels as LevelDefinition[]){
  const state=initialState(level.mission,level),replay:Replay={version:2,chunks:[]};
  for(let tick=0;tick<360&&state.status==='playing';tick++){
   const g=state.guards.findIndex(g=>g.active&&g.hp>0),command=tick%30===0&&g>=0?{seq:tick+1,kind:'attack' as const,target:g,x:state.guards[g]!.x,y:state.guards[g]!.y}:undefined;
   recordStep(state,{...idleInput(),command},replay.chunks);
  }
  assert.deepEqual(verifyReplay(level.mission,replay,level),archived.verifyReplay(level.mission,replay,level));
 }
});


test('revision 15 guard replays remain identical to the archived verifier after fair pursuit ships',async()=>{
 const {CAMPAIGN_IDS}=await import('../src/game/level');
 const {combatLevel}=await import('../src/game/combat-levels');
 const {combatTap}=await import('../src/game/combat');
 const hash='77efb541f8f64e55b6477981517159be26809f82504d7d140a2b4ef73e88965b';
 const archived=await import((await checkRuleBundle(hash)).href);
 for(const id of CAMPAIGN_IDS){
  const level=combatLevel(id);level.combat={version:2,revision:15};
  for(const mode of ['phone','attack'] as const){
   const state=initialState(id,level),replay:Replay={version:2,chunks:[]};
   for(let tick=0;tick<600&&state.status==='playing';tick++){
    const enemy=state.guards.find(g=>g.active&&g.hp>0),target=mode==='attack'&&enemy?enemy:level.phone;
    const command=tick%30===0?combatTap(state,target.x,target.y,tick+1):undefined;
    recordStep(state,{...idleInput(),command},replay.chunks);
   }
   assert.deepEqual(verifyReplay(id,replay,level),archived.verifyReplay(id,replay,level),`${id}: ${mode}`);
  }
 }
});

test('revision 16 guards stay unchanged when the revision 17 engine ships',async()=>{
 assert.equal(campaign16.engineHash,'2dff16c1583573a1d66fa23b3249529d77224ca8da0b997de4834e593cb729f4');assert.notEqual(engine.engineHash,campaign16.engineHash);
 const archived=await import((await checkRuleBundle(campaign16.rulesHash)).href);
 for(const level of campaign16.levels as LevelDefinition[]){
  assert.equal(level.combat?.revision,16);const win=solveCombat(level);assert(win,level.title);
  for(const delay of [0,45,120]){
   const state=initialState(level.mission,level),replay:Replay={version:2,chunks:[]};
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&state.status==='playing';i++)recordStep(state,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(level.mission,replay,level),archived.verifyReplay(level.mission,replay,level),`${level.title}: delay ${delay}`);
  }
 }
});
