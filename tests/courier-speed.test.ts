import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {CAMPAIGN_IDS,type LevelDefinition} from '../src/game/level';
import {courierSpeedBonus,courierSpeedMultiplier} from '../src/game/courier-speed';
import {initialState,idleInput} from '../src/game/simulation';
import {stepCombat} from '../src/game/combat';
import {campaignCreditTarget} from '../server/campaign-credit-versions';
import {makeCombatContracts} from '../shared/contracts';

function travel(level:LevelDefinition,carrying=false){
 const arena={...level,spawn:{x:6,y:10},patrols:[],blockers:level.blockers.slice(0,4),gates:undefined,switches:undefined};
 const state=initialState(arena.mission,arena);state.carrying=carrying;
 state.combat!.order={seq:1,kind:'move',x:6,y:2,target:-1};state.combat!.path=[{x:6,y:2}];
 for(let tick=0;tick<30;tick++)stepCombat(state,idleInput());
 return {distance:10-state.y,walked:state.walked};
}
test('district pace increases only at levels 5 and 9 and never stacks on retry',()=>{
 for(let i=0;i<CAMPAIGN_IDS.length;i++){
  const first=combatLevel(CAMPAIGN_IDS[i]!),retry=combatLevel(CAMPAIGN_IDS[i]!);
  const bonus=Math.floor(i/4)*8;
  assert.equal(courierSpeedBonus(first),bonus);
  assert.equal(courierSpeedMultiplier(first),1+bonus/100);
  assert.equal(courierSpeedBonus(retry),bonus);
 }
});
test('actual movement and footstep distance receive the same boost unloaded and carrying',()=>{
 for(const id of ['crossing-signals','sweep-window','warden-gate','power-trade','last-vault'] as const){
  const l=combatLevel(id),multiplier=courierSpeedMultiplier(l);
  for(const carrying of [false,true]){
   const moved=travel(l,carrying),expected=(carrying?3.15:4.1)*multiplier;
   assert(Math.abs(moved.distance-expected)<1e-8,`${id}, carrying ${carrying}`);
   assert(Math.abs(moved.walked-expected)<1e-8,'Step cadence follows actual distance');
  }
 }
});
test('weekly play has fixed speed, even with new mechanics and a late-district number',()=>{
 for(const c of makeCombatContracts(new Date('2026-09-21'))){
  assert.equal(courierSpeedBonus(c.level),0);
  const future={...c.level,combat:{version:2 as const,revision:13 as const},number:12};
  assert.equal(courierSpeedMultiplier(future),1);
  assert(Math.abs(travel(future).distance-4.1)<1e-8);
 }
});
test('code 28 retains its old movement and claim thresholds',()=>{
 const hash='fc58093a3480dc87c58673c20c7cf44e34aa75a87c9c92c839f50c7c797a745a';
 for(const id of CAMPAIGN_IDS){
  const l=combatLevel(id),old={...l,combat:{version:2 as const,revision:12 as const}};
  assert.equal(courierSpeedBonus(old),0);
  assert.equal(campaignCreditTarget(hash,id),l.targetSeconds);
  assert(Math.abs(travel(old).distance-4.1)<1e-8);
 }
});
