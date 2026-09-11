import test from 'node:test';
import assert from 'node:assert/strict';
import {getLevel} from '../src/game/level';
import {initialState,idleInput,step} from '../src/game/simulation';
import {makeGuards,updateGuards} from '../src/game/guards';
import {blockedBy} from '../src/game/geometry';
test('noise causes investigation, a bounded search and a return to the patrol route',()=>{
 const level=getLevel('false-footsteps'),guards=makeGuards('false-footsteps'),g=guards[0]!;
 updateGuards(guards,-100,-100,1/30,level,{x:7.2,y:7.2});assert.equal(g.mode,'investigate');const modes=new Set<string>();
 for(let i=0;i<1800;i++){updateGuards(guards,-100,-100,1/30,level);modes.add(g.mode);assert(!blockedBy(g.x,g.y,level.blockers));}
 assert(modes.has('search'));assert(modes.has('return'));assert.equal(g.mode,'patrol');
});
test('last-seen position is investigated after the courier breaks sight',()=>{
 const level=getLevel('false-footsteps'),guards=makeGuards('false-footsteps'),g=guards[0]!;g.wait=5;
 updateGuards(guards,g.x+.7,g.y,1/30,level);assert(g.seesPlayer);const last={...g.lastSeen};updateGuards(guards,-100,-100,1/30,level);assert.equal(g.mode,'investigate');assert.deepEqual(g.path.at(-1),last);
});
test('decoy inputs consume once, stop at cover and reset with the mission',()=>{
 const s=initialState('false-footsteps');step(s,{...idleInput(),tool:1});assert.equal(s.decoysLeft,1);assert(s.decoy.ttl>0);assert(!blockedBy(s.decoy.x,s.decoy.y,s.blockers));for(let i=0;i<10;i++)step(s,{...idleInput(),tool:1});assert.equal(s.decoysLeft,1);step(s,{...idleInput(),tool:2});assert.equal(s.decoysLeft,0);step(s,{...idleInput(),tool:3});assert.equal(s.decoysLeft,0);assert.equal(initialState('false-footsteps').decoysLeft,2);
 const blocked=initialState('false-footsteps');Object.assign(blocked,{x:4,y:14,facing:3});step(blocked,{...idleInput(),tool:1});assert.equal(blocked.decoysLeft,2,'A throw directly into a wall must not waste the item');
});
