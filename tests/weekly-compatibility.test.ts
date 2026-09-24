import test from 'node:test';
import assert from 'node:assert/strict';
import frozen from './fixtures/weekly-2026-09-14.json';
import frozen6 from './fixtures/weekly-revision6-before-encounters.json';
import campaign8 from './fixtures/campaign-revision8.json';
import campaign9 from './fixtures/campaign-revision9.json';
import type {LevelDefinition} from '../src/game/level';
import engine from '../shared/weekly-engine.json';
import rules from '../shared/rules-manifest.json';
import {isWeeklyCompatible,LEGACY_WEEKLY_ENGINES,PRESERVED_REVISION_3_ENGINE,type WeeklyCompatibility} from '../shared/weekly-compatibility';
import {currentWeeklyEngine} from '../server/rules-version';
import {checkRuleBundle} from '../server/rule-bundle';
import {verifyReplay} from '../server/replay';
import {solveCombat} from '../scripts/qa-combat';
import type {Replay} from '../shared/replay';
import {initialState,idleInput} from '../src/game/simulation';
import {recordStep} from '../src/game/recording';

const manifest=frozen as unknown as WeeklyCompatibility;
test('campaign-only rules changes do not invalidate a supported weekly engine',async()=>{
 assert.deepEqual(await currentWeeklyEngine(),engine);
 assert.notEqual(manifest.rulesHash,rules.rulesHash);
 assert(isWeeklyCompatible(manifest));
 assert(isWeeklyCompatible({...manifest,rulesHash:'different-campaign-map-version',engineHash:engine.engineHash}));
 assert(!isWeeklyCompatible({...manifest,rulesHash:'unknown-old-version'}));
 assert(!isWeeklyCompatible({...manifest,engineHash:'unknown-engine'}));
});
test('unknown weekly mechanics fail closed even when the engine fingerprint matches',()=>{
 const copy=JSON.parse(JSON.stringify(manifest));copy.contracts[0].level.combat.revision=999;
 assert(!isWeeklyCompatible({...copy,engineHash:engine.engineHash}));
 copy.contracts[0].level.combat.revision=5;
 assert(!isWeeklyCompatible(copy)); // Legacy proof covers revision 3 only.
 assert(!isWeeklyCompatible({...manifest,contracts:manifest.contracts.slice(0,2)}));
});
test('the frozen active week has identical winning and delayed outcomes in its archived verifier',async()=>{
 assert.equal(LEGACY_WEEKLY_ENGINES[manifest.rulesHash],PRESERVED_REVISION_3_ENGINE,'Preserved engine must have an archived verifier.');
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

test('scout encounters preserve revision-6 weekly wins and delayed replay outcomes',async()=>{
 const week=frozen6 as unknown as WeeklyCompatibility;
 assert(isWeeklyCompatible(week));
 const archived=await import((await checkRuleBundle(week.rulesHash)).href);
 for(const c of week.contracts){
  const win=solveCombat(c.level);assert(win);
  for(const delay of [0,15,60,120]){
   const state=initialState(c.level.mission,c.level),replay:Replay={version:2,chunks:[]};
   for(const chunk of [...(delay?[{ticks:delay,command:undefined}]:[]),...win.replay.chunks])for(let i=0;i<chunk.ticks&&state.status==='playing';i++)recordStep(state,{...idleInput(),command:chunk.command},replay.chunks);
   assert.deepEqual(verifyReplay(c.level.mission,replay,c.level),archived.verifyReplay(c.level.mission,replay,c.level));
  }
 }
 const unsupported=JSON.parse(JSON.stringify(week));unsupported.contracts[0].level.combat.revision=7;
 assert(!isWeeklyCompatible(unsupported),'An old engine must not accept the new drone mechanics');
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
 const oldWeek=JSON.parse(JSON.stringify(manifest));oldWeek.rulesHash=campaign9.rulesHash;delete oldWeek.engineHash;
 assert(isWeeklyCompatible(oldWeek));oldWeek.contracts[0].level.combat.revision=10;
 assert(!isWeeklyCompatible(oldWeek),'The old engine cannot accept new heist mechanics');
});
