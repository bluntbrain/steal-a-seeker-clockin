import test from 'node:test';
import assert from 'node:assert/strict';
import {getLevel} from '../src/game/level';
import {initialState,idleInput,step,targetPhone,nearSwitch} from '../src/game/simulation';
const frames=(s:ReturnType<typeof initialState>,n:number,interact=false)=>{for(let i=0;i<n;i++)step(s,{...idleInput(),interact});};
test('power pad toggles door/scanner circuit once per press, and works while carrying',()=>{
 const s=initialState('power-trade'),pad=getLevel(s.mission).switches![0]!;assert.deepEqual(s.closedGates,[false,true]);assert(!s.guards[0]!.active);frames(s,20,true);assert.equal(s.power,0);
 Object.assign(s,{x:pad.x,y:pad.y,px:pad.x,py:pad.y,carrying:true});assert.equal(nearSwitch(s),0);frames(s,1,true);assert.equal(s.power,1);assert.deepEqual(s.closedGates,[true,false]);assert(s.guards[0]!.active);frames(s,90,true);assert.equal(s.power,1);assert.equal(s.activations,1);
 frames(s,1);frames(s,1,true);assert.equal(s.power,0);assert.deepEqual(s.closedGates,[false,true]);assert(!s.guards[0]!.active);
});
test('relay expires, holds for a body in the doorway, and can be reopened from either side',()=>{
 const s=initialState('silent-circuit'),level=getLevel(s.mission);Object.assign(s,{x:3.6,y:14});frames(s,1,true);assert(!s.closedGates[0]);assert(s.relayTimers[0]!>8);
 s.x=3.6;s.y=12.3;frames(s,280);assert(!s.closedGates[0],'Door must not close on an occupant');s.y=10.1;frames(s,1);assert(s.closedGates[0]);frames(s,1,true);assert(!s.closedGates[0]);assert.equal(s.activations,2);assert.equal(level.switches![1]!.channel,0);
});
test('two targets need two deliveries and keep separate batteries; final charge controls reward score',()=>{
 const s=initialState('two-targets'),level=getLevel(s.mission);Object.assign(s,{x:level.phone.x,y:level.phone.y});frames(s,13,true);assert(s.carrying);s.battery=20;Object.assign(s,{x:level.exit.x+1,y:level.exit.y+.8});frames(s,32);assert.equal(s.delivered,1);assert.equal(s.status,'playing');assert(!s.carrying);assert.equal(s.score,0);assert.deepEqual(s.deliveryBatteries,[20]);assert.deepEqual(targetPhone(s),level.targets![1]);
 Object.assign(s,{x:targetPhone(s).x,y:targetPhone(s).y});frames(s,13,true);assert(s.carrying);assert.equal(s.battery,100);s.battery=60;Object.assign(s,{x:level.exit.x+1,y:level.exit.y+.8});frames(s,32);assert.equal(s.status,'won');assert.equal(s.delivered,2);assert.deepEqual(s.deliveryBatteries,[20,60]);assert.equal(s.battery,60);
 const reset=initialState(s.mission);assert.equal(reset.delivered,0);assert.equal(reset.power,0);assert.deepEqual(reset.deliveryBatteries,[]);
});
