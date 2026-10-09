import type {GameState} from '../game/simulation';
import {FOOTSTEP_STRIDE} from '../audio/footsteps';
import {attackPose} from './melee-presentation';

type CourierPoseState = Pick<GameState, 'x'|'y'|'px'|'py'|'walked'|'carrying'|'ticks'|'status'|'combat'>;
/** Render from actual travel, not requested velocity (which can point into a wall). */
export function courierMoving(s: Pick<GameState,'x'|'y'|'px'|'py'|'status'>) {
 'worklet';
 return s.status==='playing' && Math.hypot(s.x-s.px,s.y-s.py)>.0001;
}
export function courierTopFrame(s: CourierPoseState,bakedCarry=false) {
 'worklet';
 const melee=s.combat?.melee;
 const offset=bakedCarry&&s.carrying?8:0;
 if(melee&&s.status==='playing') {const pose=attackPose(s.ticks-melee.started);if(pose>=0)return offset+4+pose;}
 if(!courierMoving(s))return offset|| (s.carrying?7:0);
 // Both loaded and empty-handed couriers use the same distance-driven gait.
 const phase=Math.floor(s.walked*2/FOOTSTEP_STRIDE+1e-8)%4;
 return offset+(phase===0?1:phase===2?3:2);
}
/** Loaded v3 frames contain the phone. Older costume sheets still use the edition prop while moving. */
export function courierNeedsPhone(carrying:boolean,frame:number) {
 'worklet';
 return carrying&&frame!==7&&frame<8;
}
export function courierPhoneHand(frame:number) {
 'worklet';
 // Follow the left hand's swing in the generated walk poses, in local world units.
 return {x:-.48,y:frame===1?-.32:frame===3?-.1:0};
}
