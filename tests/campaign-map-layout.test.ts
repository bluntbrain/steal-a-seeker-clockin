import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignMapLayout} from '../src/components/campaignMapLayout';
import {campaignRoadPoint,campaignSlotFraction,MAP_ASPECT} from '../src/components/campaignRoad';
import {campaignEntries,BUNDLED_LEVELS} from '../src/campaign/levels';

for(const width of [296,366,540])test(`nodes stay on the winding road and targets stay separate at ${width}px`,()=>{
 const entries=campaignEntries(BUNDLED_LEVELS),{scenes}=campaignMapLayout(entries,width);
 assert.deepEqual(scenes.flatMap(s=>s.nodes.map(n=>n.entry.key)),entries.map(e=>e.key).reverse());
 for(let i=0;i<scenes.length;i++){
  const scene=scenes[i]!;
  assert.equal(scene.imageHeight/width,MAP_ASPECT,'preserve source image aspect ratio');
  assert.equal(scene.height,scene.imageHeight);
  assert.equal(scene.offset,i?scenes[i-1]!.offset+scenes[i-1]!.height:0);
  for(const node of scene.nodes){
   const expected=campaignRoadPoint(campaignSlotFraction(9-node.index%10),width);
   assert.deepEqual({x:node.x,y:node.y},expected,'button center is exactly on the rendered road');
   assert(node.x-30>=0&&node.x+30<=width,'target remains inside map');
   assert(node.y-30>=0&&node.y+42<=scene.height,'labels stay inside scene');
  }
  for(let a=0;a<scene.nodes.length;a++)for(let b=a+1;b<scene.nodes.length;b++){
   const p=scene.nodes[a]!,q=scene.nodes[b]!;
   assert(Math.abs(p.x-q.x)>=62||Math.abs(p.y-q.y)>=78,'tap targets and labels do not overlap');
  }
 }
});
test('tile boundaries meet at the same position and tangent',()=>{
 const width=366,top=campaignRoadPoint(0,width),end=campaignRoadPoint(1,width);
 assert.equal(top.x,end.x);assert.equal(end.y,width*MAP_ASPECT);
 const after=campaignRoadPoint(.00001,width),before=campaignRoadPoint(.99999,width);
 assert(after.x>top.x&&end.x>before.x,'road continues in the same direction across seam');
 assert(Math.abs((after.x-top.x)-(end.x-before.x))<1e-6);
});
test('publishing more levels preserves existing node positions and partial-block slots',()=>{
 const all=campaignEntries(BUNDLED_LEVELS),partial=all.slice(0,23),width=366;
 const a=campaignMapLayout(partial,width).scenes,b=campaignMapLayout(all.slice(0,30),width).scenes;
 for(const scene of a)for(const node of scene.nodes){const next=b.flatMap(s=>s.nodes).find(n=>n.entry.key===node.entry.key)!;assert.equal(next.x,node.x);assert.equal(next.y,node.y);}
});
