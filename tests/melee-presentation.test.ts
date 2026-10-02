import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {COSTUMES} from '../shared/costumes';
import {attackFacing,attackPose,meleeFrame,MELEE_FRAMES} from '../src/components/melee-presentation';

test('attack art meets contact on tick four and completes recovery at tick eleven',()=>{
 assert.equal(attackPose(-1),-1);assert.equal(attackPose(0),0);assert.equal(attackPose(3),0);
 assert.equal(attackPose(4),1);assert.equal(attackPose(6),1);assert.equal(attackPose(7),2);assert.equal(attackPose(10),2);assert.equal(attackPose(11),-1);
 for(const [a,d] of [[Math.PI/2,0],[Math.PI,1],[-Math.PI/2,2],[0,3]]){
  assert.equal(attackFacing(a!),d);assert.equal(meleeFrame(4,a!),12+d!);assert.equal(meleeFrame(11,a!),-1);
 }
});
test('every purchasable and earned appearance has twenty bounded alpha frames under 3MiB decoded',async()=>{
 const packing=JSON.parse(fs.readFileSync('assets/melee-v2/packing.json','utf8'));
 assert.equal(packing.length,COSTUMES.length);
 for(const c of COSTUMES){
  const path=`assets/melee-v2/${c.asset.replace('solana-','')}-atlas.webp`,meta=await sharp(path).metadata();
  assert(meta.hasAlpha,c.id);assert.equal(meta.width,768);assert.equal(meta.height,960);assert(meta.width!*meta.height!*4<3*1024*1024);
  for(const f of MELEE_FRAMES){assert(f.x+f.width<=meta.width!&&f.y+f.height<=meta.height!);const {data}=await sharp(path).extract({left:f.x,top:f.y,width:f.width,height:f.height}).extractChannel('alpha').raw().toBuffer({resolveWithObject:true});assert(data.some(a=>a===0));assert(data.some(a=>a>250),`${c.id}: empty frame`);}
 }
});
