import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_IDS} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {assistedCombatTap,nearestReachableFloor} from '../src/controls/tapDestination';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,idleInput,step} from '../src/game/simulation';
import {recordStep} from '../src/game/recording';
import {verifyReplay} from '../server/replay';
import type {ReplayChunk} from '../shared/replay';

test('every blocker, map corner and floor grid tap on all twelve maps resolves to reachable floor',()=>{
 for(const id of CAMPAIGN_IDS){const l=combatLevel(id);l.patrols=[];const state=initialState(id,l);
  const taps=[...l.blockers.map(b=>({x:b.x+b.w/2,y:b.y+b.h/2})),{x:0,y:0},{x:12,y:20},{x:0,y:20},{x:12,y:0}];
  for(let x=1;x<12;x+=2)for(let y=1;y<20;y+=2)taps.push({x,y});
  for(const tap of taps){const command=assistedCombatTap(state,tap.x,tap.y,1);assert.notEqual(command.kind,'attack');
   const path=findPath(state,command,l);assert(path.length,`${id}: ${JSON.stringify(tap)} => ${JSON.stringify(command)}`);let p={x:state.x,y:state.y};for(const q of path){assert(walkableSegment(p,q,l));p=q;}
   const s=initialState(id,l);step(s,{...idleInput(),command});assert.notEqual(s.combat!.feedback,'blocked',`${id}: accepted command cannot fail`);
  }
 }
});
test('wall projection is close to the tapped surface and cannot cross disconnected regions or closed doors',()=>{
 const l={...combatLevel('practice'),patrols:[],blockers:[{x:0,y:8,w:12,h:1,kind:'wall' as const},{x:5,y:12,w:2,h:3,kind:'wall' as const}]};
 const from={x:2,y:16},tap={x:5.1,y:13.2},p=nearestReachableFloor(from,tap,l);
 assert(Math.abs(p.x-4.66)<.001);assert(Math.abs(p.y-tap.y)<.001);
 const closed=nearestReachableFloor(from,{x:2,y:3},l);assert(closed.y>=9.33);assert(findPath(from,closed,l).length);
 assert.deepEqual(nearestReachableFloor(from,tap,l),p);
});
test('a wall tap is recorded as its resolved destination and the existing server replay agrees',()=>{
 const l=combatLevel('practice');l.patrols=[];const s=initialState('practice',l),chunks:ReplayChunk[]=[];
 const b=l.blockers.find(b=>b.x>1&&b.y>1)!;const cmd=assistedCombatTap(s,b.x+b.w/2,b.y+b.h/2,1);
 recordStep(s,{...idleInput(),command:cmd},chunks);for(let i=0;i<200;i++)recordStep(s,idleInput(),chunks);
 assert(Math.hypot(s.x-cmd.x,s.y-cmd.y)<.03);
 const verified=verifyReplay('practice',{version:2,chunks},l);assert.equal(verified.ticks,s.ticks);assert.equal(verified.hp,s.combat!.hp);
});

test('assisted taps preserve all eight guided tutorial actions',async()=>{
 const {GUIDE_STEPS,guideCommand,guideDone,guideTarget}=await import('../src/onboarding/combat-guide');
 const l=combatLevel('practice'),s=initialState('practice',l);
 for(let i=0;i<GUIDE_STEPS.length;i++){const target=guideTarget(i,s)!;const command=guideCommand(i,assistedCombatTap(s,target.x,target.y,i+1));assert(command,`Guide action ${i} accepted`);step(s,{...idleInput(),command});let budget=600;while(!guideDone(i,s)&&s.status==='playing'&&budget--)step(s,idleInput());assert(guideDone(i,s),`Guide action ${i} completed`);}
 assert.equal(s.status,'won');
});


test('Dark Circuit gate and switch label taps activate the linked switch and open the passage',async()=>{
 const {mechanismHint}=await import('../src/controls/mechanisms');
 for(const target of ['gate','label']){
  const l=combatLevel('power-trade');l.patrols=[];const s=initialState('power-trade',l),b=l.gates![0]!.box,p=l.switches![0]!;
  assert(s.closedGates[0]);assert.match(mechanismHint(s,l)!,/Tap.*switch/);
  const tap=target==='gate'?{x:b.x+b.w/2,y:b.y+b.h/2}:{x:p.x,y:p.y-1};
  const command=assistedCombatTap(s,tap.x,tap.y,1);assert.equal(command.kind,'switch');assert.equal(command.target,0);
  step(s,{...idleInput(),command});assert.match(mechanismHint(s,l)!,/Moving/);
  let budget=1800;while(!s.activations&&s.status==='playing'&&budget--)step(s,idleInput());step(s,idleInput());
  assert.equal(s.activations,1);assert.equal(s.power,1);assert.equal(s.closedGates[0],false);assert.match(mechanismHint(s,l)!,/Gate open/);
  assert(!s.blockers.some(v=>v.x===b.x&&v.y===b.y&&v.w===b.w&&v.h===b.h),'opened gate removed from collision');
 }
});
