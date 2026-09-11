import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, idleInput, step, blocked } from '../src/game/simulation';
import { makeGuards, sees, sightDistance, updateGuards } from '../src/game/guards';
import { GUARD_TUNING } from '../src/game/level';

test('practice is unguarded; night shift starts with two independent patrols',()=>{
 assert.equal(initialState().guards.length,0);
 const a=initialState('night-shift'),b=initialState('night-shift');
 assert.equal(a.guards.length,2);a.guards[0]!.exposure=.5;assert.equal(b.guards[0]!.exposure,0);
});
test('vision respects cone, range and cover in either direction',()=>{
 const g=makeGuards('night-shift')[0]!;g.x=6.6;g.y=9.2;g.angle=0;
 assert(!sees(g,10,9.2),'crate must conceal courier');
 assert(sees(g,6.9,9.2));assert(!sees(g,6.6,11));assert(!sees(g,11,9.2));
 assert(Math.abs(sightDistance(6.6,9.2,1,0,10)-.5)<1e-6);
 assert(Math.abs(sightDistance(10,9.2,-1,0,10)-.3)<1e-6);
 assert.equal(sightDistance(6.6,9.2,0,-1,2),2);
});
test('suspicion fills over time and breaking sight clears it',()=>{
 const gs=makeGuards('night-shift'),g=gs[0]!;g.wait=10;
 for(let i=0;i<12;i++)updateGuards(gs,g.x+1,g.y,1/30);
 assert(Math.abs(g.exposure-.5)<1e-6);assert(g.seesPlayer);
 for(let i=0;i<17;i++)updateGuards(gs,2,17,1/30);
 assert.equal(g.exposure,0);assert.equal(g.seesPlayer,false);
});
test('sustained sight catches courier; caught state freezes and retry clears it',()=>{
 const s=initialState('night-shift');s.x=5;s.y=10.5;s.guards[0]!.wait=10;
 for(let i=0;i<23;i++)step(s,idleInput());assert.equal(s.status,'playing');
 step(s,idleInput());assert.equal(s.status,'caught');assert.equal(s.caughtBy,0);
 const before=JSON.stringify(s);step(s,{x:1,y:0,interact:true,dash:1});assert.equal(JSON.stringify(s),before);
 const reset=initialState(s.mission);assert.equal(reset.alert,0);assert.equal(reset.status,'playing');assert.equal(reset.guards[0]!.exposure,0);
});
test('guard capture takes priority over simultaneous extraction',()=>{
 const s=initialState('night-shift');s.x=9.4;s.y=2;s.carrying=true;s.extraction=.99;
 Object.assign(s.guards[0]!,{x:8.4,y:2,angle:0,exposure:.99});
 step(s,idleInput());assert.equal(s.status,'caught');assert.equal(s.score,0);
});
test('patrol routes remain outside every blocker over repeated loops',()=>{
 const gs=makeGuards('night-shift');
 for(let i=0;i<3600;i++){
  updateGuards(gs,2.2,17.6,1/30);
  for(const g of gs){assert(!blocked(g.x,g.y),`patrol inside blocker at ${g.x},${g.y}`);assert.equal(g.exposure,0);}
 }
});
test('night shift replays deterministically from the same inputs',()=>{
 const a=initialState('night-shift'),b=initialState('night-shift');
 for(let i=0;i<1800;i++){const input={x:Math.sin(i*.017),y:-.4,interact:i%60>30,dash:Math.floor(i/90)};step(a,input);step(b,input);}
 assert.deepEqual(a,b);
});
test('night shift can be completed from spawn with movement inputs and timed cover',()=>{
 const s=initialState('night-shift');
 for(let i=0;i<159;i++)step(s,idleInput());
 function go(x:number,y:number){
  for(let i=0;i<600;i++){const dx=x-s.x,dy=y-s.y,d=Math.hypot(dx,dy);if(d<.09||s.status!=='playing')break;step(s,{x:dx/d,y:dy/d,interact:false,dash:0});}
  for(let i=0;i<4;i++)step(s,idleInput());
  assert.equal(s.status,'playing');assert(Math.hypot(x-s.x,y-s.y)<.2);
 }
 for(const [x,y] of [[3.7,17.6],[3.7,10.65],[6.6,10.65],[6.6,7],[8.9,7],[8.9,6.45]])go(x!,y!);
 for(let i=0;i<15;i++)step(s,{...idleInput(),interact:true});assert(s.carrying);
 go(9.4,3.4);go(9.4,2.1);for(let i=0;i<32;i++)step(s,idleInput());assert.equal(s.status,'won');
});
