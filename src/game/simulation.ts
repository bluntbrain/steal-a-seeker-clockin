import { LEVEL, getLevel, TUNING, SECURITY, type Box, type MissionId, type LevelDefinition, type GateSpec } from './level';
import {intersectsBox,blockedBy} from './geometry';
import { makeGuards, updateGuards, type Guard } from './guards';
export type Input = { x: number; y: number; interact: boolean; dash: number;tool?:number };
export type GameState = {
  x: number; y: number; px: number; py: number; vx: number; vy: number;
  facing: number; walked: number; carrying: boolean; battery: number;
  pickup: number; extraction: number; elapsed: number; ticks: number;
  dashLeft: number; cooldown: number; dashX: number; dashY: number; dashSeen: number;
  status: 'playing' | 'won' | 'timeout' | 'caught'; dashes: number; score: number; bumps: number;
  securityAlarm:boolean;alarmSeconds:number;thefts:number;decoyFeedback:'none'|'thrown'|'blocked'|'empty';decoyFeedbackLeft:number;
  mission: MissionId; guards: Guard[]; alert: number; caughtBy: number; spotted:boolean;closedGates:boolean[];blockers:Box[];decoysLeft:number;toolSeen:number;decoy:{x:number;y:number;ttl:number;id:number};power:0|1;relayTimers:number[];interactSeen:boolean;activations:number;delivered:number;deliveryBatteries:number[];
};
export function gateWantsClosed(g:GateSpec,elapsed:number,power:number,timers:number[]){'worklet';return g.mode==='power'?g.power!==power:g.mode==='relay'?(timers[g.relay??0]??0)<=0:(elapsed+g.phase)%g.period>=g.openSeconds;}
export function initialState(mission:MissionId='practice'): GameState {
  'worklet';
  const level=getLevel(mission);
  return { x: level.spawn.x, y: level.spawn.y, px: level.spawn.x, py: level.spawn.y,
    vx: 0, vy: 0, facing: 2, walked: 0, carrying: false, battery: 100,
    pickup: 0, extraction: 0, elapsed: 0, ticks: 0, dashLeft: 0, cooldown: 0,
    dashX: 0, dashY: -1, dashSeen: 0, status: 'playing', dashes: 0, score: 0, bumps: 0,
    securityAlarm:false,alarmSeconds:0,thefts:0,decoyFeedback:'none',decoyFeedbackLeft:0,power:0,relayTimers:[0,0],interactSeen:false,activations:0,delivered:0,deliveryBatteries:[],decoysLeft:level.decoys??0,toolSeen:0,decoy:{x:0,y:0,ttl:0,id:0},mission,guards:makeGuards(mission),alert:0,caughtBy:-1,spotted:false,closedGates:(level.gates??[]).map(g=>gateWantsClosed(g,0,0,[0,0])),blockers:[...level.blockers,...(level.gates??[]).filter(g=>gateWantsClosed(g,0,0,[0,0])).map(g=>g.box)] };
}
export function idleInput(): Input { 'worklet'; return { x: 0, y: 0, interact: false, dash: 0 }; }
export function clamp(n: number, lo: number, hi: number) { 'worklet'; return Math.max(lo, Math.min(hi, n)); }
export function targetPhone(s:GameState){'worklet';const level=getLevel(s.mission);return level.targets?.[Math.min(s.delivered,level.targets.length-1)]??level.phone;}
export function targetCount(s:GameState){'worklet';return getLevel(s.mission).targets?.length??1;}
export function nearPhone(s:GameState){'worklet';const phone=targetPhone(s);return s.status==='playing'&&!s.carrying&&Math.hypot(s.x-phone.x,s.y-phone.y)<=TUNING.pickupRadius;}
export function nearSwitch(s:GameState){'worklet';const switches=getLevel(s.mission).switches??[];for(let i=0;i<switches.length;i++)if(Math.hypot(s.x-switches[i]!.x,s.y-switches[i]!.y)<.95)return i;return -1;}
export function inExit(s: GameState) { 'worklet'; const e=getLevel(s.mission).exit; return s.x >= e.x && s.x <= e.x+e.w && s.y >= e.y && s.y <= e.y+e.h; }
export const intersects=intersectsBox;
export function blocked(x:number,y:number,level:LevelDefinition=LEVEL){'worklet';return blockedBy(x,y,level.blockers);}
export function decoyLanding(s:GameState,input:Input=idleInput()){
 'worklet';const dirs=[[0,1],[-1,0],[0,-1],[1,0]],m=Math.hypot(input.x,input.y),dx=m>.05?input.x/m:dirs[s.facing]![0]!,dy=m>.05?input.y/m:dirs[s.facing]![1]!;let distance=0;
 for(let d=.2;d<=SECURITY.decoyRange+.01;d+=.2){if(s.blockers.some(b=>intersectsBox(s.x+dx*d,s.y+dy*d,b,.4)))break;distance=d;}
 return {x:s.x+dx*distance,y:s.y+dy*distance,distance};
}
function updateGates(s:GameState){
 'worklet';const level=getLevel(s.mission),gates=level.gates;if(!gates)return;
 let changed=false;
 for(let i=0;i<gates.length;i++){
  const gate=gates[i]!,wantsClosed=gateWantsClosed(gate,s.elapsed,s.power,s.relayTimers);
  // Never materialize a gate on a body; it closes after the doorway clears.
  const occupied=intersectsBox(s.x,s.y,gate.box,.4)||s.guards.some(g=>intersectsBox(g.x,g.y,gate.box,.45));
  const closed=wantsClosed&&(s.closedGates[i]||!occupied);if(closed!==s.closedGates[i]){s.closedGates[i]=closed;changed=true;}
 }
 if(changed)s.blockers=[...level.blockers,...gates.filter((_,i)=>s.closedGates[i]).map(g=>g.box)];
}
function approach(value: number,target: number,amount: number) { 'worklet'; return value<target?Math.min(value+amount,target):Math.max(value-amount,target); }
function move(s: GameState,dx: number,dy: number) {
  'worklet';
  // Substeps smaller than the collision radius prevent tunneling, including during dash.
  const count=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/.10));
  const sx=dx/count,sy=dy/count;
  for(let i=0;i<count;i++){
    if(!blockedBy(s.x+sx,s.y,s.blockers))s.x+=sx;else s.bumps++;
    if(!blockedBy(s.x,s.y+sy,s.blockers))s.y+=sy;else s.bumps++;
  }
}
export function step(s: GameState,input: Input,dt=TUNING.step) {
  'worklet';
  if(s.status!=='playing')return;
  s.px=s.x;s.py=s.y;s.elapsed+=dt;s.ticks++;s.relayTimers=s.relayTimers.map(t=>Math.max(0,t-dt));updateGates(s);if(!input.interact)s.interactSeen=false;
  if(s.securityAlarm)s.alarmSeconds+=dt;s.decoyFeedbackLeft=Math.max(0,s.decoyFeedbackLeft-dt);
  s.cooldown=Math.max(0,s.cooldown-dt);s.decoy.ttl=Math.max(0,s.decoy.ttl-dt);let noise:({x:number;y:number;kind?:'decoy'|'dash';id?:number;ttl?:number})|undefined;
  const magnitude=Math.hypot(input.x,input.y),divisor=Math.max(1,magnitude);
  const ix=input.x/divisor,iy=input.y/divisor;
  if(magnitude>.05){
    s.facing=Math.abs(ix)>Math.abs(iy)?(ix<0?1:3):(iy<0?2:0);
  }
  if(input.dash!==s.dashSeen){
    s.dashSeen=input.dash;
    if(s.carrying && s.battery>=TUNING.dashCost && s.cooldown<=0 && s.dashLeft<=0){
      const dirs=[[0,1],[-1,0],[0,-1],[1,0]];
      s.dashX=magnitude>.05?ix/Math.hypot(ix,iy):dirs[s.facing]![0]!;
      s.dashY=magnitude>.05?iy/Math.hypot(ix,iy):dirs[s.facing]![1]!;
      s.battery-=TUNING.dashCost;s.dashes++;noise={x:s.x,y:s.y,kind:'dash'};s.dashLeft=TUNING.dashDuration;s.cooldown=TUNING.dashCooldown;
    }
  }
  if((input.tool??0)!==s.toolSeen){
   s.toolSeen=input.tool??0;
   if(s.decoysLeft>0){const landing=decoyLanding(s,input),distance=landing.distance;
    if(distance>=.6){s.decoy={x:landing.x,y:landing.y,ttl:SECURITY.decoySeconds,id:s.decoy.id+1};s.decoysLeft--;s.decoyFeedback='thrown';}else s.decoyFeedback='blocked';s.decoyFeedbackLeft=3;
   }else{s.decoyFeedback='empty';s.decoyFeedbackLeft=3;}
  }
  const speed=s.carrying?TUNING.carrySpeed:TUNING.walkSpeed;
  const accel=magnitude>.05?TUNING.acceleration:TUNING.friction;
  s.vx=approach(s.vx,ix*speed,accel*dt);s.vy=approach(s.vy,iy*speed,accel*dt);
  if(s.dashLeft>0){const duration=Math.min(dt,s.dashLeft);move(s,s.dashX*TUNING.dashSpeed*duration,s.dashY*TUNING.dashSpeed*duration);s.dashLeft=Math.max(0,s.dashLeft-dt);}
  else move(s,s.vx*dt,s.vy*dt);
  s.walked+=Math.hypot(s.x-s.px,s.y-s.py);
  const switchIndex=nearSwitch(s);
  if(input.interact&&!s.interactSeen&&switchIndex>=0&&Math.hypot(s.vx,s.vy)<.2){const pad=getLevel(s.mission).switches![switchIndex]!;if(pad.kind==='power')s.power=s.power===0?1:0;else s.relayTimers[pad.channel??0]=pad.duration??9;s.interactSeen=true;s.activations++;updateGates(s);}
  if(input.interact && switchIndex<0 && nearPhone(s) && Math.hypot(s.vx,s.vy)<.2){
    s.pickup+=dt;
    if(s.pickup+1e-8>=TUNING.pickupHold){s.carrying=true;s.securityAlarm=true;s.thefts++;s.battery=100;s.pickup=0;s.cooldown=0;}
  }else s.pickup=0;
  if(s.decoy.ttl>0)noise={...s.decoy,kind:'decoy'};
  updateGuards(s.guards,s.x,s.y,dt,{...getLevel(s.mission),blockers:s.blockers},noise,{power:s.power,delivered:s.delivered,alarmSeconds:s.securityAlarm&&getLevel(s.mission).number>0?s.alarmSeconds:-1});
  s.alert=0;
  for(let i=0;i<s.guards.length;i++){
    s.alert=Math.max(s.alert,s.guards[i]!.exposure);if(s.guards[i]!.seesPlayer)s.spotted=true;
    if(s.guards[i]!.exposure>=1-1e-8){s.caughtBy=i;s.status='caught';s.vx=0;s.vy=0;s.px=s.x;s.py=s.y;s.extraction=0;return;}
  }
  if(s.carrying && inExit(s) && s.dashLeft===0){
    s.extraction+=dt;
    if(s.extraction+1e-8>=TUNING.extractHold){s.deliveryBatteries.push(s.battery);s.delivered++;s.vx=0;s.vy=0;s.px=s.x;s.py=s.y;s.extraction=0;if(s.delivered>=targetCount(s)){s.status='won';s.score=10000+2000*(targetCount(s)-1)+20*s.battery+5*Math.max(0,Math.floor(getLevel(s.mission).targetSeconds-s.elapsed));}else{s.carrying=false;}}
  }else s.extraction=0;
  if(s.status==='playing' && s.elapsed+1e-8>=getLevel(s.mission).hardLimitSeconds){s.status='timeout';s.vx=0;s.vy=0;s.px=s.x;s.py=s.y;}
}
