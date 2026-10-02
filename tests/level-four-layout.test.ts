import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,idleInput,step} from '../src/game/simulation';
import {updateTripwires} from '../src/game/heist-guards';

test('level four central court stays walkable between four solid pillars',()=>{
 const l=combatLevel('crossing-signals');
 assert(walkableSegment({x:3,y:12.5},{x:8,y:12.5},l),'Court must not become a solid island');
 for(const p of [{x:4.45,y:11.55},{x:6.65,y:11.55},{x:4.45,y:13.5},{x:6.65,y:13.5}])assert(!walkableSegment(p,p,l));
 for(const p of [{x:5.5,y:12.5},{x:3.3,y:7.5},l.phone])assert(findPath(l.spawn,p,l).length,'Bottom entry must reach court and upper lanes');
 assert(findPath(l.phone,l.spawn,l).length,'Phone must have a return route');
});
test('both level four side lasers are passable and trigger the shared short alarm',()=>{
 const l=combatLevel('crossing-signals');assert.equal(l.encounter?.lasers?.length,2);
 for(const laser of l.encounter!.lasers!){
  const x=laser.x+laser.w/2,a={x,y:laser.y+.5},b={x,y:laser.y-.5};
  assert(walkableSegment(a,b,l),'Laser is not a closed door');assert(findPath(l.spawn,a,l).length);
  const s=initialState(l.mission,l);s.px=a.x;s.py=a.y;s.x=b.x;s.y=b.y;updateTripwires(s,l);
  assert.equal(s.combat!.tripwire!.id,1);assert.equal(s.combat!.tripwire!.until,45);assert.equal(s.combat!.hp,100);
 }
});

test('level four entrance gives the courier time to read the map before exposure',()=>{
 const l=combatLevel('crossing-signals'),s=initialState(l.mission,l);
 for(let i=0;i<150;i++)step(s,idleInput());
 assert.equal(s.status,'playing');assert.equal(s.combat!.hp,100);
});
