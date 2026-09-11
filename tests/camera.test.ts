import test from 'node:test';
import assert from 'node:assert/strict';
import {screenToWorld,CAMERA_HEADING} from '../src/three/camera';
test('angled camera joystick directions project back to their intended screen axes',()=>{
 for(const [x,y] of [[0,-1],[1,0],[-1,0],[0,1],[.3,-.6]]){
  const world=screenToWorld(x!,y!);const c=Math.cos(CAMERA_HEADING),s=Math.sin(CAMERA_HEADING);
  assert.ok(Math.abs(world.x*c-world.y*s-x!)<1e-10);
  assert.ok(Math.abs(world.x*s+world.y*c-y!)<1e-10);
  assert.ok(Math.abs(Math.hypot(world.x,world.y)-Math.hypot(x!,y!))<1e-10);
 }
});
