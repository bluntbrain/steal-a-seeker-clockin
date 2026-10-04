// combat revision 17: the hunter-style guard engine. patrol loops with long pauses and a look-around, long narrow
// cones with a slow spot time, a suspicion state ("?") that walks to what was seen or heard, local alert spread,
// body discovery, hearing behind the guard, chases that end 2.5 seconds after sight is lost, and boss traits.
// revision 16 stays byte-identical in heist-guards.ts for published replays; this file never changes it.
import type {GameState} from './simulation';
import type {Guard} from './guards';
import {sees} from './guards';
import type {GuardBrain} from './encounters';
import {findPath,walkableSegment} from './navigation';
import type {LevelDefinition,Point} from './level';
import {guardPressure,pressureCombat,droneReportTicks} from './guard-pressure';
import type {HeistMemory} from './heist-guards';

export type HeistMemoryV17=HeistMemory&{suspicious?:boolean;noticeUntil?:number;waitTotal?:number;hear?:number;bodySeen?:number;bodyFor?:number;dir?:number;pos?:number};
type Shot=(s:GameState,from:Point,angle:number,owner:number,damage:number)=>void;
export const ENTRY_WARNING_TICKS=24;
export const RADIO_RADIUS=6;
export const SEARCH_TICKS=150;
export const CHASE_MEMORY_TICKS=75;
export const NOTICE_TICKS=24;
export const HEAR_RADIUS=1.6;
export const HEAR_SECONDS=.6;
export const BODY_RADIUS=4;
export const BODY_SECONDS=.5;
const INVESTIGATE_TICKS=360;
export type BossTrait={hp:number;spot:number;radio:number;pursuit:number;aim:number;burst?:number;recover:number;cone:number;turn:number;rearDamage:number;escortSight?:boolean};
const BASE:BossTrait={hp:150,spot:1,radio:RADIO_RADIUS,pursuit:1,aim:0,recover:0,cone:1,turn:1,rearDamage:75};
export const BOSS_TRAITS:Record<string,BossTrait>={
 toly:{...BASE,spot:.6,radio:8},
 mert:{...BASE,radio:99},
 chase:{...BASE,pursuit:1.4,aim:-8,cone:.85,turn:1.25},
 lily:{...BASE,cone:1.55,turn:.6},
 vibhu:{...BASE,hp:200,rearDamage:50},
 akshay:{...BASE,burst:3,recover:15},
 beeman:{...BASE,escortSight:true},
};
export function bossTrait(l:LevelDefinition,index:number):BossTrait|undefined{'worklet';const id=l.patrols[index]?.boss;return id?BOSS_TRAITS[id]??BASE:undefined;}
function random(b:GuardBrain){'worklet';b.rng=(Math.imul(b.rng,1664525)+1013904223)>>>0;return b.rng/4294967296;}
function brain(g:Guard,index:number,l:LevelDefinition){
 'worklet';
 if(!g.brain){let seed=2166136261;for(let j=0;j<l.id.length;j++)seed=Math.imul(seed^l.id.charCodeAt(j),16777619)>>>0;
  g.brain={rng:(seed+Math.imul(index+1,2654435761))>>>0,goal:null,plan:false,nextPlan:0,seenFor:0,lastSight:-100,reportAt:0,heardShot:0,pickupSeen:0,searchUntil:0,searchStep:0,lastAnchor:0,alertUntil:0,blockedFor:0,supportUntil:0};
 }
 if(!g.heist)g.heist={role:'patrol',charge:0,broadcastUntil:0,cooldownUntil:0,arrivalUntil:0,heardGrate:0,armorHit:'none'};
 return g.brain;
}
const memory=(g:Guard)=>{'worklet';return g.heist as HeistMemoryV17;};
function face(g:Guard,angle:number,dt:number,turn=1){'worklet';const delta=Math.atan2(Math.sin(angle-g.angle),Math.cos(angle-g.angle));const speed=(g.combatRole==='heavy'||g.combatRole==='warden'?Math.PI*1.1:Math.PI*1.6)*turn;g.angle+=Math.max(-speed*dt,Math.min(speed*dt,delta));}
function destination(g:Guard,p:Point,mode:Guard['mode']){'worklet';const b=g.brain!;if(!b.goal||Math.hypot(b.goal.x-p.x,b.goal.y-p.y)>.45||g.mode!==mode||!b.plan&&g.pathIndex>=g.path.length&&Math.hypot(p.x-g.x,p.y-g.y)>.25){b.goal={x:p.x,y:p.y};b.plan=true;}g.mode=mode;g.wait=0;}
/** confirmed contact: the guard is alerted and hunts at pursuit speed */
function investigate(g:Guard,p:Point,tick:number,role:HeistMemory['role']='pursuer'){
 'worklet';g.lastSeen={x:p.x,y:p.y};g.heist!.role=role;destination(g,p,'investigate');g.brain!.searchUntil=0;g.brain!.alertUntil=tick+INVESTIGATE_TICKS;
 if(!g.alerted){g.alerted=true;g.reactionTicks=Math.max(g.reactionTicks,8);}
}
/** suspicion: stop and turn for a moment, then walk to the spot at a brisk patrol pace. the guard stays unaware,
 * so a quiet courier can still take it from behind */
