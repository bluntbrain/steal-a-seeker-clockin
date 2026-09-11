import test from 'node:test';
import assert from 'node:assert/strict';
import {getLevel} from '../src/game/level';
import {findPath,walkableSegment} from '../src/game/navigation';
test('investigation path detours around cover with robot clearance and deterministic waypoints',()=>{
 const level=getLevel('practice'),from={x:4,y:12},to={x:7,y:12};assert(!walkableSegment(from,to,level));const path=findPath(from,to,level);assert(path.length>=2);let previous=from;for(const p of path){assert(walkableSegment(previous,p,level));previous=p;}assert.deepEqual(path.at(-1),to);assert.deepEqual(findPath(from,to,level),path);
});
test('unreachable or obstructed noise does not teleport a guard through a barrier',()=>{
 const level=getLevel('practice');assert.deepEqual(findPath({x:3.7,y:10.5},{x:5,y:12},level),[]);const divided={...level,blockers:[...level.blockers,{x:.7,y:9,w:10.6,h:1,kind:'wall' as const}]};assert.deepEqual(findPath({x:2,y:12},{x:2,y:8},divided),[]);
});
