import {test} from 'node:test';import assert from 'node:assert/strict';
import {wallTopX,wallTopY,wallShadowX,wallShadowY,exposedVerticalEdges,wallStyle,wallHeight,interiorWalls,exposedEdges,depthBandIndex,wallActorClip} from '../src/art/wall-depth';
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


test('room projection keeps joined cap edges aligned and casts shadows inward',()=>{
 const lift=.3;
 assert.equal(wallTopX(6,lift),6);
 assert(wallTopX(2,lift)<2);assert(wallTopX(10,lift)>10);
 assert.equal(wallShadowX(6),0);assert(wallShadowX(2)>0);assert(wallShadowX(10)<0);
 const a=b(2,2,3,1),right=b(5,2,2,1);
 assert.equal(wallTopX(a.x+a.w,lift),wallTopX(right.x,lift));
 assert(Math.abs(wallTopX(0,lift))<.4,'cap overhang stays below two fifths of a tile');
});
test('side faces remove a shared vertical junction, including partial joins',()=>{
 const walls=[b(2,2,1,4),b(3,3,3,2)];
 assert.deepEqual(exposedVerticalEdges(walls,'right'),[{x:3,y:2,height:1},{x:3,y:5,height:1},{x:6,y:3,height:2}]);
 assert.deepEqual(exposedVerticalEdges(walls,'left'),[{x:2,y:2,height:4}]);
});

test('side shadows are mainly horizontal and cap faces turn inward symmetrically',()=>{
 for(const x of [1,2,3,9,10,11])assert(Math.abs(wallShadowX(x))>wallShadowY(x));
 assert.equal(wallShadowX(2),-wallShadowX(10));
 assert.equal(wallTopY(2,8,.3),wallTopY(10,8,.3));
 assert(wallTopY(2,8,.3)>wallTopY(6,8,.3));
 assert.equal(wallTopY(6,8,.3),7.7);
});
