import { LEVEL, getLevel, GUARD_TUNING, type MissionId, type LevelDefinition } from './level';

export type Guard = {x:number;y:number;px:number;py:number;angle:number;target:number;wait:number;exposure:number;seesPlayer:boolean;range:number;halfAngle:number;spotSeconds:number;clock:number;kind:'patrol'|'scanner';};
export function makeGuards(mission:MissionId):Guard[]{
 'worklet';
 return getLevel(mission).patrols.map(({route,range,halfAngle,spotSeconds,kind,sweep})=>({x:route[0]!.x,y:route[0]!.y,px:route[0]!.x,py:route[0]!.y,angle:sweep?sweep.angle:Math.atan2(route[1]!.y-route[0]!.y,route[1]!.x-route[0]!.x),target:1,wait:0,exposure:0,seesPlayer:false,range,halfAngle,spotSeconds,clock:0,kind:kind??'patrol'}));
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
export function updateGuards(guards:Guard[],x:number,y:number,dt:number,level:LevelDefinition=getLevel('night-shift')){
 'worklet';
 for(let i=0;i<guards.length;i++){
  const g=guards[i]!,spec=level.patrols[i]!,route=spec.route;g.px=g.x;g.py=g.y;g.clock+=dt;
  // Suspicion holds the patrol in place. Breaking sight lets it resume its route.
  if(spec.kind==='scanner'&&spec.sweep){g.angle=spec.sweep.angle+Math.sin(g.clock/spec.sweep.period*Math.PI*2)*spec.sweep.amplitude;}
  else if(g.exposure===0){
   if(g.wait>0)g.wait=Math.max(0,g.wait-dt);
   else{
    const p=route[g.target]!,dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),travel=spec.speed*dt;
    if(d<=travel){g.x=p.x;g.y=p.y;g.target=(g.target+1)%route.length;g.wait=spec.pauseSeconds;}
    else{g.angle=Math.atan2(dy,dx);g.x+=dx/d*travel;g.y+=dy/d*travel;}
   }
  }
  g.seesPlayer=sees(g,x,y,level);
  g.exposure=g.seesPlayer?Math.min(1,g.exposure+dt/g.spotSeconds):Math.max(0,g.exposure-dt/GUARD_TUNING.forgetSeconds);
 }
}
