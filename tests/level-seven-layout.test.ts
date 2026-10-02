import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,idleInput,step} from '../src/game/simulation';
import {updateTripwires} from '../src/game/heist-guards';
import type {Point} from '../src/game/level';

test('level seven offers two entry gaps and a longer route avoiding both lasers',()=>{
 const l=combatLevel('false-footsteps');
 for(const x of [1.15,5.15])assert(walkableSegment({x,y:17.4},{x,y:15.5},l));
 const quiet={...l,blockers:[...l.blockers,...l.encounter!.lasers!]};
 const direct=findPath(l.spawn,l.phone,l),detour=findPath(l.spawn,l.phone,quiet);
 assert(direct.length);assert(detour.length,'There must be a complete no-alarm approach');
 const length=(path:Point[])=>{let p=l.spawn,d=0;for(const next of path){d+=Math.hypot(next.x-p.x,next.y-p.y);p=next;}return d;};
 assert(length(detour)>length(direct)+1,'Avoiding the alarms must involve an actual detour');
 assert(findPath(l.phone,l.spawn,quiet).length,'Quiet escape must remain possible');
 for(const p of [...l.encounter!.pockets,...l.patrols.flatMap(g=>g.roam??g.route)])assert(findPath(l.spawn,p,l).length);
});
test('level seven long vertical beam is passable and reports a crossing once',()=>{
 const l=combatLevel('false-footsteps'),s=initialState(l.mission,l),lasers=l.encounter!.lasers!;
 assert.equal(lasers.length,2);assert(lasers[0]!.h>6&&lasers[0]!.w<.2);
 const a={x:4.8,y:10.5},b={x:5.55,y:10.5};assert(walkableSegment(a,b,l));
 s.px=a.x;s.py=a.y;s.x=b.x;s.y=b.y;updateTripwires(s,l);
 assert.equal(s.combat!.tripwire!.id,1);assert.equal(s.combat!.tripwire!.until,45);assert.equal(s.combat!.hp,100);assert(!s.combat!.hunt);
 s.px=s.x;s.py=s.y;updateTripwires(s,l);assert.equal(s.combat!.tripwire!.id,1);
});
test('level seven entrance is safe while reading the map and reserves wait for pickup',()=>{
 const l=combatLevel('false-footsteps'),s=initialState(l.mission,l);
 for(let i=0;i<150;i++)step(s,idleInput());assert.equal(s.status,'playing');assert.equal(s.combat!.hp,100);
 const reserve=l.patrols.findIndex(g=>g.reserveAfter!==undefined);assert(reserve>=0);assert(!s.guards[reserve]!.spawned);
});
