import {intersectsBox} from '../game/geometry';
import type {Box,Point} from '../game/level';

export type RouteSegment={kind:'line';to:Point}|{kind:'curve';control:Point;to:Point};
export type RouteShape={start:Point;segments:RouteSegment[];arrow:Point[]};
export const TAP_RADIUS=.22;

export function quadraticPoint(a:Point,b:Point,c:Point,t:number):Point {
 'worklet';
 const u=1-t;return {x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};
}
function clearCurve(a:Point,b:Point,c:Point,blockers:Box[]){
 'worklet';
 // Keep the route stroke clear of walls, including gates that are currently shut.
 for(let n=0;n<=12;n++){const p=quadraticPoint(a,b,c,n/12);for(const box of blockers)if(intersectsBox(p.x,p.y,box,.16))return false;}
 return true;
}

// Display geometry only. The deterministic movement path and ranked replay rules
// are unchanged. Limit rounding to each corner's available wall clearance.
export function roundedRoute(start:Point,path:Point[],index:number,blockers:Box[]):RouteShape {
 'worklet';
 const points:Point[]=[start];
 for(let i=index;i<path.length;i++){const p=path[i]!,last=points[points.length-1]!;if(Math.hypot(p.x-last.x,p.y-last.y)>.015)points.push(p);}
 const segments:RouteSegment[]=[];
 for(let i=1;i<points.length-1;i++){
  const before=points[i-1]!,corner=points[i]!,after=points[i+1]!;
  const incoming=Math.hypot(corner.x-before.x,corner.y-before.y),outgoing=Math.hypot(after.x-corner.x,after.y-corner.y);
  let radius=Math.min(.65,incoming*.4,outgoing*.4),rounded=false;
  for(let attempt=0;attempt<5&&radius>.035;attempt++,radius*=.5){
   const entry={x:corner.x+(before.x-corner.x)*radius/incoming,y:corner.y+(before.y-corner.y)*radius/incoming};
   const exit={x:corner.x+(after.x-corner.x)*radius/outgoing,y:corner.y+(after.y-corner.y)*radius/outgoing};
   if(clearCurve(entry,corner,exit,blockers)){segments.push({kind:'line',to:entry},{kind:'curve',control:corner,to:exit});rounded=true;break;}
  }
  if(!rounded)segments.push({kind:'line',to:corner});
 }
 const arrow:Point[]=[];
 if(points.length>1){
  const end=points[points.length-1]!,before=points[points.length-2]!,distance=Math.hypot(end.x-before.x,end.y-before.y);
  segments.push({kind:'line',to:end});
  if(distance>.8){
   const ux=(end.x-before.x)/distance,uy=(end.y-before.y)/distance;
   const tip={x:end.x-ux*.29,y:end.y-uy*.29},base={x:tip.x-ux*.35,y:tip.y-uy*.35};
   arrow.push(tip,{x:base.x-uy*.2,y:base.y+ux*.2},{x:base.x+uy*.2,y:base.y-ux*.2});
  }
 }
 return {start,segments,arrow};
}
