import {intersectsBox} from './geometry';
import {TUNING,type LevelDefinition,type Point} from './level';
// Use the authored collision radius: a larger pathfinding radius rejects guards
// already standing on valid patrol lanes, making decoys appear to do nothing.
const RADIUS=TUNING.radius;
function blocked(x:number,y:number,level:LevelDefinition){'worklet';for(const b of level.blockers)if(intersectsBox(x,y,b,RADIUS))return true;return false;}
export function walkableSegment(a:Point,b:Point,level:LevelDefinition){'worklet';const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.08));for(let i=0;i<=steps;i++)if(blocked(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,level))return false;return true;}
// Bounded half-tile grid, deterministic neighbor order. Used only when an AI
// destination changes, never as a per-frame full-map search.
export function findPath(from:Point,to:Point,level:LevelDefinition):Point[]{
 'worklet';
 if(walkableSegment(from,to,level))return [{...to}];
 const width=Math.round(level.width*2)+1,height=Math.round(level.height*2)+1;
 const anchor=(point:Point)=>{
  const x=Math.round(point.x*2),y=Math.round(point.y*2);let best=-1,distance=Infinity;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,p={x:xx/2,y:yy/2},d=Math.hypot(p.x-point.x,p.y-point.y);if(xx<0||xx>=width||yy<0||yy>=height||d>=distance||!walkableSegment(point,p,level))continue;best=yy*width+xx;distance=d;}return best;
 };
 const start=anchor(from),end=anchor(to);if(start<0||end<0)return [];
 const previous:number[]=Array(width*height).fill(-1),queue=[start];previous[start]=start;
 for(let index=0;index<queue.length&&previous[end]===-1;index++){
  const n=queue[index]!,x=n%width,y=Math.floor(n/width);
  for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const xx=x+dx!,yy=y+dy!,next=yy*width+xx;if(xx<0||xx>=width||yy<0||yy>=height||previous[next]!==-1)continue;
   if(!walkableSegment({x:x/2,y:y/2},{x:xx/2,y:yy/2},level))continue;previous[next]=n;queue.push(next);
  }
 }
 if(previous[end]===-1)return [];
 const raw:Point[]=[{...to}];for(let n=end;;n=previous[n]!){raw.unshift({x:(n%width)/2,y:Math.floor(n/width)/2});if(n===start)break;}
 const result:Point[]=[];let last=from;
 for(let i=0;i<raw.length;){let furthest=i;for(let j=i+1;j<raw.length;j++){if(walkableSegment(last,raw[j]!,level))furthest=j;}result.push(raw[furthest]!);last=raw[furthest]!;i=furthest+1;}
 return result;
}
