import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraConfig,frameCourier,followCamera,screenToWorld,worldToScreen,edgeMarker,OVERVIEW} from '../src/camera/geometry';
import {CAMPAIGN_IDS} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {initialState} from '../src/game/simulation';
import {assistedCombatTap} from '../src/controls/tapDestination';
const close=(a:number,b:number)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('camera flag restores the original map and invalid zoom cannot break layout',()=>{
 assert.deepEqual(cameraConfig(),{enabled:true,zoom:1.3});
 assert.equal(cameraConfig('0').enabled,false);assert.equal(cameraConfig('false').enabled,false);
 for(const value of ['NaN','Infinity','-4','0',''])assert.equal(cameraConfig('1',value).zoom,1.3);
 assert.equal(cameraConfig('1','4').zoom,1.6);
 assert.deepEqual(frameCourier(9,18,1),OVERVIEW);
});
test('camera clamps at every map edge and keeps the courier inside the viewport',()=>{
 for(const z of [1,1.3,1.6])for(let x=.7;x<11.5;x+=.7)for(let y=.7;y<19.5;y+=.7){
  const c=frameCourier(x,y,z),p=worldToScreen(x,y,360,c);
  assert(c.x>=0&&c.y>=0&&c.x+12/z<=12+1e-9&&c.y+20/z<=20+1e-9);
  assert(p.x>=0&&p.x<=360&&p.y>=0&&p.y<=600);
 }
});
test('follow is frame-rate independent, never overshoots and instantly restores overview',()=>{
 const from=frameCourier(1,1,1.3),to=frameCourier(11,19,1.3);
 let a=from,b=from;for(let i=0;i<60;i++)a=followCamera(a,to,1/60);for(let i=0;i<120;i++)b=followCamera(b,to,1/120);
 close(a.x,b.x);close(a.y,b.y);assert(a.x<=to.x&&a.y<=to.y);
 assert.deepEqual(followCamera(a,OVERVIEW,1/60),OVERVIEW);
});
test('inverse projection preserves attack, phone, gate and floor taps on all twelve maps',()=>{
 for(const id of CAMPAIGN_IDS){const l=combatLevel(id),s=initialState(id,l);
  for(const z of [1,1.3,1.6])for(const size of [240,360,480]){
   const c=frameCourier(s.x,s.y,z),targets=[l.phone,...s.guards,...(l.switches??[]),{x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2},{x:6,y:10}];
   for(const target of targets){const p=worldToScreen(target.x,target.y,size,c),q=screenToWorld(p.x,p.y,size,c);
    close(target.x,q.x);close(target.y,q.y);
    const round=(n:number)=>Math.round(n*100)/100;
    assert.deepEqual(assistedCombatTap(s,round(q.x),round(q.y),1),assistedCombatTap(s,round(target.x),round(target.y),1));
   }
  }
 }
});
test('native overlay center-origin transform matches the Skia top-left transform',()=>{
 const size=360,h=600,c=frameCourier(8,15,1.3),p={x:8,y:14};
 const q=worldToScreen(p.x,p.y,size,c);
 close(q.x,(p.x*size/12-size/2)*c.zoom+size/2+(c.zoom-1)*size/2-c.x*size/12*c.zoom);
 close(q.y,(p.y*size/12-h/2)*c.zoom+h/2+(c.zoom-1)*h/2-c.y*size/12*c.zoom);
});
test('edge markers only appear outside the cropped map and stay inside the screen',()=>{
 const c=frameCourier(6,10,1.3);
 assert.equal(edgeMarker(6,10,360,c),null);assert.equal(edgeMarker(0,0,360,OVERVIEW),null);
 for(const p of [{x:0,y:0},{x:12,y:20},{x:0,y:10},{x:12,y:10}]){
  const m=edgeMarker(p.x,p.y,360,c)!;assert(m);assert(m.x>=15&&m.x<=345&&m.y>=15&&m.y<=585);
 }
});

test('full-height phone viewports keep map edges, tap projection and markers aligned',()=>{
 for(const [width,height] of ([[358,710],[388,794],[430,850],[768,900]] as const)){
  for(const target of [{x:.7,y:.7},{x:11.3,y:19.3},{x:6,y:10}]){
   const c=frameCourier(target.x,target.y,1.3,height*12/width),p=worldToScreen(target.x,target.y,width,c),q=screenToWorld(p.x,p.y,width,c);
   assert(c.x>=0&&c.y>=0);assert(c.x+12/c.zoom<=12+1e-9);assert(c.y+height*12/width/c.zoom<=20+1e-9);
   assert(p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height);close(q.x,target.x);close(q.y,target.y);
   const marker=edgeMarker(12-target.x,20-target.y,width,c,height);if(marker){assert(marker.x>=15&&marker.x<=width-15);assert(marker.y>=15&&marker.y<=height-15);}
  }
 }
});
