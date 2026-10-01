import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {combatTap,COMBAT} from '../src/game/combat';
import {assistedCombatTap} from '../src/controls/tapDestination';
import {initialState,idleInput,step,type GameState} from '../src/game/simulation';
import {walkableSegment,findPath} from '../src/game/navigation';
import {GUIDE_STEPS} from '../src/onboarding/combat-guide';
import {verifyReplay} from '../server/replay';
import {recordStep} from '../src/game/recording';
import type {ReplayChunk} from '../shared/replay';
function arena(){const l=combatLevel('practice');l.combat={version:2,revision:14};return {...l,spawn:{x:2,y:10},blockers:l.blockers.slice(0,4),patrols:[{...l.patrols[0]!,range:0,route:[{x:8,y:10},{x:8,y:9}],speed:0,roam:undefined}]};}
function tick(s:GameState,n:number){for(let i=0;i<n;i++)step(s,idleInput());}
test('one distant guard tap approaches, stops with a gap, then fires',()=>{
 const l=arena(),s=initialState(l.mission,l);
 step(s,{...idleInput(),command:assistedCombatTap(s,8,10,1)});
 assert.equal(s.combat!.order?.kind,'attack');assert.equal(s.combat!.shots,0);
 while(s.combat!.shots===0&&s.ticks<100){step(s,idleInput());assert(walkableSegment(s,s,l));}
 assert(s.combat!.shots>0);assert(s.x>2);const gap=Math.hypot(s.x-s.guards[0]!.x,s.y-s.guards[0]!.y);assert(gap>2.3&&gap<=2.6);
 tick(s,20);assert.equal(s.guards[0]!.hp,0);tick(s,1);assert.equal(s.combat!.order,null);
});
test('a selected target behind cover is approached around the wall without firing through it',()=>{
 const l=arena();l.blockers.push({x:4,y:7,w:1,h:6,kind:'wall'});const s=initialState(l.mission,l);
 step(s,{...idleInput(),command:assistedCombatTap(s,8,10,1)});assert.equal(s.combat!.order?.kind,'attack');
 assert.equal(s.combat!.shots,0);assert(s.combat!.path.length>1);
 for(let i=0;i<220&&s.guards[0]!.hp>0;i++){const p={x:s.x,y:s.y};step(s,idleInput());assert(walkableSegment(p,s,l));}
 assert.equal(s.guards[0]!.hp,0);
});
test('a moving target is followed with bounded replans; floor tap cancels immediately',()=>{
 const l=arena(),s=initialState(l.mission,l);step(s,{...idleInput(),command:combatTap(s,8,10,1)});
 const first=s.combat!.attackPlan!.nextTick;tick(s,5);s.guards[0]!.x=10;s.guards[0]!.y=12;tick(s,3);
 assert.equal(s.combat!.attackPlan!.nextTick,first);tick(s,5);assert(s.combat!.attackPlan!.nextTick>first);
 assert.equal(s.combat!.attackPlan!.x,10);assert.equal(s.combat!.order?.kind,'attack');
 step(s,{...idleInput(),command:{seq:2,kind:'move',target:-1,x:2,y:15}});assert.equal(s.combat!.order?.kind,'move');assert.equal(s.combat!.attackPlan,undefined);
 const shots=s.combat!.shots;tick(s,30);assert.equal(s.combat!.shots,shots);
});
test('unreachable target does not leave a permanent attack; closed gates remain solid',()=>{
 const l=arena();l.blockers.push({x:5,y:0,w:1,h:20,kind:'wall'});const s=initialState(l.mission,l);
 step(s,{...idleInput(),command:combatTap(s,8,10,1)});assert.equal(s.combat!.order,null);assert.equal(s.combat!.feedback,'blocked');assert.equal(s.combat!.shots,0);
});
test('reference warehouse objectives, tutorial taps, entrances and patrol anchors are connected',()=>{
 const l=combatLevel('practice');assert.equal(l.patrols.length,7);
 for(const p of [l.spawn,l.phone,{x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2},...GUIDE_STEPS,...l.patrols.flatMap(g=>g.route),...l.encounter!.junctions]){
  assert(walkableSegment(p,p,l),JSON.stringify(p));assert(findPath(l.spawn,p,l).length,JSON.stringify(p));
 }
});
test('new approach rules replay identically on server and survive serialization',()=>{
 const l=arena();l.blockers.push({x:4,y:7,w:1,h:6,kind:'wall'});const s=initialState(l.mission,l),chunks:ReplayChunk[]=[];
 recordStep(s,{...idleInput(),command:combatTap(s,8,10,1)},chunks);
 for(let i=0;i<150;i++)recordStep(s,idleInput(),chunks);
 const result=verifyReplay(l.mission,{version:2,chunks},l);assert.equal(result.ticks,s.ticks);assert.equal(result.hp,s.combat!.hp);
 const copy:GameState=JSON.parse(JSON.stringify(s));tick(s,25);tick(copy,25);assert.deepEqual(JSON.parse(JSON.stringify(s)),copy);
});
