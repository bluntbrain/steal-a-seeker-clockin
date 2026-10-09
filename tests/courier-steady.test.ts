import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,type GameState} from '../src/game/simulation';
import {combatLevel} from '../src/game/combat-levels';
import {meleeState} from '../src/game/melee';
import {courierSteadyFrame,STEADY_BANK_SIZE} from '../src/components/courier-steady';
import frames from '../assets/courier-topdown-v5/frames.json';
import sharp from 'sharp';

test('walk is slow, continuous, periodic, and stops when blocked or finished',()=>{
 const s={...initialState('practice'),x:2,px:1.9};
 assert.deepEqual([0,.05,.8,1.55,1.6].map(t=>courierSteadyFrame(s,t)),[1,2,17,32,1]);
 for(const t of [0,.47,1.49,10]){
  assert.equal(courierSteadyFrame({...s,px:2},t),0);
  assert.equal(courierSteadyFrame({...s,status:'won'},t),0);
  assert.equal(courierSteadyFrame({...s,carrying:true},t),courierSteadyFrame(s,t)+STEADY_BANK_SIZE);
 }
});
test('phone pickup retains gait phase; idle and every attack have a carrying counterpart',()=>{
 const s=initialState('practice',combatLevel('practice'));assert(s.combat);
 const melee={...meleeState(s),started:10,angle:0,target:0};
 assert.equal(courierSteadyFrame({...s,carrying:true},2),36);
 for(const [age,pose] of [[0,33],[4,34],[7,35],[11,0]]){
  const attacking:GameState={...s,ticks:10+age!,combat:{...s.combat,melee}};
  assert.equal(courierSteadyFrame(attacking,9),pose);
  assert.equal(courierSteadyFrame({...attacking,carrying:true},9),pose!+36);
 }
});
test('atlas hood pixels stay identical across gait, attack, and carrying frames',async()=>{
 const atlas='assets/courier-topdown-v5/default.webp';
 assert.equal(frames.length,72);
 const hood=await Promise.all(frames.map(f=>sharp(atlas).extract({left:f.x+114,top:f.y+114,width:28,height:28}).raw().toBuffer()));
 for(let i=1;i<hood.length;i++)assert(hood[0]!.equals(hood[i]!),`Head changed in ${frames[i]!.name}`);
 const arm=await Promise.all([frames[1]!,frames[9]!].map(f=>sharp(atlas).extract({left:f.x+125,top:f.y+66,width:68,height:40}).raw().toBuffer()));
 assert(!arm[0]!.equals(arm[1]!), 'Arms must visibly move while head stays fixed');
});
