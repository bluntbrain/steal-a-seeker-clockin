import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,idleInput,step} from '../src/game/simulation';
import {updateTripwires} from '../src/game/heist-guards';

test('level eight side doors and upper gallery connect both phones to a quiet extraction route',()=>{
 const l=combatLevel('warden-gate');
 assert.equal(l.targets!.length,2);
 for(const [a,b] of [[2.2,4.2],[8.2,10.2]] as const)assert(walkableSegment({x:a,y:8.8},{x:b,y:8.8},l));
 assert(walkableSegment({x:1.2,y:3.4},{x:1.2,y:1.25},l));
 const quiet={...l,blockers:[...l.blockers,...l.encounter!.lasers!]};
 for(const target of l.targets!){
  assert(findPath(l.spawn,target,quiet).length,'Both phones must be reachable without crossing a laser');
  assert(findPath(target,l.spawn,quiet).length,'Each recovery must have a quiet return route');
 }
});
test('level eight courtyard beam alerts once without blocking or damaging the courier',()=>{
 const l=combatLevel('warden-gate'),s=initialState(l.mission,l);
 const a={x:6.1,y:16.5},b={x:7.05,y:16.5};assert(walkableSegment(a,b,l));
 s.px=a.x;s.py=a.y;s.x=b.x;s.y=b.y;updateTripwires(s,l);
 assert.equal(s.combat!.tripwire!.until,45);assert.equal(s.combat!.hp,100);assert(!s.combat!.hunt);
 const id=s.combat!.tripwire!.id;s.px=s.x;s.py=s.y;updateTripwires(s,l);assert.equal(s.combat!.tripwire!.id,id);
});
test('level eight entrance allows time to read the map before the first recovery',()=>{
 const l=combatLevel('warden-gate'),s=initialState(l.mission,l);
 for(let i=0;i<150;i++)step(s,idleInput());
 assert.equal(s.status,'playing');assert.equal(s.combat!.hp,100);
 const reserve=l.patrols.findIndex(g=>g.reserveAfter!==undefined);assert(reserve>=0);assert(!s.guards[reserve]!.spawned);
});
