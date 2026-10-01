import type {GameState} from './simulation';
import type {Guard} from './guards';
import {sees,sightDistance} from './guards';
import type {GuardBrain} from './encounters';
import {findPath,walkableSegment} from './navigation';
import type {LevelDefinition,Point} from './level';
import {guardPressure,pressureCombat,droneReportTicks} from './guard-pressure';

// Revision 10 and newer. The older encounter engine is intentionally retained for
// published replays. Every decision here depends on ticks, authored data and RNG.
export type HeistMemory={
 role:'patrol'|'pursuer'|'interceptor';charge:number;broadcastUntil:number;cooldownUntil:number;
 arrivalUntil:number;heardGrate:number;armorHit:'none'|'front'|'side'|'rear';
 hunting?:boolean;radioAt?:number;searchCycle?:number;
};
type Shot=(s:GameState,from:Point,angle:number,owner:number,damage:number)=>void;
export const DRONE_REPORT_TICKS=27;
export const ENTRY_WARNING_TICKS=24;
function random(b:GuardBrain){'worklet';b.rng=(Math.imul(b.rng,1664525)+1013904223)>>>0;return b.rng/4294967296;}
function brain(g:Guard,index:number,l:LevelDefinition){
 'worklet';
 if(!g.brain){let seed=2166136261;for(let j=0;j<l.id.length;j++)seed=Math.imul(seed^l.id.charCodeAt(j),16777619)>>>0;
  g.brain={rng:(seed+Math.imul(index+1,2654435761))>>>0,goal:null,plan:false,nextPlan:0,seenFor:0,lastSight:-100,reportAt:0,heardShot:0,pickupSeen:0,searchUntil:0,searchStep:0,lastAnchor:0,alertUntil:0,blockedFor:0,supportUntil:0};
 }
 if(!g.heist)g.heist={role:'patrol',charge:0,broadcastUntil:0,cooldownUntil:0,arrivalUntil:0,heardGrate:0,armorHit:'none'};
 return g.brain;
}
function face(g:Guard,angle:number,dt:number){'worklet';const delta=Math.atan2(Math.sin(angle-g.angle),Math.cos(angle-g.angle));const speed=g.combatRole==='heavy'||g.combatRole==='warden'?Math.PI*1.2:Math.PI*1.8;g.angle+=Math.max(-speed*dt,Math.min(speed*dt,delta));}
function destination(g:Guard,p:Point,mode:Guard['mode']){'worklet';const b=g.brain!;if(!b.goal||Math.hypot(b.goal.x-p.x,b.goal.y-p.y)>.45||g.mode!==mode||!b.plan&&g.pathIndex>=g.path.length&&Math.hypot(p.x-g.x,p.y-g.y)>.25){b.goal={x:p.x,y:p.y};b.plan=true;}g.mode=mode;g.wait=0;}
function investigate(g:Guard,p:Point,tick:number,role:HeistMemory['role']='pursuer'){
 'worklet';g.lastSeen={x:p.x,y:p.y};g.heist!.role=role;destination(g,p,'investigate');g.brain!.searchUntil=0;g.brain!.alertUntil=tick+180;
 if(!g.alerted){g.alerted=true;g.reactionTicks=Math.max(g.reactionTicks,8);}
}

/** First detection uses the cone. An engaged enemy keeps visible contact in
 * every direction, but walls and range still block sight. No hidden tracking. */
function contact(g:Guard,p:Point,l:LevelDefinition){
 'worklet';if(!g.heist?.hunting)return sees(g,p.x,p.y,l);
 const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy);
 return d<=g.range+.8&&(d<1e-6||sightDistance(g.x,g.y,dx/d,dy/d,d,l)>=d-1e-7);
}
// Track while closing on a visible courier, then plant for the final committed
// aim and burst. This does not plan paths or move through an occluding wall.
function closeOnContact(g:Guard,p:Point,l:LevelDefinition,speed:number,dt:number){
 'worklet';if(!walkableSegment(g,p,l))return false;
 const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),travel=Math.min(Math.max(0,d-1.15),speed*dt);
 if(d>1e-6){g.x+=dx/d*travel;g.y+=dy/d*travel;}
 return true;
}
function trackedShot(g:Guard,s:GameState,dt:number,hard:boolean){
 'worklet';
 // A short lead stops guards repeatedly shooting behind a courier running in
 // a straight line. The aim line shows it, and the last six ticks stay locked.
 const lead=hard?Math.min(.18,Math.hypot(s.x-g.x,s.y-g.y)/16):0;
 return Math.atan2(s.y-g.y+(s.y-s.py)/dt*lead,s.x-g.x+(s.x-s.px)/dt*lead);
}
function pursue(g:Guard,p:Point,tick:number){
 'worklet';investigate(g,p,tick);g.heist!.hunting=true;g.brain!.trackingUntil=tick+90;
}
/** A confirmed sighting reaches every living, deployed enemy, including drones.
 * Only actual observers publish updates. Shared positions remain snapshots. */
