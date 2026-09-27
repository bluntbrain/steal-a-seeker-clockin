import {test} from 'node:test';import assert from 'node:assert/strict';
import {wallStyle,wallHeight,interiorWalls,exposedEdges,depthBandIndex,wallActorClip} from '../src/art/wall-depth';
import {CAMPAIGN_IDS,type Box} from '../src/game/level';import {combatLevel} from '../src/game/combat-levels';
const b=(x:number,y:number,w:number,h:number):Box=>({x,y,w,h,kind:'wall'});
test('shared edges disappear without losing exposed ends at a T junction',()=>{
 const walls=[b(2,2,4,1),b(3,3,2,3)];
 assert.deepEqual(exposedEdges(walls,'bottom'),[{x:2,y:3,width:1},{x:5,y:3,width:1},{x:3,y:6,width:2}]);
 assert.deepEqual(exposedEdges(walls,'top'),[{x:2,y:2,width:4}]);
});
test('occlusion switches at the base, never at the raised top',()=>{assert.equal(depthBandIndex([4,8],3.9),0);assert.equal(depthBandIndex([4,8],4),1);assert.equal(depthBandIndex([4,8],8),2);});
test('presentation filtering preserves every campaign collision box and excludes perimeter',()=>{
 for(const id of CAMPAIGN_IDS){const l=combatLevel(id),before=JSON.stringify(l.blockers);const walls=interiorWalls(l.blockers,l.width,l.height);assert(walls.length>0,id);assert(walls.every(w=>w.x>0&&w.y>0&&w.x+w.w<l.width&&w.y+w.h<l.height));exposedEdges(walls,'bottom');assert.equal(JSON.stringify(l.blockers),before);}
});
test('safe style default and legacy rollback',()=>{assert.equal(wallStyle(), 'subtle');assert.equal(wallStyle('flat'),'flat');assert.equal(wallHeight(wallStyle('0')),0);assert(wallHeight('strong')<.5);});

test('every actor gets a valid clip, including drones and the flat rollback',()=>{
 const clips=['behind both','behind second','in front'];const occlusion={bottoms:[4,8],clips};
 assert.equal(wallActorClip(occlusion,5),'behind second');assert.equal(wallActorClip(occlusion,8),'in front');
 const full=wallActorClip(undefined,5);assert.deepEqual(full,{x:-4,y:-4,width:20,height:28});
 assert.equal(wallActorClip(occlusion,2,true),full);assert.equal(wallActorClip(undefined,10),full);
});
