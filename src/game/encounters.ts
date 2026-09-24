import type {GameState} from './simulation';
import type {Guard} from './guards';
import {sees,sightDistance} from './guards';
import type {LevelDefinition,Point} from './level';
import {findPath,walkableSegment} from './navigation';

export type GuardBrain={trackingUntil?:number;rng:number;goal:Point|null;plan:boolean;nextPlan:number;seenFor:number;lastSight:number;reportAt:number;heardShot:number;pickupSeen:number;searchUntil:number;searchStep:number;lastAnchor:number;alertUntil:number;blockedFor:number;supportUntil:number;};
type Shot=(s:GameState,from:Point,angle:number,owner:number,damage:number)=>void;
function random(b:GuardBrain){'worklet';b.rng=(Math.imul(b.rng,1664525)+1013904223)>>>0;return b.rng/4294967296;}
function brain(g:Guard,index:number,l:LevelDefinition):GuardBrain{
 'worklet';if(g.brain)return g.brain;let seed=2166136261;for(let j=0;j<l.id.length;j++)seed=Math.imul(seed^l.id.charCodeAt(j),16777619)>>>0;
 return g.brain={rng:(seed+Math.imul(index+1,2654435761))>>>0,goal:null,plan:false,nextPlan:0,seenFor:0,lastSight:-100,reportAt:0,heardShot:0,pickupSeen:0,searchUntil:0,searchStep:0,lastAnchor:0,alertUntil:0,blockedFor:0,supportUntil:0};
}
function face(g:Guard,a:number,dt:number){'worklet';const d=Math.atan2(Math.sin(a-g.angle),Math.cos(a-g.angle));g.angle+=Math.max(-Math.PI*1.8*dt,Math.min(Math.PI*1.8*dt,d));}
function goal(g:Guard,p:Point,mode:Guard['mode']){'worklet';const b=g.brain!;if(!b.goal||Math.hypot(b.goal.x-p.x,b.goal.y-p.y)>.3||g.mode!==mode){b.goal={x:p.x,y:p.y};b.plan=true;}g.mode=mode;}
function investigate(g:Guard,p:Point,tick:number,delay=0){
 'worklet';g.lastSeen={x:p.x,y:p.y};goal(g,p,'investigate');g.brain!.alertUntil=tick+180;g.brain!.searchUntil=0;
 if(!g.alerted){g.alerted=true;g.reactionTicks=Math.max(g.reactionTicks,delay);}
}
/** Radio reports contain a snapshot. Only actual observers broadcast; recipients never relay it. */
export function shareSighting(s:GameState,index:number,l:LevelDefinition){
 'worklet';const reporter=s.guards[index]!,b=brain(reporter,index,l);if(s.ticks<b.reportAt)return 0;b.reportAt=s.ticks+60;
 const cap=l.number===1?0:l.number<=3?1:l.number<=8?2:3;
 const candidates=s.guards.map((g,i)=>({g,i,d:Math.hypot(g.x-reporter.x,g.y-reporter.y)})).filter(v=>v.i!==index&&v.g.active&&v.g.hp>0&&v.g.combatRole!=='drone'&&!v.g.seesPlayer&&v.d<=4.8).sort((a,c)=>a.d-c.d||a.i-c.i);
 let available=Math.max(0,cap-s.guards.filter(g=>g.active&&g.hp>0&&!g.seesPlayer&&(g.brain?.supportUntil??0)>s.ticks).length);
 let count=0;for(const v of candidates){const other=brain(v.g,v.i,l),supporting=other.supportUntil>s.ticks;if(!supporting&&available<=0)continue;
  investigate(v.g,reporter.lastSeen,s.ticks,supporting?0:9+count*4);other.supportUntil=s.ticks+180;other.nextPlan=s.ticks+count*3;
  if(!supporting)available--;count++;
 }return count;
}
function roam(g:Guard,index:number,s:GameState,l:LevelDefinition){
 'worklet';const b=g.brain!,anchors=l.patrols[index]!.roam??l.patrols[index]!.route;
 let best=-Infinity,pick=0;for(let j=0;j<anchors.length;j++){const p=anchors[j]!,crowded=s.guards.some((other,k)=>k!==index&&other.active&&other.hp>0&&Math.hypot((other.brain?.goal?.x??other.x)-p.x,(other.brain?.goal?.y??other.y)-p.y)<.9);
  const score=random(b)*2-(j===b.lastAnchor?3:0)-(crowded?3:0)-Math.hypot(g.x-p.x,g.y-p.y)*.035;if(score>best){best=score;pick=j;}}
 b.lastAnchor=pick;g.target=pick%l.patrols[index]!.route.length;goal(g,anchors[pick]!,'patrol');
}
function search(g:Guard,tick:number){'worklet';const b=g.brain!;g.mode='search';g.path=[];g.pathIndex=0;b.goal=null;b.plan=false;b.searchStep=0;b.searchUntil=tick+75+Math.floor(random(b)*30);g.searchAngle=g.angle;}

