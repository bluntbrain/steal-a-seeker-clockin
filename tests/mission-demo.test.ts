import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_COVER,DEMO_DURATION,DEMO_STEPS,demoFrame} from '../src/onboarding/mission-demo';

test('demo shows floor movement, stationary shooting, then pickup before extraction',()=>{
 assert.equal(demoFrame(0).step,0);
 assert.ok(demoFrame(1).walking);
 assert.equal(demoFrame(4).step,1);
 assert.deepEqual([demoFrame(4).x,demoFrame(4).y],[132,132]);
 for(let t=3.6;t<7;t+=.02){const f=demoFrame(t);assert.equal(f.walking,false);assert.equal(f.x,132);assert.equal(f.y,132);}
 for(let t=0;t<9.2;t+=.02){const f=demoFrame(t);assert.equal(f.carried,false);assert.equal(f.extracted,false);assert.equal(f.phoneVisible,true);}
 assert.equal(demoFrame(9.2).carried,true);
 assert.equal(demoFrame(9.2).phoneVisible,false);
 assert.equal(demoFrame(11.7).extracted,true);
 assert.equal(demoFrame(11.7).carried,false);
});
test('demo feet stay on walkable floor and shot line stays clear of cover',()=>{
 for(let t=0;t<=DEMO_DURATION;t+=.01){
  const f=demoFrame(t);
  assert.ok(f.x>=12&&f.x<=308&&f.y>=12&&f.y<=288);
  for(const r of DEMO_COVER){
   const dx=f.x-Math.max(r.x,Math.min(r.x+r.width,f.x)),dy=f.y-Math.max(r.y,Math.min(r.y+r.height,f.y));
   assert.ok(Math.hypot(dx,dy)>=12,`courier crossed cover at ${t}`);
  }
  if(f.bullet>=0){assert.equal(f.walking,false);assert.equal(f.dead,false);assert.equal(f.step,1);}
 }
 for(let x=149;x<=252;x++)for(const r of DEMO_COVER)assert.ok(!(x>=r.x&&x<=r.x+r.width&&132>=r.y&&132<=r.y+r.height));
});
test('each hit reduces enemy health; reduced-motion stills show their matching step',()=>{
 assert.equal(demoFrame(4.6).hp,1);
 assert.equal(demoFrame(4.8).hp,2/3);
 assert.equal(demoFrame(5.2).hp,1/3);
 assert.equal(demoFrame(5.7).hp,0);
 for(const [index,step] of DEMO_STEPS.entries()){
  assert.equal(demoFrame(step.start).step,index);
  assert.equal(demoFrame(step.still).step,index);
 }
 assert.equal(demoFrame(DEMO_STEPS[2].still).carried,true);
});
