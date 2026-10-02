import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,idleInput,step} from '../src/game/simulation';
import {updateTripwires} from '../src/game/heist-guards';

test('level five center slot and both cross-links stay open around the twin walls',()=>{
 const l=combatLevel('sweep-window');
 assert(walkableSegment({x:5.25,y:12.7},{x:5.25,y:1.25},l));
 assert(walkableSegment({x:2,y:1.25},{x:8.4,y:1.25},l));
 assert(walkableSegment({x:2.65,y:12.75},{x:9.2,y:12.75},l));
 for(const x of [4.1,6.4])assert(!walkableSegment({x,y:7},{x,y:7},l));
 assert(!walkableSegment({x:5.25,y:15},{x:5.25,y:15},l),'Lower block is solid');
 for(const p of [{x:1,y:17.4},{x:8.6,y:16.8},l.phone])assert(findPath(l.spawn,p,l).length);
 assert(findPath(l.phone,l.spawn,l).length,'Return route reaches the entrance');
});
test('level five left laser is a passable one-shot alert crossing',()=>{
 const l=combatLevel('sweep-window'),beam=l.encounter!.lasers![0]!;
 assert.equal(l.encounter!.lasers!.length,1);
 const x=beam.x+beam.w/2,a={x,y:beam.y+.5},b={x,y:beam.y-.5};assert(walkableSegment(a,b,l));
 const s=initialState(l.mission,l);s.px=x;s.py=a.y;s.x=x;s.y=b.y;updateTripwires(s,l);
 assert.equal(s.combat!.tripwire!.id,1);assert.equal(s.combat!.tripwire!.until,45);assert(!s.securityAlarm);
});
test('level five entrance remains safe while the player reads the opening map',()=>{
 const l=combatLevel('sweep-window'),s=initialState(l.mission,l);
 for(let i=0;i<150;i++)step(s,idleInput());assert.equal(s.status,'playing');assert.equal(s.combat!.hp,100);
});
