import test from 'node:test';
import assert from 'node:assert/strict';
import {getLevel} from '../src/game/level';
import {initialState,idleInput,step} from '../src/game/simulation';
import {makeGuards,updateGuards,sees,sightDistance} from '../src/game/guards';
import {blockedBy} from '../src/game/geometry';
test('scanner sweeps in place and its detection respects the same cover as its beam',()=>{
 const level=getLevel('sweep-window'),guards=makeGuards('sweep-window'),g=guards[0]!,origin={x:g.x,y:g.y};for(let i=0;i<60;i++)updateGuards(guards,-100,-100,1/30,level);assert.deepEqual({x:g.x,y:g.y},origin);assert(Math.abs(g.angle-(Math.PI/2+1.25))<1e-6);
 g.angle=0;assert(sees(g,7.4,6.4,level));assert(!sees(g,10,6.4,level));assert(Math.abs(sightDistance(g.x,g.y,1,0,7.5,level)-1.2)<1e-6);
});
test('closed timed gate blocks pushing; scheduled opening permits passage',()=>{
 const s=initialState('narrow-crossing');Object.assign(s,{x:2.9,y:11.3,px:2.9,py:11.3,elapsed:4.5});
 for(let i=0;i<25;i++)step(s,{...idleInput(),y:-1});assert(s.closedGates[0]);assert(s.y>10.85);assert(!blockedBy(s.x,s.y,s.blockers));
 s.elapsed=7.99;for(let i=0;i<25;i++)step(s,{...idleInput(),y:-1});assert(!s.closedGates[0]);assert(s.y<9.3);assert(!blockedBy(s.x,s.y,s.blockers));
});
test('gate waits for occupants to leave instead of closing on them',()=>{
 const s=initialState('narrow-crossing');Object.assign(s,{x:2.9,y:10,px:2.9,py:10,elapsed:3.7});for(let i=0;i<20;i++)step(s,idleInput());assert(!s.closedGates[0]);assert(!blockedBy(s.x,s.y,s.blockers));
 for(let i=0;i<30;i++)step(s,{...idleInput(),y:1});assert(s.y>11.5);assert(s.closedGates[0]);assert(!blockedBy(s.x,s.y,s.blockers));
});
