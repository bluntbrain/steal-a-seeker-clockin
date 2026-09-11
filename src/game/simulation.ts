import { LEVEL, getLevel, TUNING, type Box, type MissionId, type LevelDefinition } from './level';
import { makeGuards, updateGuards, type Guard } from './guards';
export type Input = { x: number; y: number; interact: boolean; dash: number };
export type GameState = {
  x: number; y: number; px: number; py: number; vx: number; vy: number;
  facing: number; walked: number; carrying: boolean; battery: number;
  pickup: number; extraction: number; elapsed: number; ticks: number;
  dashLeft: number; cooldown: number; dashX: number; dashY: number; dashSeen: number;
  status: 'playing' | 'won' | 'timeout' | 'caught'; dashes: number; score: number; bumps: number;
  mission: MissionId; guards: Guard[]; alert: number; caughtBy: number; spotted:boolean;
};
export function initialState(mission:MissionId='practice'): GameState {
  'worklet';
  const level=getLevel(mission);
  return { x: level.spawn.x, y: level.spawn.y, px: level.spawn.x, py: level.spawn.y,
    vx: 0, vy: 0, facing: 2, walked: 0, carrying: false, battery: 100,
    pickup: 0, extraction: 0, elapsed: 0, ticks: 0, dashLeft: 0, cooldown: 0,
    dashX: 0, dashY: -1, dashSeen: 0, status: 'playing', dashes: 0, score: 0, bumps: 0,
    mission,guards:makeGuards(mission),alert:0,caughtBy:-1,spotted:false };
}
export function idleInput(): Input { 'worklet'; return { x: 0, y: 0, interact: false, dash: 0 }; }
export function clamp(n: number, lo: number, hi: number) { 'worklet'; return Math.max(lo, Math.min(hi, n)); }
export function nearPhone(s: GameState) { 'worklet'; return !s.carrying && Math.hypot(s.x - getLevel(s.mission).phone.x, s.y - getLevel(s.mission).phone.y) <= TUNING.pickupRadius; }
export function inExit(s: GameState) { 'worklet'; const e=getLevel(s.mission).exit; return s.x >= e.x && s.x <= e.x+e.w && s.y >= e.y && s.y <= e.y+e.h; }
export function intersects(x: number, y: number, b: Box) {
  'worklet';
  const cx=clamp(x,b.x,b.x+b.w),cy=clamp(y,b.y,b.y+b.h);
  return (x-cx)*(x-cx)+(y-cy)*(y-cy) < TUNING.radius*TUNING.radius-1e-8;
}
export function blocked(x: number,y: number,level:LevelDefinition=LEVEL) { 'worklet'; for(let i=0;i<level.blockers.length;i++){const b=level.blockers[i]!;if(intersects(x,y,b))return true;}return false; }
function approach(value: number,target: number,amount: number) { 'worklet'; return value<target?Math.min(value+amount,target):Math.max(value-amount,target); }
function move(s: GameState,dx: number,dy: number) {
  'worklet';
  // Substeps smaller than the collision radius prevent tunneling, including during dash.
  const count=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/.10));
  const sx=dx/count,sy=dy/count;
  for(let i=0;i<count;i++){
    if(!blocked(s.x+sx,s.y,getLevel(s.mission)))s.x+=sx;else s.bumps++;
    if(!blocked(s.x,s.y+sy,getLevel(s.mission)))s.y+=sy;else s.bumps++;
  }
}
export function step(s: GameState,input: Input,dt=TUNING.step) {
  'worklet';
  if(s.status!=='playing')return;
  s.px=s.x;s.py=s.y;s.elapsed+=dt;s.ticks++;
  s.cooldown=Math.max(0,s.cooldown-dt);
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
      s.battery-=TUNING.dashCost;s.dashes++;s.dashLeft=TUNING.dashDuration;s.cooldown=TUNING.dashCooldown;
    }
  }
  const speed=s.carrying?TUNING.carrySpeed:TUNING.walkSpeed;
  const accel=magnitude>.05?TUNING.acceleration:TUNING.friction;
  s.vx=approach(s.vx,ix*speed,accel*dt);s.vy=approach(s.vy,iy*speed,accel*dt);
  if(s.dashLeft>0){const duration=Math.min(dt,s.dashLeft);move(s,s.dashX*TUNING.dashSpeed*duration,s.dashY*TUNING.dashSpeed*duration);s.dashLeft=Math.max(0,s.dashLeft-dt);}
  else move(s,s.vx*dt,s.vy*dt);
  s.walked+=Math.hypot(s.x-s.px,s.y-s.py);
  if(input.interact && nearPhone(s) && Math.hypot(s.vx,s.vy)<.2){
    s.pickup+=dt;
    if(s.pickup+1e-8>=TUNING.pickupHold){s.carrying=true;s.battery=100;s.pickup=0;}
  }else s.pickup=0;
  updateGuards(s.guards,s.x,s.y,dt,getLevel(s.mission));
  s.alert=0;
  for(let i=0;i<s.guards.length;i++){
    s.alert=Math.max(s.alert,s.guards[i]!.exposure);if(s.guards[i]!.seesPlayer)s.spotted=true;
    if(s.guards[i]!.exposure>=1-1e-8){s.caughtBy=i;s.status='caught';s.vx=0;s.vy=0;s.px=s.x;s.py=s.y;s.extraction=0;return;}
  }
  if(s.carrying && inExit(s) && s.dashLeft===0){
    s.extraction+=dt;
    if(s.extraction+1e-8>=TUNING.extractHold){s.status='won';s.vx=0;s.vy=0;s.px=s.x;s.py=s.y;s.score=10000+20*s.battery+5*Math.max(0,Math.floor(getLevel(s.mission).targetSeconds-s.elapsed));}
  }else s.extraction=0;
  if(s.status==='playing' && s.elapsed+1e-8>=getLevel(s.mission).hardLimitSeconds){s.status='timeout';s.vx=0;s.vy=0;s.px=s.x;s.py=s.y;}
}
