import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, idleInput, step, blocked, nearPhone, inExit, type GameState } from '../src/game/simulation';
import { LEVEL, TUNING } from '../src/game/level';
function frames(s:GameState,n:number,input=idleInput()){for(let i=0;i<n;i++)step(s,input);}
test('initial level is playable and routes are walkable',()=>{
 const s=initialState();assert(!blocked(s.x,s.y));assert(!blocked(LEVEL.phone.x,LEVEL.phone.y));
 const visited=new Set<string>(),queue=[[Math.round(s.x*2),Math.round(s.y*2)]];
 while(queue.length){const [x,y]=queue.shift()!;const k=`${x},${y}`;if(visited.has(k)||x!<0||y!<0||x!>24||y!>40||blocked(x!/2,y!/2))continue;visited.add(k);queue.push([x!+1,y!],[x!-1,y!],[x!,y!+1],[x!,y!-1]);}
 assert(visited.has(`${Math.round(LEVEL.phone.x*2)},${Math.round(LEVEL.phone.y*2)}`));assert(visited.has('19,4'));
});
test('normalizes diagonal speed and decelerates within two ticks',()=>{
 const a=initialState(),b=initialState();a.x=b.x=8;a.y=b.y=17.9;frames(a,10,{...idleInput(),x:1});frames(b,10,{...idleInput(),x:1,y:-1});
 assert(Math.hypot(b.vx,b.vy)<=TUNING.walkSpeed+1e-8);frames(a,3);assert.equal(a.vx,0);
});
test('all four walls hold during a long movement and dash cannot tunnel through a crate',()=>{
 for(const [x,y]of [[-1,0],[1,0],[0,-1],[0,1]]){const s=initialState();frames(s,300,{...idleInput(),x:x!,y:y!});assert(!blocked(s.x,s.y));}
 const s=initialState();s.x=6.4;s.y=9.2;s.px=s.x;s.py=s.y;s.carrying=true;frames(s,10,{...idleInput(),x:1,dash:1});assert(s.x<7.1);assert(!blocked(s.x,s.y));assert.equal(s.battery,80);assert.equal(s.dashes,1);
});
test('pickup requires proximity, hold duration and standing; interruption resets progress',()=>{
 const s=initialState();frames(s,20,{...idleInput(),interact:true});assert(!s.carrying);
 s.x=LEVEL.phone.x;s.y=LEVEL.phone.y+.6;assert(nearPhone(s));frames(s,5,{...idleInput(),interact:true});assert(!s.carrying);frames(s,1);assert.equal(s.pickup,0);
 frames(s,12,{...idleInput(),interact:true});assert(s.carrying);assert.equal(s.battery,100);
});
test('dash charges exactly once, respects cooldown and cannot overspend',()=>{
 const s=initialState();s.carrying=true;s.x=9;s.y=17.8;frames(s,1,{...idleInput(),dash:1});assert.equal(s.battery,80);frames(s,1,{...idleInput(),dash:2});assert.equal(s.battery,80);frames(s,65);
 s.battery=10;frames(s,1,{...idleInput(),dash:3});assert.equal(s.battery,10);
});
test('zero battery can extract, holding exit completes once, terminal states freeze',()=>{
 const s=initialState();s.x=9.4;s.y=2;s.carrying=true;s.battery=0;assert(inExit(s));frames(s,29);assert.equal(s.status,'playing');frames(s,1);assert.equal(s.status,'won');assert(s.score>=10000);const before=JSON.stringify(s);frames(s,100,{...idleInput(),x:1,dash:3});assert.equal(JSON.stringify(s),before);
});
test('empty-handed exit does not win; leaving the exit resets hold; timeout is final',()=>{
 const s=initialState();s.x=9.4;s.y=2;frames(s,40);assert.equal(s.extraction,0);s.carrying=true;frames(s,10);s.y=4;frames(s,1);assert.equal(s.extraction,0);
 s.elapsed=119.99;frames(s,1);assert.equal(s.status,'timeout');
});
test('same ordered inputs reproduce the same outcome',()=>{
 const a=initialState(),b=initialState();for(let i=0;i<900;i++){const input={x:Math.sin(i*.03),y:-.7,interact:i%10<3,dash:Math.floor(i/90)};step(a,input);step(b,input);}assert.deepEqual(a,b);
});
