import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignMapLayout} from '../src/components/campaignMapLayout';
import {campaignEntries,BUNDLED_LEVELS} from '../src/campaign/levels';

for(const width of [296,366,540])test(`natural-size campaign scenes remain continuous at ${width}px`,()=>{
 const entries=campaignEntries(BUNDLED_LEVELS),{scenes}=campaignMapLayout(entries,width);
 assert.deepEqual(scenes.flatMap(s=>s.nodes.map(n=>n.entry.key)),entries.map(e=>e.key).reverse());
 for(let i=0;i<scenes.length;i++){
  const scene=scenes[i]!;
  assert.equal(scene.imageHeight/width,3,'preserve source image aspect ratio');
  assert.equal(scene.offset,i?scenes[i-1]!.offset+scenes[i-1]!.height:0);
  assert.equal(scene.previousZone,i?scenes[i-1]!.zone:null);
  assert.equal(scene.imageHeight-scene.fade,scene.height===scene.imageHeight?scene.height-scene.fade:scene.height);
  assert(scene.fade>=66,'crossfade must span a visible distance');
  for(let j=0;j<scene.nodes.length;j++){
   const node=scene.nodes[j]!;
   assert(node.x-30>=0&&node.x+30<=width,'target remains inside map');
   assert(node.y-30>=0&&node.y+42<=scene.height,'labels stay inside scene');
   if(j)assert(node.y-scene.nodes[j-1]!.y>=72,'adjacent targets do not overlap');
  }
 }
});