function notice(g:Guard,p:Point,tick:number,pause=NOTICE_TICKS){
 'worklet';const h=memory(g);if(h.hunting)return;
 g.lastSeen={x:p.x,y:p.y};h.role='pursuer';h.suspicious=true;destination(g,p,'investigate');g.brain!.searchUntil=0;g.brain!.alertUntil=tick+INVESTIGATE_TICKS;h.noticeUntil=tick+pause;
}
function contact(g:Guard,p:Point,l:LevelDefinition){'worklet';return sees(g,p.x,p.y,l);}
function closeOnContact(g:Guard,p:Point,l:LevelDefinition,speed:number,dt:number){
 'worklet';if(!walkableSegment(g,p,l))return false;
 const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),travel=Math.min(Math.max(0,d-1.15),speed*dt);
 if(d>1e-6){g.x+=dx/d*travel;g.y+=dy/d*travel;}
 return true;
}
function trackedShot(g:Guard,s:GameState,dt:number,hard:boolean){
 'worklet';const lead=hard?Math.min(.18,Math.hypot(s.x-g.x,s.y-g.y)/16):0;
 return Math.atan2(s.y-g.y+(s.y-s.py)/dt*lead,s.x-g.x+(s.x-s.px)/dt*lead);
}
function pursue(g:Guard,p:Point,tick:number){
 'worklet';const h=memory(g);investigate(g,p,tick);h.hunting=true;h.suspicious=false;h.noticeUntil=0;g.brain!.trackingUntil=tick+30;
}
/** nearby guards hear the shout and grow suspicious of the spot; only the observer hunts. a boss can call farther */
function alertNearby(s:GameState,index:number,point:Point,l:LevelDefinition,radius:number){
 'worklet';const reporter=s.guards[index]!;let count=0;
 for(let i=0;i<s.guards.length;i++){
  const g=s.guards[i]!;if(i===index||!g.spawned||!g.active||g.hp<=0||Math.hypot(g.x-reporter.x,g.y-reporter.y)>radius)continue;
  if(g.seesPlayer)continue;
  brain(g,i,l);const h=memory(g);if(h.hunting)continue;
  notice(g,point,s.ticks);h.radioAt=s.ticks;count++;
 }
 return count;
}
export function shareHeistSighting(s:GameState,index:number,l:LevelDefinition){
 'worklet';const reporter=s.guards[index]!,b=brain(reporter,index,l);
 if(s.ticks<b.reportAt)return 0;b.reportAt=s.ticks+12;
 const snapshot={x:reporter.lastSeen.x,y:reporter.lastSeen.y,tick:s.ticks};s.combat!.hunt=snapshot;s.spotted=true;
 return alertNearby(s,index,snapshot,l,bossTrait(l,index)?.radio??RADIO_RADIUS);
}
function crossesLaser(ax:number,ay:number,bx:number,by:number,r:{x:number;y:number;w:number;h:number},margin:number){
 'worklet';let enter=0,leave=1;
 for(let axis=0;axis<2;axis++){
  const a=axis?ay:ax,d=(axis?by:bx)-a,min=(axis?r.y:r.x)-margin,max=(axis?r.y+r.h:r.x+r.w)+margin;
  if(Math.abs(d)<1e-9){if(a<min||a>max)return false;continue;}
  const t1=(min-a)/d,t2=(max-a)/d;enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));if(enter>leave)return false;
 }
 return true;
}
/** a laser crossing makes nearby guards suspicious of the spot once per entry */
export function updateTripwiresV17(s:GameState,l:LevelDefinition){
 'worklet';const lasers=l.encounter?.lasers;if(!lasers?.length||!s.combat||s.status!=='playing')return;
 const event=s.combat.tripwire??(s.combat.tripwire={id:0,inside:lasers.map(()=>false),until:0,x:0,y:0,laser:-1});
 for(let j=0;j<lasers.length;j++){
  const r=lasers[j]!,touching=crossesLaser(s.px,s.py,s.x,s.y,r,.16);
  if(event.inside[j]){if(!crossesLaser(s.x,s.y,s.x,s.y,r,.28))event.inside[j]=false;continue;}
  if(!touching)continue;
  event.inside[j]=true;event.id++;event.until=s.ticks+45;event.x=s.x;event.y=s.y;event.laser=j;s.spotted=true;
  for(let i=0;i<s.guards.length;i++){
   const g=s.guards[i]!;if(!g.spawned||!g.active||g.hp<=0||Math.hypot(g.x-s.x,g.y-s.y)>5)continue;
   brain(g,i,l);if(!memory(g).hunting&&!g.seesPlayer)notice(g,event,s.ticks);
  }
 }
}
/** authored anchors are an unordered set; chain them nearest-first from the start so the loop reads as a route */
function loopOrder(anchors:readonly Point[]){
 'worklet';const order=[0],used=[true];for(let j=1;j<anchors.length;j++)used.push(false);
 while(order.length<anchors.length){const at=anchors[order[order.length-1]!]!;let best=-1,bestD=Infinity;for(let j=0;j<anchors.length;j++){if(used[j])continue;const d=Math.hypot(anchors[j]!.x-at.x,anchors[j]!.y-at.y);if(d<bestD){bestD=d;best=j;}}used[best]=true;order.push(best);}
 return order;
}
/** ordered waypoint loop, ping-pong at the ends, so a patrol reads as a rhythm the player can learn */
function patrolNext(g:Guard,index:number,l:LevelDefinition){
 'worklet';const h=memory(g),anchors=l.patrols[index]!.roam??l.patrols[index]!.route;
 if(anchors.length<2){h.role='patrol';destination(g,anchors[0]!,'patrol');return;}
 const order=loopOrder(anchors);let dir=h.dir??1,pos=(h.pos??0)+dir;
 if(pos>=order.length||pos<0){dir=-dir;pos=(h.pos??0)+dir;}
 h.dir=dir;h.pos=pos;h.role='patrol';destination(g,anchors[order[pos]!]!,'patrol');
}
/** the loop position of the anchor nearest the guard, used when a search ends away from the route */
function nearestAnchor(g:Guard,index:number,l:LevelDefinition){
 'worklet';const anchors=l.patrols[index]!.roam??l.patrols[index]!.route,order=loopOrder(anchors);let best=0,bestD=Infinity;
 for(let j=0;j<order.length;j++){const a=anchors[order[j]!]!,d=Math.hypot(a.x-g.x,a.y-g.y);if(d<bestD){bestD=d;best=j;}}
 return best;
}
function search(g:Guard,tick:number){
 'worklet';const b=g.brain!;g.mode='search';g.path=[];g.pathIndex=0;b.goal=null;b.plan=false;b.searchStep=0;b.searchUntil=tick+SEARCH_TICKS;g.heist!.searchNext=tick;g.heist!.searchCycle=0;g.searchAngle=g.angle;
}
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
 h.searchNext=s.ticks+45;g.wait=0;
}
/** a guard that keeps a dead colleague in view for half a second goes to look and warns the guards around it */
function noticeBodies(s:GameState,index:number,l:LevelDefinition,dt:number,rawSeen:boolean){
 'worklet';const g=s.guards[index]!,h=memory(g);let watching=false;
 for(let j=0;j<s.guards.length&&j<31;j++){
  if(j===index)continue;const dead=s.guards[j]!;if(dead.hp>0||!dead.spawned||((h.bodySeen??0)>>j)&1)continue;
  if(Math.hypot(dead.x-g.x,dead.y-g.y)>BODY_RADIUS||!sees(g,dead.x,dead.y,l))continue;
  watching=true;h.bodyFor=(h.bodyFor??0)+dt;
  if(h.bodyFor>=BODY_SECONDS){
   h.bodyFor=0;h.bodySeen=(h.bodySeen??0)|(1<<j);s.combat!.bodiesFound=(s.combat!.bodiesFound??0)+1;
   if(!h.hunting&&!rawSeen)notice(g,dead,s.ticks);
   alertNearby(s,index,dead,l,RADIO_RADIUS);
  }
  break;
 }
 if(!watching)h.bodyFor=0;
}

