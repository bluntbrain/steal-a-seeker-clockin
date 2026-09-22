import test from 'node:test';
import assert from 'node:assert/strict';
import {defeatPose} from '../src/components/guard-defeat';
test('all defeated bodies and particles fully clear, including restored old deaths',()=>{
 for(const heavy of [false,true])for(const drone of [false,true])for(const reduced of [false,true]){
  assert.equal(defeatPose(0,heavy,drone,reduced).opacity,1);
  for(const t of [1,100]){const p=defeatPose(t,heavy,drone,reduced);assert.equal(p.opacity,0);assert.equal(p.burst,0);assert.equal(p.flash,0);}
 }
});
test('reduced effects fade without flash, recoil, particles or rotation',()=>{
 for(const t of [0,.05,.15,.3]){const p=defeatPose(t,false,false,true);assert.equal(p.recoil,0);assert.equal(p.rotation,0);assert.equal(p.flash,0);assert.equal(p.burst,0);assert.equal(p.scaleY,1);}
});
test('collapse remains bounded and fade never reverses across many render frames',()=>{
 let opacity=1;for(let t=0;t<1.2;t+=1/120){const p=defeatPose(t,true,false,false);assert.ok(p.opacity<=opacity);opacity=p.opacity;for(const n of Object.values(p))assert.ok(Number.isFinite(n));assert.ok(p.recoil<=.16);assert.ok(p.scaleY>0);}
});