export function shareHeistSighting(s:GameState,index:number,l:LevelDefinition){
 'worklet';const reporter=s.guards[index]!,b=brain(reporter,index,l);
 if(s.ticks<b.reportAt)return 0;b.reportAt=s.ticks+12;
 const snapshot={x:reporter.lastSeen.x,y:reporter.lastSeen.y,tick:s.ticks};s.combat!.hunt=snapshot;s.spotted=true;
 let count=0;
 for(let i=0;i<s.guards.length;i++){
  const g=s.guards[i]!;if(!g.spawned||!g.active||g.hp<=0)continue;
  brain(g,i,l);pursue(g,snapshot,s.ticks);g.heist!.radioAt=s.ticks;
  if(i!==index)count++;
 }
 return count;
}
function roam(g:Guard,index:number,s:GameState,l:LevelDefinition){
 'worklet';const b=g.brain!,anchors=l.patrols[index]!.roam??l.patrols[index]!.route;let best=-Infinity,pick=0;
 for(let j=0;j<anchors.length;j++){const p=anchors[j]!,crowded=s.guards.some((o,k)=>k!==index&&o.active&&o.hp>0&&Math.hypot((o.brain?.goal?.x??o.x)-p.x,(o.brain?.goal?.y??o.y)-p.y)<1.1);
  const value=random(b)*2-(j===b.lastAnchor?3:0)-(crowded?4:0);if(value>best){best=value;pick=j;}
 }
 b.lastAnchor=pick;g.heist!.role='patrol';destination(g,anchors[pick]!,'patrol');
}
function search(g:Guard,tick:number){
 'worklet';const b=g.brain!;g.mode='search';g.path=[];g.pathIndex=0;b.goal=null;b.plan=false;b.searchStep=0;b.searchUntil=tick+90;g.searchAngle=g.angle;
}
/** Sweep reachable corners around the last report. A hunt never silently
 * expires back to patrol, and no search destination reads the hidden courier. */
function searchCorner(g:Guard,index:number,s:GameState,l:LevelDefinition){
 'worklet';const b=g.brain!,h=g.heist!,cycle=h.searchCycle??0;h.searchCycle=cycle+1;
 const angle=(index*.618+cycle*.381966+random(b)*.12)*Math.PI*2,radius=1.5+cycle%3;
 let point:Point|undefined;
 for(let n=0;n<8;n++){
  const a=angle+n*Math.PI/4,p={x:g.lastSeen.x+Math.cos(a)*radius,y:g.lastSeen.y+Math.sin(a)*radius};
  if(p.x>.7&&p.y>.7&&p.x<l.width-.7&&p.y<l.height-.7&&Math.hypot(p.x-g.x,p.y-g.y)>.7&&walkableSegment(p,p,l)){point=p;break;}
 }
 if(!point){const anchors=l.encounter?.junctions??l.patrols[index]!.route;point=anchors[(index+cycle)%anchors.length];}
 if(point){b.goal={x:point.x,y:point.y};b.plan=true;}
 b.searchUntil=s.ticks+90;g.wait=0;
}

