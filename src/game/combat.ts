import {knifeCombat,knifeReach,canKnifeHit,stepMelee,clearMelee,type MeleeState} from './melee';
import type {GameState,Input} from './simulation';
import {updateEncounterGuards} from './encounters';
import {updateHeistGuards,directionalArmor} from './heist-guards';
import {TUNING,type LevelDefinition,type Point} from './level';
import {findPath,walkableSegment} from './navigation';
import {sightDistance,sees,type Guard} from './guards';
import {intersectsBox} from './geometry';
import {courierSpeedMultiplier} from './courier-speed';
import type {EnemyRole} from './combat-levels';
export type CombatCommand={seq:number;kind:'move'|'attack'|'phone'|'exit'|'switch'|'stop';x:number;y:number;target:number};
export type Projectile={id:number;x:number;y:number;px:number;py:number;vx:number;vy:number;left:number;owner:number;damage:number};
export type CombatState={melee?:MeleeState;hunt?:{x:number;y:number;tick:number};grateNoise?:{id:number;x:number;y:number;until:number;nextAt:number};attackPlan?:{x:number;y:number;nextTick:number;failedTarget?:number};version:2;hp:number;commandSeen:number;order:CombatCommand|null;path:Point[];pathIndex:number;cooldown:number;invulnerable:number;shots:number;enemyShots:number;kills:number;damageTaken:number;aimEvents:number;hitEvents:number;feedback:'none'|'move'|'target'|'blocked'|'cover'|'ambush';feedbackLeft:number;projectiles:Projectile[];nextShot:number;noise:Point;noiseLeft:number;flash:number;repath:number;};
export const COMBAT={damage:25,range:4,shotTicks:12,bulletSpeed:16,maxProjectiles:48,playerHP:100,damageGrace:6};
export function freshCombat():CombatState{'worklet';return {version:2,hp:100,commandSeen:0,order:null,path:[],pathIndex:0,cooldown:0,invulnerable:0,shots:0,enemyShots:0,kills:0,damageTaken:0,aimEvents:0,hitEvents:0,feedback:'none',feedbackLeft:0,projectiles:[],nextShot:1,noise:{x:0,y:0},noiseLeft:0,flash:0,repath:0};}
export function enemyStats(role:EnemyRole,hard=false){'worklet';if(hard)return role==='drone'?{hp:25,aim:0,damage:0,burst:0,recover:90}:role==='scout'?{hp:50,aim:21,damage:25,burst:2,recover:25}:role==='sentry'?{hp:75,aim:18,damage:20,burst:3,recover:30}:role==='heavy'?{hp:150,aim:30,damage:22,burst:3,recover:36}:{hp:200,aim:27,damage:25,burst:5,recover:33};return role==='drone'?{hp:25,aim:0,damage:0,burst:0,recover:90}:role==='scout'?{hp:50,aim:27,damage:20,burst:1,recover:33}:role==='sentry'?{hp:75,aim:24,damage:15,burst:2,recover:33}:role==='heavy'?{hp:150,aim:36,damage:10,burst:3,recover:42}:{hp:200,aim:42,damage:15,burst:3,recover:42};}
export function tacticalCombat(l:LevelDefinition){'worklet';return (l.combat?.revision??0)>=11||((l.combat?.revision??0)>=3&&l.id!=='combat-v2:practice');}
export function fairAmbush(l:LevelDefinition){'worklet';return (l.combat?.revision??0)>=6;}
function turnToward(g:Guard,angle:number,dt:number){
 'worklet';const delta=Math.atan2(Math.sin(angle-g.angle),Math.cos(angle-g.angle));
 g.angle+=Math.max(-Math.PI*2*dt,Math.min(Math.PI*2*dt,delta));
}
function reactToNoise(g:Guard,point:Point,l:LevelDefinition,tick=0){
 'worklet';g.lastSeen={x:point.x,y:point.y};if((l.combat?.revision??0)>=8&&g.brain){g.brain.goal={...g.lastSeen};g.brain.plan=true;g.brain.alertUntil=tick+180;}else{g.path=findPath(g,g.lastSeen,l);g.pathIndex=0;}g.mode='investigate';
 if(!g.alerted){g.alerted=true;g.reactionTicks=9;}
}
function clearOrder(c:CombatState){'worklet';c.order=null;c.path=[];c.pathIndex=0;delete c.attackPlan;if(c.melee){c.melee.target=-1;c.melee.resolved=true;}}
// Worklet compilation captures helpers at module initialization. Keep this above
// combatTap, which also needs visibility when selecting a target behind cover.
function visible(a:Point,b:Point,level:LevelDefinition){'worklet';const d=Math.hypot(a.x-b.x,a.y-b.y);return d<1e-6||sightDistance(a.x,a.y,(b.x-a.x)/d,(b.y-a.y)/d,d,level)>=d-1e-7;}
export function combatTap(s:GameState,x:number,y:number,seq:number):CombatCommand{
 'worklet';const level=s.definition!,radius=.85;let target=-1,best=radius;
 for(let i=0;i<s.guards.length;i++){const g=s.guards[i]!;if(!g.active||g.hp<=0)continue;const d=Math.hypot(x-g.x,y-g.y);if(d<best&&((level.combat?.revision??0)>=14||(level.combat?.revision??0)<10||visible(s,g,{...level,blockers:s.blockers}))){target=i;best=d;}}
 if(target>=0)return {seq,kind:'attack',target,x:s.guards[target]!.x,y:s.guards[target]!.y};
 const phone=level.targets?.[s.delivered]??level.phone;
 if(!s.carrying&&Math.hypot(x-phone.x,y-phone.y)<radius)return {seq,kind:'phone',target:s.delivered,x:phone.x,y:phone.y};
 if(s.carrying&&x>=level.exit.x-.4&&x<=level.exit.x+level.exit.w+.4&&y>=level.exit.y-.4&&y<=level.exit.y+level.exit.h+.4)return {seq,kind:'exit',target:0,x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2};
 for(let i=0;i<(level.switches?.length??0);i++){const p=level.switches![i]!;if(Math.hypot(x-p.x,y-p.y)<radius)return {seq,kind:'switch',target:i,x:p.x,y:p.y};}
 return {seq,kind:Math.hypot(x-s.x,y-s.y)<.5?'stop':'move',target:-1,x,y};
}
function validPoint(p:Point,l:LevelDefinition){'worklet';return p.x>.65&&p.y>.65&&p.x<l.width-.65&&p.y<l.height-.65&&!l.blockers.some(b=>intersectsBox(p.x,p.y,b,.32));}
function setPath(s:GameState,p:Point,l:LevelDefinition){'worklet';if(!validPoint(p,l))return false;const path=findPath(s,p,l);if(!path.length)return false;s.combat!.path=path;s.combat!.pathIndex=0;return true;}
function attackApproach(s:GameState,g:Guard,l:LevelDefinition){
 'worklet';const c=s.combat!;if(visible(s,g,l)&&Math.hypot(g.x-s.x,g.y-s.y)<=COMBAT.range){c.path=[];return true;}
 let best:Point[]|null=null,distance=Infinity;
 for(let i=0;i<12;i++){const angle=i*Math.PI/6,p={x:g.x+Math.cos(angle)*3.3,y:g.y+Math.sin(angle)*3.3};if(!validPoint(p,l)||!visible(p,g,l))continue;const path=findPath(s,p,l);if(!path.length)continue;let cost=0,last:Point=s;for(const n of path){cost+=Math.hypot(n.x-last.x,n.y-last.y);last=n;}if(cost<distance){distance=cost;best=path;}}
 if(!best)return false;c.path=best;c.pathIndex=0;return true;
}
/** One bounded navigation search, then stop at the first clear firing position
 * along that route. Never path through the target or shoot through cover. */
