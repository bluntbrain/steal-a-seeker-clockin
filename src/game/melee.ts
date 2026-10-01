import type {GameState} from './simulation';
import type {LevelDefinition} from './level';
import type {Guard} from './guards';
import {sees,sightDistance} from './guards';
export type MeleeState={swings:number;hits:number;blocks:number;noiseId:number;noiseRadius:number;target:number;started:number;impactAt:number;until:number;angle:number;resolved:boolean};
export function knifeCombat(l:LevelDefinition){'worklet';return (l.combat?.revision??0)>=15;}
export function knifeReach(g:Guard){'worklet';return g.combatRole==='heavy'||g.combatRole==='warden'?1.05:.85;}
export function meleeState(s:GameState){'worklet';return s.combat!.melee??(s.combat!.melee={swings:0,hits:0,blocks:0,noiseId:0,noiseRadius:0,target:-1,started:-100,impactAt:0,until:0,angle:0,resolved:true});}
export function clearMelee(s:GameState){'worklet';const m=s.combat?.melee;if(m){m.target=-1;m.resolved=true;}}
export function canKnifeHit(s:GameState,g:Guard,l:LevelDefinition){'worklet';const dx=g.x-s.x,dy=g.y-s.y,d=Math.hypot(dx,dy);return g.active&&g.hp>0&&d<=knifeReach(g)+.08&&(d<1e-6||sightDistance(s.x,s.y,dx/d,dy/d,d,l)>=d-1e-7);}
/** Damage is tick-based, never decided by a rendering/animation callback. */
export function stepMelee(s:GameState,l:LevelDefinition){
 'worklet';const c=s.combat!,m=meleeState(s),o=c.order,g=o?.kind==='attack'?s.guards[o.target]:undefined;
 if(!g||!g.active||g.hp<=0){clearMelee(s);return;}
 if(m.target!==o!.target){m.target=o!.target;m.resolved=true;}
 if(!m.resolved&&s.ticks>=m.impactAt){
  m.resolved=true;
  const delta=Math.atan2(Math.sin(Math.atan2(g.y-s.y,g.x-s.x)-m.angle),Math.cos(Math.atan2(g.y-s.y,g.x-s.x)-m.angle));
  if(canKnifeHit(s,g,l)&&Math.abs(delta)<=Math.PI/2){
   const dx=s.x-g.x,dy=s.y-g.y,d=Math.hypot(dx,dy)||1,side=(dx*Math.cos(g.angle)+dy*Math.sin(g.angle))/d;
   const rear=side<=-.35,front=side>=.5,armor=g.combatRole==='heavy'||g.combatRole==='warden';
   const unaware=!g.alerted&&!g.heist?.hunting&&!g.seesPlayer&&!sees(g,s.x,s.y,l)&&g.hp===g.maxHp;
   const damage=armor?(front?0:rear?75:20):g.combatRole==='drone'?25:rear&&unaware?g.hp:35;
   m.noiseId++;m.noiseRadius=damage?1.5:2.5;c.noise={x:g.x,y:g.y};c.noiseLeft=.4;
   if(armor&&g.heist)g.heist.armorHit=front?'front':rear?'rear':'side';
   if(!damage){g.flash=.15;m.blocks++;c.feedback='cover';c.feedbackLeft=.65;c.order=null;c.path=[];c.pathIndex=0;delete c.attackPlan;return;}
   m.hits++;c.hitEvents++;g.hp=Math.max(0,g.hp-damage);g.flash=.15;
   if(rear&&unaware){c.feedback='ambush';c.feedbackLeft=.65;}
   if(!g.hp){g.active=false;g.seesPlayer=false;c.kills++;if(g.heist)g.heist.charge=0;}
   else{g.lastSeen={x:s.x,y:s.y};if(!g.alerted){g.reactionTicks=Math.max(g.reactionTicks,8);g.gunPhase='ready';g.gunTicks=0;}g.alerted=true;if(g.brain){g.brain.goal={...g.lastSeen};g.brain.plan=true;g.brain.alertUntil=s.ticks+180;}g.mode='investigate';}
  }
 }
 if(m.resolved&&s.ticks>=m.until&&c.cooldown===0&&canKnifeHit(s,g,l)){
  m.swings++;m.started=s.ticks;m.impactAt=s.ticks+4;m.until=s.ticks+11;m.angle=Math.atan2(g.y-s.y,g.x-s.x);m.resolved=false;c.cooldown=11;
  c.path=[];c.pathIndex=0;s.facing=Math.abs(g.x-s.x)>Math.abs(g.y-s.y)?g.x<s.x?1:3:g.y<s.y?2:0;
 }
}
