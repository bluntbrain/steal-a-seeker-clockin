import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPhonePose,dragPhone,pinchPhone,PHONE_DEFAULT_POSE,PHONE_PRESETS} from '../src/components/phoneCamera';
import fs from 'node:fs';

test('native phone supports independent continuous horizontal and vertical rotation',()=>{
 const a=dragPhone(PHONE_DEFAULT_POSE,17,0),b=dragPhone(PHONE_DEFAULT_POSE,0,17);
 assert.notEqual(a.yaw,PHONE_DEFAULT_POSE.yaw);assert.equal(a.pitch,PHONE_DEFAULT_POSE.pitch);
 assert.notEqual(b.pitch,PHONE_DEFAULT_POSE.pitch);assert.equal(b.yaw,PHONE_DEFAULT_POSE.yaw);
 assert.notEqual(dragPhone(PHONE_DEFAULT_POSE,17.2,0).yaw,a.yaw);
});
test('orbit avoids pole singularities and bounds zoom even on extreme input',()=>{
 for(const sign of [-1,1]){const p=dragPhone(PHONE_DEFAULT_POSE,1e6,sign*1e6);assert.ok(Math.abs(p.pitch)<Math.PI/2);}
 assert.equal(pinchPhone(PHONE_DEFAULT_POSE,100,10000).zoom,1.3);
 assert.equal(pinchPhone(PHONE_DEFAULT_POSE,100,1).zoom,0.72);
 assert.equal(pinchPhone(PHONE_DEFAULT_POSE,0,100).zoom,1);
 assert.deepEqual(clampPhonePose({yaw:NaN,pitch:Infinity,zoom:NaN}),{yaw:PHONE_DEFAULT_POSE.yaw,pitch:0,zoom:1});
 for(const pose of Object.values(PHONE_PRESETS))assert.deepEqual(clampPhonePose(pose),pose);
});
test('all mobile models preserve geometry while reducing primitives and bytes',()=>{
 const manifest=JSON.parse(fs.readFileSync('assets/phone-models-mobile/manifest.json','utf8'));
 assert.equal(manifest.length,12);
 for(const {name,before,after} of manifest){
  assert.equal(after.triangles,before.triangles,name);assert.ok(after.primitives<=20,name);
  assert.ok(after.bytes<before.bytes*0.5,name);assert.ok(fs.existsSync(`assets/phone-models-mobile/${name}.glb`));
  for(const edge of ['min','max'])for(let axis=0;axis<3;axis++)assert.ok(Math.abs(after.bounds[edge][axis]-before.bounds[edge][axis])<0.0001,name);
 }
});