export function updateHeistGuards(s:GameState,dt:number,l:LevelDefinition,shoot:Shot){
 'worklet';let paths=2;const c=s.combat!,start=Math.floor(s.ticks/3)%Math.max(1,s.guards.length),hard=pressureCombat(l),pressure=guardPressure(l);
 for(let k=0;k<s.guards.length;k++){
  const i=(k+start)%s.guards.length,g=s.guards[i]!,spec=l.patrols[i]!,b=brain(g,i,l),h=g.heist!;
  g.px=g.x;g.py=g.y;
  if(g.hp<=0){g.active=false;g.seesPlayer=false;h.charge=0;h.broadcastUntil=0;continue;}
  if(spec.reserveAfter!==undefined&&!g.spawned){
   g.active=false;
   if(s.thefts<(spec.pickupWave??1))continue;
   if(!h.arrivalUntil)h.arrivalUntil=s.ticks+ENTRY_WARNING_TICKS;
   if(s.ticks<h.arrivalUntil||Math.hypot(g.x-s.x,g.y-s.y)<2.2)continue;
   g.spawned=true;g.active=true;const pickup=l.targets?.[Math.max(0,s.thefts-1)]??l.phone;
   investigate(g,pickup,s.ticks);b.pickupSeen=s.thefts;g.reactionTicks=Math.max(g.reactionTicks,12);
  }
  g.active=true;g.clock+=dt;g.flash=Math.max(0,g.flash-dt);g.range=spec.range;
  const report=c.hunt;
  if(report&&(h.radioAt??-1)<report.tick){pursue(g,report,s.ticks);h.radioAt=report.tick;}
  const drone=g.combatRole==='drone',rawSeen=contact(g,s,l),reacquired=rawSeen&&!!h.hunting;
  g.seesPlayer=rawSeen;b.seenFor=rawSeen?Math.min(1,b.seenFor+dt):0;g.exposure=rawSeen?(reacquired?1:Math.min(1,b.seenFor/Math.max(hard?.15:.3,spec.spotSeconds))):Math.max(0,g.exposure-dt*3);
  const confirmed=rawSeen&&g.exposure>=1;
  if(rawSeen){g.lastSeen={x:s.x,y:s.y};b.lastSight=s.ticks;}
  if(confirmed){
   // The observer changes its own movement state immediately. Previously a
   // drone only sent radio, then resumed its old patrol route after cooldown.
   b.lastSight=s.ticks;b.searchUntil=0;g.wait=0;
   if(!h.hunting||s.ticks>=g.nextChase||g.mode!=='investigate'){
    pursue(g,g.lastSeen,s.ticks);g.nextChase=s.ticks+6;
   }
   if(!drone||c.hunt){shareHeistSighting(s,i,l);h.charge=0;}
   else if(s.ticks>=h.cooldownUntil){
    h.charge++;
    if(h.charge>=droneReportTicks(l)){h.charge=0;h.broadcastUntil=s.ticks+21;h.cooldownUntil=s.ticks+120;shareHeistSighting(s,i,l);}
   }
  }else h.charge=0;
  // Noise and pickup reports cannot replace a confirmed pursuit with an older
  // destination. Before detection they still cause ordinary investigation.
  if(b.pickupSeen<s.thefts){b.pickupSeen=s.thefts;const p=l.targets?.[Math.max(0,s.thefts-1)]??l.phone;if(!h.hunting&&!rawSeen&&Math.hypot(g.x-p.x,g.y-p.y)<7)investigate(g,p,s.ticks);}
  const heard=(l.combat?.revision??0)>=15?c.melee?.noiseId??0:c.shots;
  if(heard>b.heardShot){b.heardShot=heard;if(!h.hunting&&!rawSeen&&c.noiseLeft>0&&Math.hypot(c.noise.x-g.x,c.noise.y-g.y)<((l.combat?.revision??0)>=15?c.melee?.noiseRadius??0:hard?5.8:3.6))investigate(g,c.noise,s.ticks);}
  const noise=c.grateNoise;
  if(noise&&noise.id>h.heardGrate){h.heardGrate=noise.id;if(!h.hunting&&!rawSeen&&noise.until>=s.ticks&&Math.hypot(noise.x-g.x,noise.y-g.y)<4.5)investigate(g,noise,s.ticks);}
  if(!rawSeen&&h.hunting&&b.lastSight===s.ticks-1)destination(g,g.lastSeen,'investigate');
  if(g.reactionTicks>0){g.reactionTicks--;continue;}
  // Notice the courier before continuing a patrol turn away from the cone.
  if(rawSeen&&!confirmed){face(g,Math.atan2(s.y-g.y,s.x-g.x),dt);continue;}
  if(confirmed&&((l.combat?.revision??0)<15||g.gunPhase==='ready'))face(g,Math.atan2(s.y-g.y,s.x-g.x),dt);
  const armored=g.combatRole==='heavy'||g.combatRole==='warden';
  const aim=hard?pressure.aim+(armored?6:0):g.combatRole==='warden'?28:g.combatRole==='heavy'?32:l.number<=3?29:24;
  const burst=armored?3:g.combatRole==='sentry'||hard?2:1;
  const recovery=hard?pressure.recover+(armored?7:0):armored?38:27;
  if(!drone){
   if(g.gunPhase==='aim'){
    if(!rawSeen){g.gunPhase='recover';g.gunTicks=12;}
    else{if(g.gunTicks>((l.combat?.revision??0)>=15?12:6)){if(hard)closeOnContact(g,s,l,(spec.pursuitSpeed??pressure.pursuit)*.85,dt);g.shotAngle=trackedShot(g,s,dt,hard);}face(g,g.shotAngle,dt);if(--g.gunTicks<=0){g.gunPhase='fire';g.burstLeft=burst;g.gunTicks=0;}continue;}
   }
   if(g.gunPhase==='fire'&&!rawSeen){g.gunPhase='recover';g.gunTicks=12;g.burstLeft=0;}
   if(g.gunPhase==='fire'){
    if(g.gunTicks--<=0){shoot(s,g,g.shotAngle+(burst>1?(g.burstLeft-(burst+1)/2)*.1:0),i,hard?pressure.damage:l.number<=3?12:18);g.burstLeft--;g.gunTicks=6;if(g.burstLeft<=0){g.gunPhase='recover';g.gunTicks=recovery;}}continue;
   }
   if(g.gunPhase==='recover'){if(--g.gunTicks<=0)g.gunPhase='ready';else if(g.gunTicks>recovery-(hard?3:7))continue;}
   if(confirmed&&g.gunPhase==='ready'){g.gunPhase='aim';g.gunTicks=aim;g.shotAngle=trackedShot(g,s,dt,hard);c.aimEvents++;continue;}
  }
  // During recovery/following, use a clear direct route to the observed
  // courier instead of walking an obsolete waypoint in the opposite direction.
  if(drone&&(l.combat?.revision??0)>=15&&h.charge>0)continue;
  if(confirmed&&walkableSegment(g,g.lastSeen,l)){
   const dx=g.lastSeen.x-g.x,dy=g.lastSeen.y-g.y,d=Math.hypot(dx,dy),travel=Math.min(Math.max(0,d-1.15),(spec.pursuitSpeed??2.25)*dt);
   if(d>1e-6){g.x+=dx/d*travel;g.y+=dy/d*travel;}
   g.path=[];g.pathIndex=0;b.goal={...g.lastSeen};b.plan=false;continue;
  }
  if(g.mode==='search'){
   if(h.hunting){
    if(!b.goal||s.ticks>=b.searchUntil)searchCorner(g,i,s,l);
   }else if(s.ticks>=b.searchUntil){g.alerted=false;h.role='patrol';destination(g,spec.route[0]!,'return');}
   else face(g,g.searchAngle+Math.sin((s.ticks-b.searchUntil)*.045)*1.4,dt);
  }
  if(g.wait>0){g.wait=Math.max(0,g.wait-dt);face(g,g.searchAngle+Math.sin(g.clock*2)*.25,dt);continue;}
  if(!b.goal&&g.mode==='patrol')roam(g,i,s,l);
  if(b.plan&&b.goal&&s.ticks>=b.nextPlan&&paths>0){paths--;g.path=findPath(g,b.goal,l);g.pathIndex=0;b.plan=false;b.nextPlan=s.ticks+12;if(!g.path.length){b.goal=null;g.wait=.3;if(g.mode==='return')g.mode='patrol';if(g.mode==='investigate')search(g,s.ticks);}}
  if(b.plan)continue;
  const p=g.path[g.pathIndex];
  if(p){const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),speed=h.hunting||g.mode==='investigate'?(spec.pursuitSpeed??2.25):spec.speed,travel=Math.min(d,speed*dt);
   if(d>.01&&!confirmed)face(g,Math.atan2(dy,dx),dt);
   const next={x:d?g.x+dx/d*travel:g.x,y:d?g.y+dy/d*travel:g.y};
   if(walkableSegment(g,next,l)){g.x=next.x;g.y=next.y;b.blockedFor=0;if(d<=travel+1e-8)g.pathIndex++;}
   else{b.blockedFor++;if(b.blockedFor>6){b.plan=true;b.nextPlan=s.ticks+3;b.blockedFor=0;}}
  }
  if(g.pathIndex>=g.path.length){
   if(g.mode==='investigate')search(g,s.ticks);
   else if(g.mode==='search'){b.goal=null;g.path=[];g.wait=h.hunting?.2:.4;}
   else if(g.mode==='return'){g.mode='patrol';b.goal=null;g.path=[];g.wait=.3;}
   else if(g.mode==='patrol'){b.goal=null;g.path=[];g.wait=spec.pauseSeconds;g.searchAngle=g.angle;}
  }
 }
}

export function directionalArmor(g:Guard,vx:number,vy:number,damage:number){
 'worklet';const speed=Math.hypot(vx,vy)||1,towardShooter=-(vx*Math.cos(g.angle)+vy*Math.sin(g.angle))/speed;
 const region=towardShooter>=.5?'front':towardShooter<=-.35?'rear':'side';
 return {region,damage:region==='front'?Math.max(1,Math.round(damage*.28)):region==='rear'?Math.min(75,damage*2):damage} as const;
}
