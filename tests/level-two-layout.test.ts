import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';

test('level two rooms connect to the service lane and outer escape lane through open doorways',()=>{
 const l=combatLevel('cone-lesson');
 const crossings=[
  [{x:2.6,y:2.8},{x:2.6,y:4.4}],
  [{x:4.5,y:9.65},{x:6.5,y:9.65}],
  [{x:9.7,y:9.65},{x:10.95,y:9.65}],
  [{x:4.5,y:14.55},{x:6.5,y:14.55}],
  [{x:9.5,y:16.5},{x:10.95,y:16.5}],
 ];
 for(const [a,b] of crossings){assert(walkableSegment(a!,b!,l),`Blocked door: ${JSON.stringify([a,b])}`);assert(findPath(l.spawn,b!,l).length);}
 // Each middle/bottom room has an alternate opening for flanking or escaping.
 assert(findPath({x:8,y:9.65},{x:10.95,y:12.9},l).length);
 assert(findPath({x:8,y:15.25},{x:10.95,y:18.5},l).length);
 assert.equal(l.gates,undefined);assert(l.blockers.filter(b=>b.kind==='crate').length>=18);
});
