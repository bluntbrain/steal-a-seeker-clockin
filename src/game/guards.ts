import {findPath,walkableSegment} from './navigation';
import { LEVEL, getLevel, GUARD_TUNING, type MissionId, type LevelDefinition, type Point } from './level';

export type Guard = {x:number;y:number;px:number;py:number;angle:number;target:number;wait:number;exposure:number;seesPlayer:boolean;range:number;halfAngle:number;spotSeconds:number;clock:number;kind:'patrol'|'scanner'|'warden';mode:'patrol'|'investigate'|'search'|'return';path:Point[];pathIndex:number;searchLeft:number;searchAngle:number;lastSeen:Point;};
export function makeGuards(mission:MissionId):Guard[]{
 'worklet';
 return getLevel(mission).patrols.map(({route,range,halfAngle,spotSeconds,kind,sweep})=>({x:route[0]!.x,y:route[0]!.y,px:route[0]!.x,py:route[0]!.y,angle:sweep?sweep.angle:Math.atan2(route[1]!.y-route[0]!.y,route[1]!.x-route[0]!.x),target:1,wait:0,exposure:0,seesPlayer:false,range,halfAngle,spotSeconds,clock:0,kind:kind??'patrol',mode:'patrol',path:[],pathIndex:0,searchLeft:0,searchAngle:0,lastSeen:{...route[0]!}}));
}
// Slab intersection returns the nearest wall/crate along a ray. Shared by detection
// and cone rendering, so the highlighted floor agrees with what a guard can see.
export function sightDistance(x:number,y:number,dx:number,dy:number,limit:number,level:LevelDefinition=LEVEL){
 'worklet';
 let nearest=limit;
 for(let i=0;i<level.blockers.length;i++){
  const b=level.blockers[i]!;
  let enter=0,leave=nearest;
  if(Math.abs(dx)<1e-9){if(x<b.x||x>b.x+b.w)continue;}
  else{const a=(b.x-x)/dx,c=(b.x+b.w-x)/dx;enter=Math.max(enter,Math.min(a,c));leave=Math.min(leave,Math.max(a,c));}
  if(Math.abs(dy)<1e-9){if(y<b.y||y>b.y+b.h)continue;}
  else{const a=(b.y-y)/dy,c=(b.y+b.h-y)/dy;enter=Math.max(enter,Math.min(a,c));leave=Math.min(leave,Math.max(a,c));}
  if(enter<=leave&&leave>=0)nearest=Math.max(0,enter);
 }
 return nearest;
}
export function sees(guard:Guard,x:number,y:number,level:LevelDefinition=LEVEL){
 'worklet';
 const dx=x-guard.x,dy=y-guard.y,d=Math.hypot(dx,dy);
 if(d>guard.range)return false;
 if(d<1e-6)return true;
 // Contact also detects the player behind a guard, but never through cover.
 if(d>.5&&(dx*Math.cos(guard.angle)+dy*Math.sin(guard.angle))/d<Math.cos(guard.halfAngle))return false;
 return sightDistance(guard.x,guard.y,dx/d,dy/d,d,level)>=d-1e-7;
}
function destination(g:Guard,point:Point,level:LevelDefinition,mode:'investigate'|'return'){
 'worklet';const path=findPath(g,point,level);if(!path.length)return false;g.path=path;g.pathIndex=0;g.mode=mode;g.wait=0;return true;
}
export function updateGuards(guards:Guard[],x:number,y:number,dt:number,level:LevelDefinition=getLevel('night-shift'),noise?:Point){
 'worklet';
 for(let i=0;i<guards.length;i++){
  const g=guards[i]!,spec=level.patrols[i]!,route=spec.route;g.px=g.x;g.py=g.y;g.clock+=dt;
  if(spec.investigates&&noise&&!g.seesPlayer&&Math.hypot(noise.x-g.x,noise.y-g.y)<=(spec.hearing??6))destination(g,noise,level,'investigate');
  if(spec.kind==='scanner'&&spec.sweep){g.angle=spec.sweep.angle+Math.sin(g.clock/spec.sweep.period*Math.PI*2)*spec.sweep.amplitude;}
  else if(g.exposure===0){
   if(g.mode==='search'){
    g.searchLeft-=dt;g.angle=g.searchAngle+Math.sin(g.clock*3)*.8;
    if(g.searchLeft<=0&&!destination(g,route[g.target]!,level,'return'))g.searchLeft=1;
   }else if(g.mode==='investigate'||g.mode==='return'){
    const p=g.path[g.pathIndex];
    if(p){const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),travel=Math.min(d,spec.speed*dt),next={x:d?g.x+dx/d*travel:g.x,y:d?g.y+dy/d*travel:g.y};
     if(walkableSegment(g,next,level)){if(d>.001)g.angle=Math.atan2(dy,dx);g.x=next.x;g.y=next.y;if(d<=travel+1e-8)g.pathIndex++;}
     else{g.mode='search';g.searchLeft=1;g.searchAngle=g.angle;}
    }
    if(g.pathIndex>=g.path.length){if(g.mode==='return'){g.mode='patrol';g.target=(g.target+1)%route.length;g.wait=spec.pauseSeconds;}else{g.mode='search';g.searchLeft=2.5;g.searchAngle=g.angle;}}
   }else if(g.wait>0)g.wait=Math.max(0,g.wait-dt);
   else{
    const p=route[g.target]!,dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),travel=spec.speed*dt;
    if(d<=travel){g.x=p.x;g.y=p.y;g.target=(g.target+1)%route.length;g.wait=spec.pauseSeconds;}
    else{g.angle=Math.atan2(dy,dx);g.x+=dx/d*travel;g.y+=dy/d*travel;}
   }
  }
  const visible=sees(g,x,y,level);
  if(spec.investigates){if(visible)g.lastSeen={x,y};else if(g.seesPlayer)destination(g,g.lastSeen,level,'investigate');}
  g.seesPlayer=visible;g.exposure=visible?Math.min(1,g.exposure+dt/g.spotSeconds):Math.max(0,g.exposure-dt/GUARD_TUNING.forgetSeconds);
 }
}
