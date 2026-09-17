import test from 'node:test';
import assert from 'node:assert/strict';
import {roundedRoute,quadraticPoint,TAP_RADIUS} from '../src/components/routeGeometry';
import {intersectsBox} from '../src/game/geometry';
import type {Point} from '../src/game/level';

test('display path rounds a right-angle turn with tangent entry and exit',()=>{
 const route=roundedRoute({x:0,y:0},[{x:0,y:4},{x:4,y:4}],0,[]);
 assert.equal(route.segments.length,3);
 const [entry,curve,end]=route.segments;
 assert.equal(curve?.kind,'curve');if(!curve||curve.kind!=='curve')return;
 assert.equal(entry!.to.x,0);assert(entry!.to.y<4);assert.equal(curve.control.x,0);assert.equal(curve.control.y,4);assert.equal(curve.to.y,4);assert(curve.to.x>0);assert.deepEqual(end!.to,{x:4,y:4});
 assert(route.arrow[0]!.x>route.arrow[1]!.x);assert.equal(route.arrow[0]!.y,4);
 assert(TAP_RADIUS<.25);
});
test('route rounding reduces its radius to keep the path outside inside-corner walls',()=>{
 const box={x:.25,y:.25,w:2,h:2,kind:'wall' as const};
 const route=roundedRoute({x:2,y:0},[{x:0,y:0},{x:0,y:2}],0,[box]);let previous=route.start;
 for(const segment of route.segments){if(segment.kind==='curve'){for(let n=0;n<=100;n++){const p=quadraticPoint(previous,segment.control,segment.to,n/100);assert(!intersectsBox(p.x,p.y,box,.12));}}previous=segment.to;}
});
test('consumed and duplicate points do not create invalid coordinates or backwards route segments',()=>{
 const path=[{x:0,y:0},{x:1,y:1},{x:1,y:1},{x:4,y:1}],original=JSON.stringify(path);
 const route=roundedRoute({x:1.1,y:1},path,3,[]);assert.equal(route.segments.length,1);assert.deepEqual(route.segments[0]!.to,{x:4,y:1});assert.equal(JSON.stringify(path),original);
 const empty=roundedRoute({x:4,y:1},path,path.length,[]);assert.deepEqual(empty.segments,[]);assert.deepEqual(empty.arrow,[]);
});
test('destination arrow points along the final segment in every direction',()=>{
 for(const end of [{x:4,y:0},{x:-4,y:0},{x:0,y:4},{x:0,y:-4}]){const arrow=roundedRoute({x:0,y:0},[end],0,[]).arrow;assert.equal(arrow.length,3);const tip=arrow[0]!,base:Point={x:(arrow[1]!.x+arrow[2]!.x)/2,y:(arrow[1]!.y+arrow[2]!.y)/2};assert((tip.x-base.x)*end.x+(tip.y-base.y)*end.y>0);}
});
