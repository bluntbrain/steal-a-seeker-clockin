import type {GameState} from '../game/simulation';
import {courierMoving} from './courier-locomotion';
import {attackPose} from './melee-presentation';

export const STEADY_WALK_FRAMES=32;
export const STEADY_BANK_SIZE=36;
export const STEADY_CYCLE_SECONDS=1.6;
type PoseState=Pick<GameState,'x'|'y'|'px'|'py'|'status'|'carrying'|'ticks'|'combat'>;

/** Presentation only. Actual travel gates walking; attacks keep tick timing. */
export function courierSteadyFrame(s:PoseState,clock:number){
 'worklet';
 const offset=s.carrying?STEADY_BANK_SIZE:0;
 if(s.status==='playing'&&s.combat?.melee){
  const pose=attackPose(s.ticks-s.combat.melee.started);
  if(pose>=0)return offset+33+pose;
 }
 if(!courierMoving(s))return offset;
 const phase=((clock%STEADY_CYCLE_SECONDS)+STEADY_CYCLE_SECONDS)%STEADY_CYCLE_SECONDS;
 return offset+1+Math.min(31,Math.floor(phase/STEADY_CYCLE_SECONDS*STEADY_WALK_FRAMES+1e-8));
}