/** Contact retention is separate from first detection. It never sees through cover.
 * A known opponent can be tracked peripherally or very close behind for two seconds;
 * an unaware guard still uses its original cone, preserving a clean rear ambush. */
export function hasCombatContact(g:Guard,x:number,y:number,tick:number,l:LevelDefinition){
 'worklet';if(sees(g,x,y,l))return true;
 if((l.combat?.revision??0)<9||(g.brain?.trackingUntil??-1)<tick)return false;
 const dx=x-g.x,dy=y-g.y,d=Math.hypot(dx,dy);
 if(d>g.range+.6)return false;
 if(d<1e-6)return true;
 if(d>1.8&&(dx*Math.cos(g.angle)+dy*Math.sin(g.angle))/d<-.5)return false;
 return sightDistance(g.x,g.y,dx/d,dy/d,d,l)>=d-1e-7;
}

/** Revision 8+ only. Every choice is seed/tick based, replayable and bounded. */
export function updateEncounterGuards(s:GameState,dt:number,l:LevelDefinition,shoot:Shot){
 'worklet';let paths=2;const c=s.combat!,retainContact=(l.combat?.revision??0)>=9;
 // Rotate the planning priority so the path budget cannot starve a later guard.
 const start=Math.floor(s.ticks/3)%Math.max(1,s.guards.length);
 for(let k=0;k<s.guards.length;k++){
  const i=(k+start)%s.guards.length,g=s.guards[i]!,spec=l.patrols[i]!,b=brain(g,i,l);g.px=g.x;g.py=g.y;
  if(g.hp<=0){g.active=false;g.seesPlayer=false;continue;}
  if(spec.reserveAfter!==undefined&&!g.spawned){g.active=s.securityAlarm&&s.alarmSeconds>=spec.reserveAfter&&Math.hypot(g.x-s.x,g.y-s.y)>2.2;if(!g.active)continue;g.spawned=true;}
  g.active=true;g.clock+=dt;g.flash=Math.max(0,g.flash-dt);g.range=spec.range;
  const rawSeen=hasCombatContact(g,s.x,s.y,s.ticks,l),reacquired=retainContact&&rawSeen&&(b.trackingUntil??-1)>=s.ticks;
  g.seesPlayer=rawSeen;b.seenFor=rawSeen?Math.min(1,b.seenFor+dt):0;g.exposure=rawSeen?(reacquired?1:Math.min(1,b.seenFor/Math.max(.3,spec.spotSeconds))):Math.max(0,g.exposure-dt*3);
  const confirmed=rawSeen&&g.exposure>=1;
  if(rawSeen){g.lastSeen={x:s.x,y:s.y};b.lastSight=s.ticks;}
  if(confirmed){
   if(retainContact){b.trackingUntil=s.ticks+60;g.wait=0;b.searchUntil=0;}
   b.supportUntil=0;s.spotted=true;g.alerted=true;b.alertUntil=s.ticks+180;shareSighting(s,i,l);
   if(s.ticks>=g.nextChase||retainContact&&g.mode!=='investigate'){goal(g,g.lastSeen,'investigate');g.nextChase=s.ticks+18;}
  }
  // An explicit pickup radio alert reveals the pickup location once, not the courier forever.
  if(b.pickupSeen<s.thefts){b.pickupSeen=s.thefts;const p=l.targets?.[Math.max(0,s.thefts-1)]??l.phone;if(!rawSeen&&Math.hypot(g.x-p.x,g.y-p.y)<6)investigate(g,p,s.ticks,9);}
  if(c.shots>b.heardShot){b.heardShot=c.shots;if(!rawSeen&&c.noiseLeft>0&&Math.hypot(c.noise.x-g.x,c.noise.y-g.y)<3.2)investigate(g,c.noise,s.ticks,9);}
  if(!rawSeen&&g.mode==='investigate'&&b.lastSight===s.ticks-1)goal(g,g.lastSeen,'investigate');
  if(g.reactionTicks>0){g.reactionTicks--;continue;}
  if(retainContact&&confirmed)face(g,Math.atan2(s.y-g.y,s.x-g.x),dt);
  const drone=g.combatRole==='drone';
  const aim=g.combatRole==='warden'?36:g.combatRole==='heavy'?33:g.combatRole==='sentry'?27:30;
  const burst=g.combatRole==='warden'?3:g.combatRole==='heavy'?3:g.combatRole==='sentry'?2:1;
  const recovery=g.combatRole==='heavy'||g.combatRole==='warden'?42:33;
  if(!drone){
   if(g.gunPhase==='aim'){
    if(!rawSeen){g.gunPhase='recover';g.gunTicks=15;}
    else{if(g.gunTicks>6)g.shotAngle=Math.atan2(s.y-g.y,s.x-g.x);if(!retainContact||!confirmed)face(g,g.shotAngle,dt);if(--g.gunTicks<=0){g.gunPhase='fire';g.burstLeft=burst;g.gunTicks=0;}continue;}
   }
   if(g.gunPhase==='fire'){
    if(g.gunTicks--<=0){shoot(s,g,g.shotAngle+(burst>1?(g.burstLeft-(burst+1)/2)*.12:0),i,l.number<=3?15:18);g.burstLeft--;g.gunTicks=7;if(g.burstLeft<=0){g.gunPhase='recover';g.gunTicks=recovery;}}continue;
   }
   if(g.gunPhase==='recover'){if(--g.gunTicks<=0)g.gunPhase='ready';else if(g.gunTicks>recovery-7)continue;}
   if(confirmed&&g.gunPhase==='ready'){g.gunPhase='aim';g.gunTicks=aim;g.shotAngle=Math.atan2(s.y-g.y,s.x-g.x);c.aimEvents++;continue;}
  }
  // A visible opponent takes priority over an old search path or a patrol pause.
  // Keep the firing position during recovery; cover loss resumes the last-seen path.
  if(retainContact&&confirmed&&!drone)continue;
  if(g.mode==='search'){
   if(s.ticks>=b.searchUntil){g.alerted=false;goal(g,spec.route[0]!,'return');}
   else{
    face(g,g.searchAngle+Math.sin((s.ticks-b.searchUntil)*.045)*1.4,dt);
    // Look into a neighbouring authored corner, without following hidden player state.
    if(b.searchStep<2&&s.ticks>=b.searchUntil-65+b.searchStep*25){const anchors=spec.roam??spec.route,p=anchors[(b.lastAnchor+b.searchStep+1)%anchors.length]!;b.searchStep++;if(Math.hypot(p.x-g.lastSeen.x,p.y-g.lastSeen.y)<3.5){b.goal={...p};b.plan=true;}}
   }
  }
  if(g.wait>0){g.wait=Math.max(0,g.wait-dt);face(g,g.searchAngle+Math.sin(g.clock*2)*.35,dt);continue;}
  if(!b.goal&&g.mode==='patrol')roam(g,i,s,l);
  if(b.plan&&b.goal&&s.ticks>=b.nextPlan&&paths>0){paths--;g.path=findPath(g,b.goal,l);g.pathIndex=0;b.plan=false;b.nextPlan=s.ticks+9;if(!g.path.length){b.goal=null;g.wait=.3;if(g.mode==='return')g.mode='patrol';if(g.mode==='investigate')search(g,s.ticks);}}
  if(b.plan)continue;
  const p=g.path[g.pathIndex];
  if(p){const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),travel=Math.min(d,spec.speed*(g.mode==='investigate'?1.22:1)*dt);
   if(d>.01&&!(retainContact&&confirmed))face(g,Math.atan2(dy,dx),dt);
   const next={x:d?g.x+dx/d*travel:g.x,y:d?g.y+dy/d*travel:g.y};
   const occupied=s.guards.some((other,j)=>j!==i&&other.active&&other.hp>0&&Math.hypot(next.x-other.x,next.y-other.y)<.48&&Math.hypot(g.x-other.x,g.y-other.y)>=.48);
   if(!walkableSegment(g,next,l)){b.plan=true;b.nextPlan=s.ticks+9;}
   else if(!occupied){b.blockedFor=0;g.x=next.x;g.y=next.y;if(d<=travel+.001)g.pathIndex++;}
   else if(++b.blockedFor>24+i*3){b.blockedFor=0;g.path=[];g.pathIndex=0;b.goal=null;g.wait=.25;if(g.mode==='patrol'||g.mode==='return'){g.mode='patrol';roam(g,i,s,l);}else search(g,s.ticks);}
  }else if(b.goal){
   b.goal=null;if(g.mode==='investigate')search(g,s.ticks);else if(g.mode==='return'){g.mode='patrol';g.alerted=false;g.wait=.4;}else if(g.mode==='patrol'){g.wait=spec.pauseSeconds+random(b)*.55;g.searchAngle=g.angle;}
  }else if(g.mode==='investigate'&&s.ticks>b.alertUntil)search(g,s.ticks);
 }
}