export function updateHeistGuardsV17(s:GameState,dt:number,l:LevelDefinition,shoot:Shot){
 'worklet';let paths=2;const c=s.combat!,start=Math.floor(s.ticks/3)%Math.max(1,s.guards.length),hard=pressureCombat(l),pressure=guardPressure(l);
 const moving=Math.hypot(s.vx,s.vy)>.6;
 for(let k=0;k<s.guards.length;k++){
  const i=(k+start)%s.guards.length,g=s.guards[i]!,spec=l.patrols[i]!,b=brain(g,i,l),h=memory(g),trait=bossTrait(l,i);
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
  g.active=true;g.clock+=dt;g.flash=Math.max(0,g.flash-dt);g.range=spec.range;g.halfAngle=spec.halfAngle*(trait?.cone??1);
  const drone=g.combatRole==='drone';let rawSeen=contact(g,s,l);
  // beeman reads his escort drones' sight as his own
  if(trait?.escortSight&&!rawSeen)for(let j=0;j<s.guards.length;j++){const d=s.guards[j]!;if(j!==i&&d.combatRole==='drone'&&d.active&&d.hp>0&&d.exposure>=1&&d.seesPlayer&&Math.hypot(d.x-g.x,d.y-g.y)<=RADIO_RADIUS){rawSeen=true;break;}}
  const reacquired=rawSeen&&!!h.hunting&&s.ticks-b.lastSight<=30,spot=spec.spotSeconds*(trait?.spot??1);
  g.seesPlayer=rawSeen;b.seenFor=rawSeen?Math.min(1,b.seenFor+dt):0;g.exposure=rawSeen?(reacquired?1:Math.min(1,b.seenFor/spot)):Math.max(0,g.exposure-dt*1.5);
  const confirmed=rawSeen&&g.exposure>=1;
  if(rawSeen){g.lastSeen={x:s.x,y:s.y};b.lastSight=s.ticks;if(g.exposure>=.3&&!h.hunting)h.suspicious=true;}
  if(confirmed){
   b.lastSight=s.ticks;b.searchUntil=0;g.wait=0;
   if(!h.hunting||s.ticks>=g.nextChase||g.mode!=='investigate'){pursue(g,g.lastSeen,s.ticks);g.nextChase=s.ticks+6;}
   if(!drone){shareHeistSighting(s,i,l);h.charge=0;}
   else if(s.ticks>=h.cooldownUntil){
    h.charge++;
    if(h.charge>=droneReportTicks(l)){h.charge=0;h.broadcastUntil=s.ticks+21;h.cooldownUntil=s.ticks+120;shareHeistSighting(s,i,l);}
   }
  }else h.charge=0;
  // a glimpse that never confirmed sends the guard to look where the courier was
  if(!rawSeen&&h.suspicious&&!h.hunting&&g.mode!=='investigate'&&g.mode!=='search')notice(g,g.lastSeen,s.ticks);
  if(b.pickupSeen<s.thefts){b.pickupSeen=s.thefts;const p=l.targets?.[Math.max(0,s.thefts-1)]??l.phone;if(!h.hunting&&!rawSeen&&Math.hypot(g.x-p.x,g.y-p.y)<7)notice(g,p,s.ticks);}
  const heard=c.melee?.noiseId??0;
  if(heard>b.heardShot){b.heardShot=heard;if(!h.hunting&&!rawSeen&&c.noiseLeft>0&&Math.hypot(c.noise.x-g.x,c.noise.y-g.y)<(c.melee?.noiseRadius??0))notice(g,c.noise,s.ticks,12);}
  const noise=c.grateNoise;
  if(noise&&noise.id>h.heardGrate){h.heardGrate=noise.id;if(!h.hunting&&!rawSeen&&noise.until>=s.ticks&&Math.hypot(noise.x-g.x,noise.y-g.y)<4.5)notice(g,noise,s.ticks);}
  // footsteps close behind: standing still is silent, moving for more than half a second turns the guard around
  if(!rawSeen&&!h.hunting&&moving&&Math.hypot(s.x-g.x,s.y-g.y)<HEAR_RADIUS){h.hear=(h.hear??0)+dt;if(h.hear>=HEAR_SECONDS){h.hear=0;notice(g,s,s.ticks,12);}}else h.hear=Math.max(0,(h.hear??0)-dt);
  noticeBodies(s,i,l,dt,rawSeen);
  // a chase lives 2.5 seconds past the last sight, then becomes a search around the last position
  if(!rawSeen&&h.hunting&&b.lastSight===s.ticks-1){destination(g,g.lastSeen,'investigate');b.alertUntil=s.ticks+CHASE_MEMORY_TICKS;}
  if(!rawSeen&&g.mode==='investigate'&&s.ticks>=b.alertUntil)search(g,s.ticks);
  if(g.reactionTicks>0){g.reactionTicks--;continue;}
  if(rawSeen&&!confirmed){face(g,Math.atan2(s.y-g.y,s.x-g.x),dt,trait?.turn);continue;}
  if(confirmed&&g.gunPhase==='ready')face(g,Math.atan2(s.y-g.y,s.x-g.x),dt,trait?.turn);
  const armored=g.combatRole==='heavy'||g.combatRole==='warden';
  const aim=Math.max(6,(hard?pressure.aim+(armored?6:0):g.combatRole==='warden'?28:g.combatRole==='heavy'?32:l.number<=3?29:24)+(trait?.aim??0));
  const burst=trait?.burst??(armored?3:g.combatRole==='sentry'||hard?2:1);
  const recovery=(hard?pressure.recover+(armored?7:0):armored?38:27)+(trait?.recover??0);
  if(!drone){
   if(g.gunPhase==='aim'){
    if(!rawSeen){g.gunPhase='recover';g.gunTicks=12;}
    else{if(g.gunTicks>12){if(hard)closeOnContact(g,s,l,(spec.pursuitSpeed??pressure.pursuit)*.85*(trait?.pursuit??1),dt);g.shotAngle=trackedShot(g,s,dt,hard);}face(g,g.shotAngle,dt,trait?.turn);if(--g.gunTicks<=0){g.gunPhase='fire';g.burstLeft=burst;g.gunTicks=0;}continue;}
   }
   if(g.gunPhase==='fire'&&!rawSeen){g.gunPhase='recover';g.gunTicks=12;g.burstLeft=0;}
   if(g.gunPhase==='fire'){
    if(g.gunTicks--<=0){shoot(s,g,g.shotAngle+(burst>1?(g.burstLeft-(burst+1)/2)*.1:0),i,hard?pressure.damage:l.number<=3?12:18);g.burstLeft--;g.gunTicks=6;if(g.burstLeft<=0){g.gunPhase='recover';g.gunTicks=recovery;}}continue;
   }
   if(g.gunPhase==='recover'){if(--g.gunTicks<=0)g.gunPhase='ready';else if(g.gunTicks>recovery-(hard?3:7))continue;}
   if(confirmed&&g.gunPhase==='ready'){g.gunPhase='aim';g.gunTicks=aim;g.shotAngle=trackedShot(g,s,dt,hard);c.aimEvents++;continue;}
  }
  if(drone&&h.charge>0)continue;
  if(confirmed&&walkableSegment(g,g.lastSeen,l)){
   const dx=g.lastSeen.x-g.x,dy=g.lastSeen.y-g.y,d=Math.hypot(dx,dy),travel=Math.min(Math.max(0,d-1.15),(spec.pursuitSpeed??2.25)*(trait?.pursuit??1)*dt);
   if(d>1e-6){g.x+=dx/d*travel;g.y+=dy/d*travel;}
   g.path=[];g.pathIndex=0;b.goal={...g.lastSeen};b.plan=false;continue;
  }
  // the pause after a noise or glimpse: stop, turn toward it, then go
  if(s.ticks<(h.noticeUntil??0)&&b.goal){face(g,Math.atan2(b.goal.y-g.y,b.goal.x-g.x),dt,trait?.turn);continue;}
  if(g.mode==='search'){
   if(s.ticks>=b.searchUntil){
    h.hunting=false;h.suspicious=false;h.role='patrol';h.charge=0;h.broadcastUntil=0;
    g.alerted=false;g.exposure=0;b.seenFor=0;b.trackingUntil=0;
    g.gunPhase='ready';g.gunTicks=0;g.burstLeft=0;
    const anchors=spec.roam??spec.route;h.pos=nearestAnchor(g,i,l);destination(g,anchors[loopOrder(anchors)[h.pos]!]!,'return');
   }else if(!b.goal||s.ticks>=(h.searchNext??0))searchCorner(g,i,s,l);
  }
  if(g.wait>0){
   g.wait=Math.max(0,g.wait-dt);
   // the patrol look-around sweeps right, then left, then settles forward; a search sways wider
   if(g.mode==='patrol'){const total=h.waitTotal||g.wait||1;face(g,g.searchAngle+Math.sin((1-g.wait/total)*Math.PI*2)*1.05,dt,trait?.turn);}
   else face(g,g.searchAngle+Math.sin(g.clock*2.2)*.6,dt,trait?.turn);
   continue;
  }
  if(!b.goal&&g.mode==='patrol')patrolNext(g,i,l);
  if(b.plan&&b.goal&&s.ticks>=b.nextPlan&&paths>0){paths--;g.path=findPath(g,b.goal,l);g.pathIndex=0;b.plan=false;b.nextPlan=s.ticks+12;if(!g.path.length){b.goal=null;g.wait=.3;h.waitTotal=.3;if(g.mode==='return')g.mode='patrol';if(g.mode==='investigate')search(g,s.ticks);}}
  if(b.plan)continue;
  const p=g.path[g.pathIndex];
  if(p){const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),speed=g.mode==='investigate'?(h.hunting||g.alerted?(spec.pursuitSpeed??2.25)*(trait?.pursuit??1):spec.speed*1.3):spec.speed,travel=Math.min(d,speed*dt);
   if(d>.01&&!confirmed)face(g,Math.atan2(dy,dx),dt,trait?.turn);
   const next={x:d?g.x+dx/d*travel:g.x,y:d?g.y+dy/d*travel:g.y};
   if(walkableSegment(g,next,l)){g.x=next.x;g.y=next.y;b.blockedFor=0;if(d<=travel+1e-8)g.pathIndex++;}
   else{b.blockedFor++;if(b.blockedFor>6){b.plan=true;b.nextPlan=s.ticks+3;b.blockedFor=0;}}
  }
  if(g.pathIndex>=g.path.length){
   if(g.mode==='investigate')search(g,s.ticks);
   else if(g.mode==='search'){b.goal=null;g.path=[];g.wait=h.hunting?.2:.4;h.waitTotal=g.wait;}
   else if(g.mode==='return'){g.mode='patrol';b.goal=null;g.path=[];g.wait=.3;h.waitTotal=.3;}
   else if(g.mode==='patrol'){b.goal=null;g.path=[];g.wait=.8+random(b)*.6;h.waitTotal=g.wait;g.searchAngle=g.angle;}
  }
 }
 if(c.hunt&&!s.guards.some(g=>g.active&&g.hp>0&&g.heist?.hunting))c.hunt=undefined;
}
