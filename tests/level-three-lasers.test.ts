import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,idleInput,step} from '../src/game/simulation';
import {updateTripwires,updateHeistGuards} from '../src/game/heist-guards';
import {mechanicFrame} from '../src/onboarding/mechanic-demo';

const level=()=>combatLevel('battery-dash');
test('level three yard, both laser passages, upper room and patrol anchors are connected',()=>{
 const l=level();assert.equal(l.encounter?.lasers?.length,2);
 for(const x of [5.25,9.85])assert(walkableSegment({x,y:15.6},{x,y:14},l));
 for(const p of [l.phone,...l.patrols.flatMap(g=>g.route),...l.encounter!.pockets]){
  assert(walkableSegment(p,p,l),`inside a wall ${JSON.stringify(p)}`);
  assert(findPath(l.spawn,p,l).length,`unreachable ${JSON.stringify(p)}`);
 }
 assert(findPath(l.phone,l.spawn,l).length);
});
function fixture(){
 const l=level();l.blockers=l.blockers.slice(0,4);l.encounter!.lasers=[{x:4,y:10,w:2,h:.14,kind:'wall'}];
 const base={...l.patrols[0]!,range:.01,speed:0,roam:undefined};
 l.patrols=[{...base,route:[{x:5,y:8}]},{...base,route:[{x:10,y:2}]},{...base,route:[{x:6,y:8}],reserveAfter:0},{...base,route:[{x:4,y:8}]}];
 for(const g of l.patrols)g.route.push({...g.route[0]!});
 const s=initialState(l.mission,l);s.guards[3]!.hp=0;s.px=5;s.py=10.5;s.x=5;s.y=9.7;s.ticks=10;
 return {s,l};
}
test('fast laser crossing reports once, only nearby deployed living guards, without global hunt or damage',()=>{
 const {s,l}=fixture();updateTripwires(s,l);
 assert.equal(s.combat!.tripwire!.id,1);assert.equal(s.combat!.tripwire!.until-s.ticks,45);
 assert.equal(s.combat!.hp,100);assert.equal(s.combat!.hunt,undefined);assert(!s.securityAlarm);
 assert.equal(s.guards[0]!.mode,'investigate');assert.deepEqual(s.guards[0]!.lastSeen,{x:5,y:9.7});
 for(const g of s.guards.slice(1))assert(!g.alerted);
 // An ongoing search keeps the reported position; the hidden courier is not tracked.
 s.x=1;s.y=18;s.px=1;s.py=18;updateHeistGuards(s,1/30,l,()=>{});
 assert.deepEqual(s.guards[0]!.lastSeen,{x:5,y:9.7});assert(!s.guards[0]!.heist!.hunting);
});
test('standing in a laser cannot extend the alarm; fully leaving rearms the next crossing',()=>{
 const {s,l}=fixture();s.py=10.5;s.y=10.05;updateTripwires(s,l);
 for(let i=0;i<70;i++){s.px=s.x;s.py=s.y;s.ticks++;updateTripwires(s,l);}
 assert.equal(s.combat!.tripwire!.id,1);assert(s.combat!.tripwire!.until<s.ticks);
 s.py=s.y;s.y=10.7;updateTripwires(s,l);s.py=10.7;s.y=9.7;updateTripwires(s,l);
 assert.equal(s.combat!.tripwire!.id,2);
});
test('laser does not replace an active pursuit or trigger for enemies crossing alone',()=>{
 const {s,l}=fixture();s.px=s.x=1;s.py=s.y=18;updateTripwires(s,l);assert.equal(s.combat!.tripwire!.id,0);
 updateHeistGuards(s,1/30,l,()=>{});const g=s.guards[0]!;g.heist!.hunting=true;g.lastSeen={x:2,y:3};
 s.px=s.x=5;s.py=10.5;s.y=9.7;updateTripwires(s,l);assert.deepEqual(g.lastSeen,{x:2,y:3});
});
test('normal simulation movement triggers tripwire and restart clears its state',()=>{
 const {s,l}=fixture();s.x=s.px=5;s.y=s.py=10.7;
 step(s,{...idleInput(),command:{seq:1,kind:'move',x:5,y:9,target:-1}});
 for(let i=0;i<20;i++)step(s,idleInput());
 assert.equal(s.combat!.tripwire!.id,1);assert.equal(initialState(l.mission,l).combat!.tripwire,undefined);
});
test('laser lesson shows a 1.5 second alarm and relocation after the snapshot',()=>{
 assert(!mechanicFrame('laser',5.8).laserAlarm);assert(mechanicFrame('laser',6).laserAlarm);
 assert(!mechanicFrame('laser',7.4).laserAlarm);const end=mechanicFrame('laser',14);
 assert.equal(end.x,235);assert.equal(end.actors[0]!.x,100);
});
