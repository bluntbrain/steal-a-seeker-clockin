import {getLevel} from '../game/level';
import {nearPhone,type GameState} from '../game/simulation';
export function coachText(state:GameState):string {
 if(state.status!=='playing'||state.mission!=='practice')return '';
 if(state.carrying)return 'Phone tracked! Use cover and reach EXIT. DASH spends 20 charge.';
 if(nearPhone(state))return 'Release the stick. Hold TAKE on the left until the phone lifts.';
 const spawn=getLevel(state.mission).spawn;
 if(Math.hypot(state.x-spawn.x,state.y-spawn.y)<1&&state.elapsed<12)return 'Drag the RIGHT stick to move. Powers are on the LEFT.';
 return 'Reach the glowing phone. Stay behind cover and outside the amber cone.';
}
