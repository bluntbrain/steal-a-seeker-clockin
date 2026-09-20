import {combatTap,type CombatCommand,COMBAT} from '../game/combat';
import {findPath,walkableSegment} from '../game/navigation';
import {intersectsBox} from '../game/geometry';
import {sightDistance} from '../game/guards';
import type {LevelDefinition,Point} from '../game/level';
import type {GameState} from '../game/simulation';
import {gateSwitchIndex} from './mechanisms';

function valid(p:Point,l:LevelDefinition){'worklet';return p.x>.65&&p.y>.65&&p.x<l.width-.65&&p.y<l.height-.65&&!l.blockers.some(b=>intersectsBox(p.x,p.y,b,.33));}
/** Input assistance only. The chosen floor coordinates are recorded in the
 * existing replay format; no scoring or server simulation rules change. */
export function nearestReachableFloor(from:Point,tap:Point,l:LevelDefinition):Point{
 'worklet';
 if(valid(tap,l)&&findPath(from,tap,l).length)return {...tap};
 const width=Math.round(l.width*2)+1,height=Math.round(l.height*2)+1;
 const visited=Array(width*height).fill(false),queue:number[]=[];
 const sx=Math.round(from.x*2),sy=Math.round(from.y*2);
 for(let y=sy-1;y<=sy+1;y++)for(let x=sx-1;x<=sx+1;x++){
  const p={x:x/2,y:y/2};if(x<0||y<0||x>=width||y>=height||!valid(p,l)||!walkableSegment(from,p,l))continue;
  const n=y*width+x;visited[n]=true;queue.push(n);
 }
 let best={x:from.x,y:from.y},distance=Math.hypot(tap.x-best.x,tap.y-best.y);
 for(let i=0;i<queue.length;i++){
  const n=queue[i]!,x=n%width,y=Math.floor(n/width),p={x:x/2,y:y/2},d=Math.hypot(tap.x-p.x,tap.y-p.y);
  if(d<distance){best=p;distance=d;}
  for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){
   const xx=x+dx!,yy=y+dy!,next=yy*width+xx,q={x:xx/2,y:yy/2};
   if(xx<0||yy<0||xx>=width||yy>=height||visited[next]||!valid(q,l)||!walkableSegment(p,q,l))continue;
   visited[next]=true;queue.push(next);
  }
 }
 // Refine the half-tile result at wall edges, so a tap lands beside cover,
 // rather than in a visibly distant grid cell. Never cross a sealed gate.
 const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 const candidates:Point[]=[{x:clamp(tap.x,.67,l.width-.67),y:clamp(tap.y,.67,l.height-.67)}];
 for(const b of l.blockers){const left=b.x-.34,right=b.x+b.w+.34,top=b.y-.34,bottom=b.y+b.h+.34;
  candidates.push({x:left,y:clamp(tap.y,top,bottom)},{x:right,y:clamp(tap.y,top,bottom)},{x:clamp(tap.x,left,right),y:top},{x:clamp(tap.x,left,right),y:bottom});
 }
 for(const p of candidates){const d=Math.hypot(tap.x-p.x,tap.y-p.y);if(d<distance&&valid(p,l)&&findPath(from,p,l).length){best=p;distance=d;}}
 return {x:Math.round(best.x*10000)/10000,y:Math.round(best.y*10000)/10000};
}
export function assistedCombatTap(s:GameState,x:number,y:number,seq:number):CombatCommand{
 'worklet';const l={...s.definition!,blockers:s.blockers};let raw=combatTap(s,x,y,seq);
 // A locked gate is a clue to its switch, not an invitation to walk into it.
 if(raw.kind!=='attack'&&raw.kind!=='phone'){
  for(let i=0;i<(l.gates?.length??0);i++){const b=l.gates![i]!.box,index=gateSwitchIndex(l,i),p=l.switches?.[index];
   if(p&&s.closedGates[i]&&x>=b.x-.15&&x<=b.x+b.w+.15&&y>=b.y-.7&&y<=b.y+b.h+.15&&valid(p,l)&&findPath(s,p,l).length){raw={seq,kind:'switch',target:index,x:p.x,y:p.y};break;}
  }
  if(raw.kind==='move'||raw.kind==='stop')for(let i=0;i<(l.switches?.length??0);i++){const p=l.switches![i]!;if(Math.abs(x-p.x)<.8&&y>=p.y-1.25&&y<=p.y+.55){raw={seq,kind:'switch',target:i,x:p.x,y:p.y};break;}}
 }

 if(raw.kind==='stop')return raw;
 if(raw.kind==='attack'){
  const g=s.guards[raw.target]!,d=Math.hypot(g.x-s.x,g.y-s.y);
  const visible=d<1e-6||sightDistance(s.x,s.y,(g.x-s.x)/d,(g.y-s.y)/d,d,l)>=d-1e-7;
  if(visible){
   if(d<=COMBAT.range)return raw;
   for(let i=0;i<12;i++){const a=i*Math.PI/6,p={x:g.x+Math.cos(a)*3.3,y:g.y+Math.sin(a)*3.3},r=Math.hypot(g.x-p.x,g.y-p.y);
    if(valid(p,l)&&sightDistance(p.x,p.y,(g.x-p.x)/r,(g.y-p.y)/r,r,l)>=r-1e-7&&findPath(s,p,l).length)return raw;
   }
  }
 }else if(raw.kind!=='move'&&valid(raw,l)&&findPath(s,raw,l).length)return raw;
 const p=nearestReachableFloor(s,raw,l);
 return {seq,kind:'move',target:-1,...p};
}