export function approachTarget(s:GameState,g:Guard,l:LevelDefinition){
 'worklet';const c=s.combat!,standOff=knifeCombat(l)?knifeReach(g):2.6,d=Math.hypot(g.x-s.x,g.y-s.y);
 if(d<=standOff&&visible(s,g,l)){c.path=[];c.pathIndex=0;return true;}
 const route=findPath(s,g,l);if(!route.length)return false;
 const approach:Point[]=[];let from:Point=s;
 for(const to of route){
  const length=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(length/.18));
  for(let n=1;n<=steps;n++){
   const p={x:from.x+(to.x-from.x)*n/steps,y:from.y+(to.y-from.y)*n/steps};
   if(Math.hypot(p.x-g.x,p.y-g.y)<=standOff&&visible(p,g,l)){
    approach.push(p);c.path=approach;c.pathIndex=0;return true;
   }
  }
  approach.push(to);from=to;
 }
 return false;
}
function issue(s:GameState,cmd:CombatCommand,l:LevelDefinition){
 'worklet';const c=s.combat!;if(cmd.seq<=c.commandSeen)return;c.commandSeen=cmd.seq;if(tacticalCombat(l)&&c.order?.kind==='phone'&&cmd.kind==='phone'&&c.order.target===cmd.target)return;c.feedbackLeft=1;c.feedback='blocked';
 if(cmd.kind==='stop'){clearOrder(c);c.feedback='move';return;}
 if(cmd.kind==='attack'){
  const g=s.guards[cmd.target],tracking=(l.combat?.revision??0)>=14;
  if(!g||!g.active||g.hp<=0||(!tracking&&!visible(s,g,l)))return;
  if(tracking&&c.order?.kind==='attack'&&c.order.target===cmd.target){c.feedback='target';return;}
  if(knifeCombat(l)&&c.attackPlan?.failedTarget===cmd.target&&s.ticks<c.attackPlan.nextTick)return;
  if(!(tracking?approachTarget(s,g,l):attackApproach(s,g,l))){if(knifeCombat(l))c.attackPlan={x:g.x,y:g.y,nextTick:s.ticks+8,failedTarget:cmd.target};return;}
  if(tracking)c.attackPlan={x:g.x,y:g.y,nextTick:s.ticks+12};
 }
 else{let p:Point=cmd;if(cmd.kind==='phone'){if(s.carrying)return;p=l.targets?.[s.delivered]??l.phone;}if(cmd.kind==='exit'){if(!s.carrying)return;p={x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2};}if(cmd.kind==='switch'){const pad=l.switches?.[cmd.target];if(!pad)return;p=pad;}if(!setPath(s,p,l))return;}
 if(cmd.kind!=='attack'){delete c.attackPlan;clearMelee(s);}else if(c.order?.target!==cmd.target)clearMelee(s);c.order={...cmd};c.feedback=cmd.kind==='attack'?'target':'move';s.pickup=0;
}
function walkActor(a:Point,p:Point,speed:number,dt:number,l:LevelDefinition){'worklet';const d=Math.hypot(p.x-a.x,p.y-a.y),travel=Math.min(d,speed*dt);if(d<1e-6)return true;const next={x:a.x+(p.x-a.x)/d*travel,y:a.y+(p.y-a.y)/d*travel};if(!walkableSegment(a,next,l))return false;a.x=next.x;a.y=next.y;return true;}
function spawnShot(s:GameState,from:Point,angle:number,owner:number,damage:number){'worklet';const c=s.combat!;if(owner<0&&knifeCombat(s.definition!))return;if(c.projectiles.length>=COMBAT.maxProjectiles)return;const speed=owner<0?(tacticalCombat(s.definition!)?18:16):(s.definition!.combat?.revision??0)>=11?16:tacticalCombat(s.definition!)?13:10;c.projectiles.push({id:c.nextShot++,x:from.x,y:from.y,px:from.x,py:from.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,left:owner<0?COMBAT.range:7,owner,damage});if(owner<0){c.shots++;c.noise={x:s.x,y:s.y};c.noiseLeft=tacticalCombat(s.definition!)?1.5:1.2;}else c.enemyShots++;}
function gates(s:GameState){'worklet';const l=s.definition!;let changed=false;s.relayTimers=s.relayTimers.map(t=>Math.max(0,t-TUNING.step));for(let i=0;i<(l.gates?.length??0);i++){const g=l.gates![i]!,closed=g.mode==='power'?s.power!==g.power:g.mode==='relay'?(s.relayTimers[g.relay??0]??0)<=0:(s.elapsed+g.phase)%g.period>=g.openSeconds;const occupied=intersectsBox(s.x,s.y,g.box,.4)||s.guards.some(a=>a.active&&a.hp>0&&intersectsBox(a.x,a.y,g.box,.4));if((!closed||!occupied)&&s.closedGates[i]!==closed){s.closedGates[i]=closed;changed=true;}}if(changed)s.blockers=[...l.blockers,...(l.gates??[]).filter((_,i)=>s.closedGates[i]).map(g=>g.box)];}
function enemies(s:GameState,dt:number,l:LevelDefinition){
 'worklet';if((l.combat?.revision??0)>=10){updateHeistGuards(s,dt,l,spawnShot);return;}if((l.combat?.revision??0)>=8){updateEncounterGuards(s,dt,l,spawnShot);return;}const c=s.combat!;
 for(let i=0;i<s.guards.length;i++){
  const g=s.guards[i]!,spec=l.patrols[i]!,stats=enemyStats(g.combatRole,tacticalCombat(l));g.px=g.x;g.py=g.y;
  if(g.hp<=0){g.active=false;g.seesPlayer=false;continue;}
  if(spec.reserveAfter!==undefined&&!g.spawned){g.active=s.securityAlarm&&s.alarmSeconds>=spec.reserveAfter&&Math.hypot(s.x-g.x,s.y-g.y)>1.25;if(!g.active)continue;g.spawned=true;}
  g.active=true;g.clock+=dt;g.flash=Math.max(0,g.flash-dt);g.range=spec.range+(tacticalCombat(l)&&s.securityAlarm?.8:0);
  if(g.combatRole==='drone'){
   // Revision 7 campaign scouts patrol and report only to their nearby pair.
   // The tutorial and all older published replays retain stationary drones.
   if((l.combat?.revision??0)<7){g.seesPlayer=false;g.exposure=0;continue;}
   const p=spec.route[g.target];
   if(g.wait>0)g.wait=Math.max(0,g.wait-dt);
   else if(p){const dx=p.x-g.x,dy=p.y-g.y;if(Math.hypot(dx,dy)>.01)turnToward(g,Math.atan2(dy,dx),dt);
    if(walkActor(g,p,spec.speed,dt,l)&&Math.hypot(g.x-p.x,g.y-p.y)<.02){g.target=(g.target+1)%spec.route.length;g.wait=spec.pauseSeconds;}}
   g.seesPlayer=sees(g,s.x,s.y,l);
   g.exposure=g.seesPlayer?Math.min(1,g.exposure+dt/Math.max(.5,spec.spotSeconds)):Math.max(0,g.exposure-dt*3);
   if(g.exposure>=1&&g.clock>=g.nextReport){
    s.spotted=true;g.lastSeen={x:s.x,y:s.y};g.nextReport=g.clock+2;
    for(const other of s.guards)if(other!==g&&other.active&&other.hp>0&&other.combatRole!=='drone'&&Math.hypot(other.x-g.x,other.y-g.y)<=4.5&&!other.seesPlayer)reactToNoise(other,g.lastSeen,l,s.ticks);
   }
   continue;
  }
  if(fairAmbush(l)&&g.reactionTicks>0){g.reactionTicks--;g.seesPlayer=false;g.exposure=0;continue;}
  const seen=sees(g,s.x,s.y,l);if(tacticalCombat(l)&&g.seesPlayer&&!seen){g.path=findPath(g,g.lastSeen,l);g.pathIndex=0;g.mode='investigate';g.nextReport=g.clock+1.4;}g.seesPlayer=seen;g.exposure=seen?1:0;if(seen){s.spotted=true;g.lastSeen={x:s.x,y:s.y};if(fairAmbush(l))g.alerted=true;}
  if(g.gunPhase==='aim'){
   if(!seen){g.gunPhase='recover';g.gunTicks=12;continue;}
   if(g.gunTicks>6)g.shotAngle=Math.atan2(s.y-g.y,s.x-g.x);g.angle=g.shotAngle;
   if(--g.gunTicks<=0){g.gunPhase='fire';g.burstLeft=stats.burst;g.gunTicks=0;}
  }
  if(g.gunPhase==='fire'){
   if(g.gunTicks--<=0){spawnShot(s,g,g.shotAngle+(g.combatRole==='heavy'||g.combatRole==='warden'?(g.burstLeft-(stats.burst+1)/2)*(tacticalCombat(l)?.16:.19):0),i,stats.damage);g.burstLeft--;g.gunTicks=6;if(g.burstLeft<=0){g.gunPhase='recover';g.gunTicks=stats.recover;}}continue;
  }
  if(g.gunPhase==='aim')continue;
  const recovering=g.gunPhase==='recover'&&--g.gunTicks>0;if(recovering&&(!tacticalCombat(l)||g.gunTicks>stats.recover-8))continue;if(!recovering&&g.gunPhase==='recover')g.gunPhase='ready';
  if(seen&&!recovering){g.gunPhase='aim';g.gunTicks=stats.aim;g.shotAngle=Math.atan2(s.y-g.y,s.x-g.x);c.aimEvents++;continue;}
  if((s.securityAlarm&&g.clock>=g.nextReport)||(c.noiseLeft>0&&Math.hypot(c.noise.x-g.x,c.noise.y-g.y)<(fairAmbush(l)?3.5:tacticalCombat(l)?7:5)&&g.clock>=g.nextChase)){
   const source=s.securityAlarm?{x:s.x,y:s.y}:{...c.noise};
   if(fairAmbush(l)){if(s.securityAlarm)g.alerted=true;reactToNoise(g,source,l,s.ticks);}else{g.lastSeen=source;g.path=findPath(g,g.lastSeen,l);g.pathIndex=0;g.mode='investigate';}
   g.nextReport=g.clock+(tacticalCombat(l)?1.4+(i%3)*.15:4);g.nextChase=g.clock+1.3;
   if(fairAmbush(l)&&g.reactionTicks>0)continue;
  }
  const multiplier=s.securityAlarm?(tacticalCombat(l)?2+.35*Math.min(1,s.alarmSeconds/12):1.35+.15*Math.min(1,s.alarmSeconds/10)):1;
  if(recovering&&seen&&g.clock>=g.nextChase){g.path=findPath(g,g.lastSeen,l);g.pathIndex=0;g.mode='investigate';g.nextChase=g.clock+.7;}
  let p:Point|undefined;if(g.mode==='investigate'||g.mode==='return'){p=g.path[g.pathIndex];if(!p){if(g.mode==='return'){g.mode='patrol';g.wait=.6;}else{g.path=findPath(g,spec.route[g.target]!,l);g.pathIndex=0;g.mode='return';}}}else if(g.wait>0){g.wait-=dt;continue;}else p=spec.route[g.target];
  if(p){const dx=p.x-g.x,dy=p.y-g.y;if(Math.hypot(dx,dy)>.01){const angle=Math.atan2(dy,dx);if(fairAmbush(l))turnToward(g,angle,dt);else g.angle=angle;}if(walkActor(g,p,spec.speed*multiplier,dt,l)&&Math.hypot(g.x-p.x,g.y-p.y)<.02){if(g.mode==='investigate'||g.mode==='return')g.pathIndex++;else{g.target=(g.target+1)%spec.route.length;g.wait=spec.pauseSeconds;}}}
 }
}
function projectiles(s:GameState,dt:number,l:LevelDefinition){
 'worklet';const c=s.combat!;const alive:Projectile[]=[];
 for(const p of c.projectiles){p.px=p.x;p.py=p.y;const travel=Math.min(p.left,Math.hypot(p.vx,p.vy)*dt),speed=Math.hypot(p.vx,p.vy),dx=p.vx/speed,dy=p.vy/speed;let distance=sightDistance(p.x,p.y,dx,dy,travel,l),hit=-2;
  const targets=p.owner<0?s.guards:[s];for(let i=0;i<targets.length;i++){const a=targets[i]!;if(p.owner<0&&(!(a as Guard).active||(a as Guard).hp<=0))continue;const ax=a.x-p.x,ay=a.y-p.y,along=ax*dx+ay*dy,perp=ax*ax+ay*ay-along*along,r=.38;if(perp>r*r||along+r<0)continue;const contact=Math.max(0,along-Math.sqrt(Math.max(0,r*r-perp)));if(contact<=distance){distance=contact;hit=i;}}
  p.x+=dx*distance;p.y+=dy*distance;p.left-=travel;
  if(hit>=0){if(p.owner<0){const g=s.guards[hit]!;const ambush=p.damage>COMBAT.damage;const armor=(l.combat?.revision??0)>=10&&(g.combatRole==='heavy'||g.combatRole==='warden')?directionalArmor(g,p.vx,p.vy,p.damage):undefined;const damage=armor?.damage??p.damage;if(armor&&g.heist)g.heist.armorHit=armor.region;if(ambush){c.feedback='ambush';c.feedbackLeft=.65;}g.hp=Math.max(0,g.hp-damage);if(tacticalCombat(l)&&g.hp>0){
     g.lastSeen={x:s.x,y:s.y};
     if(fairAmbush(l)){
      // Only the opening ambush staggers armor. Repeated hits cannot stun-lock it.
      reactToNoise(g,s,l,s.ticks);
      if(ambush){g.reactionTicks=Math.max(g.reactionTicks,12);g.gunPhase='ready';g.gunTicks=0;}
     }else if(visible(g,s,l)&&g.gunPhase!=='fire'&&g.gunPhase!=='aim'){g.angle=Math.atan2(s.y-g.y,s.x-g.x);g.shotAngle=g.angle;g.gunPhase='aim';g.gunTicks=enemyStats(g.combatRole,true).aim;c.aimEvents++;}
    }g.flash=.15;c.hitEvents++;if(!g.hp){g.active=false;g.seesPlayer=false;c.kills++;}}else if(c.invulnerable===0){const damage=Math.min(c.hp,p.damage);c.hp-=damage;c.damageTaken+=damage;c.invulnerable=COMBAT.damageGrace;c.flash=.2;if(!c.hp){s.status='caught';s.caughtBy=p.owner;}}continue;}
  if(distance+1e-7>=travel&&p.left>0)alive.push(p);
 }c.projectiles=alive;
}
export function stepCombat(s:GameState,input:Input,dt=TUNING.step){
 'worklet';const c=s.combat!;s.px=s.x;s.py=s.y;s.ticks++;s.elapsed=s.ticks/30;s.vx=0;s.vy=0;c.cooldown=Math.max(0,c.cooldown-1);c.invulnerable=Math.max(0,c.invulnerable-1);c.flash=Math.max(0,c.flash-dt);c.feedbackLeft=Math.max(0,c.feedbackLeft-dt);c.noiseLeft=Math.max(0,c.noiseLeft-dt);if(s.securityAlarm)s.alarmSeconds+=dt;gates(s);
 const level={...s.definition!,blockers:s.blockers};if(input.command)issue(s,input.command,level);
 const order=c.order;
 if(order?.kind==='attack'){
  const g=s.guards[order.target];if(!g||!g.active||g.hp<=0)clearOrder(c);
  else if(knifeCombat(level)){
   stepMelee(s,level);
   if(c.order&&(!c.melee||c.melee.resolved&&s.ticks>=c.melee.until)&&!canKnifeHit(s,g,level)){
    const plan=c.attackPlan;if(!plan||s.ticks>=plan.nextTick&&(c.pathIndex>=c.path.length||Math.hypot(g.x-plan.x,g.y-plan.y)>.35)){
     c.attackPlan={x:g.x,y:g.y,nextTick:s.ticks+8};
     if(!approachTarget(s,g,level)){clearOrder(c);c.attackPlan={x:g.x,y:g.y,nextTick:s.ticks+8,failedTarget:order.target};c.feedback='blocked';c.feedbackLeft=1;}
    }
   }
  }
  else if(visible(s,g,level)&&Math.hypot(s.x-g.x,s.y-g.y)<=((level.combat?.revision??0)>=14?(c.pathIndex<c.path.length?2.6:3.1):COMBAT.range)){c.path=[];s.facing=Math.abs(g.x-s.x)>Math.abs(g.y-s.y)?(g.x<s.x?1:3):(g.y<s.y?2:0);if(!c.cooldown){const behind=(s.x-g.x)*Math.cos(g.angle)+(s.y-g.y)*Math.sin(g.angle)<0;const unaware=fairAmbush(level)?g.hp===g.maxHp&&!sees(g,s.x,s.y,level):!g.seesPlayer;const damage=tacticalCombat(level)&&!s.securityAlarm&&unaware&&g.gunPhase==='ready'&&behind?50:25;spawnShot(s,s,Math.atan2(g.y-s.y,g.x-s.x),-1,damage);c.cooldown=12;}}
  else if((level.combat?.revision??0)>=14){
   const plan=c.attackPlan;
   if(!plan||s.ticks>=plan.nextTick&&(c.pathIndex>=c.path.length||Math.hypot(g.x-plan.x,g.y-plan.y)>.65)){
    c.attackPlan={x:g.x,y:g.y,nextTick:s.ticks+12};
    if(!approachTarget(s,g,level)){clearOrder(c);c.feedback='cover';c.feedbackLeft=1;}
   }
  }else if(c.pathIndex>=c.path.length){clearOrder(c);c.feedback='cover';c.feedbackLeft=1;}
 }
 const point=c.path[c.pathIndex];if(point&&!(knifeCombat(level)&&c.melee&&!c.melee.resolved)){const speed=(tacticalCombat(level)?(s.carrying?3.15:4.1):(s.carrying?2.8:3.4))*courierSpeedMultiplier(level);if(walkActor(s,point,speed,dt,level)){if(Math.hypot(point.x-s.x,point.y-s.y)<.02)c.pathIndex++;}else{c.repath++;if(!setPath(s,c.path[c.path.length-1]!,level)){clearOrder(c);c.feedback='blocked';c.feedbackLeft=1;}}}
 s.vx=(s.x-s.px)/dt;s.vy=(s.y-s.py)/dt;s.walked+=Math.hypot(s.x-s.px,s.y-s.py);if(Math.hypot(s.vx,s.vy)>.01)s.facing=Math.abs(s.vx)>Math.abs(s.vy)?(s.vx<0?1:3):(s.vy<0?2:0);
 if(c.order&&c.pathIndex>=c.path.length&&c.order.kind!=='attack'){
  const kind=c.order.kind;if(kind==='phone'){const phone=level.targets?.[s.delivered]??level.phone;if(Math.hypot(s.x-phone.x,s.y-phone.y)<.7){s.pickup+=dt;if(s.pickup>=(tacticalCombat(level)?.55:.4)-1e-8){s.carrying=true;s.securityAlarm=true;s.thefts++;s.pickup=0;clearOrder(c);}}else clearOrder(c);}
  else if(kind==='switch'){const pad=level.switches?.[c.order.target];if(pad&&Math.hypot(s.x-pad.x,s.y-pad.y)<.7){if(pad.kind==='power')s.power=s.power?0:1;else s.relayTimers[pad.channel??0]=pad.duration??9;s.activations++;}clearOrder(c);}
  else clearOrder(c);
 }
 if((level.combat?.revision??0)>=10&&Math.hypot(s.vx,s.vy)>.1&&s.ticks>=(c.grateNoise?.nextAt??0)){for(const grate of level.encounter?.grates??[])if(intersectsBox(s.x,s.y,grate,.08)){c.grateNoise={id:(c.grateNoise?.id??0)+1,x:s.x,y:s.y,until:s.ticks+30,nextAt:s.ticks+45};break;}}
 enemies(s,dt,level);projectiles(s,dt,level);s.alert=s.guards.some(g=>g.active&&g.hp>0&&g.seesPlayer)?1:0;s.battery=c.hp;
 if(s.status!=='playing'){clearOrder(c);s.vx=0;s.vy=0;return;}
 const e=level.exit,w=level.exitWindow,open=!w||(s.elapsed+w.phase)%w.period<w.openSeconds;
 if(s.carrying&&s.x>=e.x&&s.x<=e.x+e.w&&s.y>=e.y&&s.y<=e.y+e.h&&open){s.extraction+=dt;if(s.extraction>=(tacticalCombat(level)?1.2:.8)-1e-8){s.delivered++;s.deliveryBatteries.push(c.hp);s.carrying=false;s.extraction=0;clearOrder(c);if(s.delivered>=(level.targets?.length??1)){s.status='won';s.score=5000+Math.floor(3000*Math.max(0,level.hardLimitSeconds*30-s.ticks)/(level.hardLimitSeconds*30))+20*c.hp;}}}else s.extraction=0;
 if(s.status==='playing'&&s.ticks>=level.hardLimitSeconds*30)s.status='timeout';
}
