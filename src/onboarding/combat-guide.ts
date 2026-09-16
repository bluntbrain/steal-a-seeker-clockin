import type {GameState} from '../game/simulation';
import type {CombatCommand} from '../game/combat';
export const GUIDE_STEPS=[
 {text:'Tap here to move',x:2.1,y:15.3,kind:'move'},
 {text:'Tap behind the crate',x:2.1,y:12.2,kind:'move'},
 {text:'Tap the robot to shoot',x:3,y:11,kind:'attack',target:0},
 {text:'Tap here. Watch for the red aim line.',x:6.8,y:10.7,kind:'move'},
 {text:'Red line? Tap away!',x:6.8,y:14.9,kind:'move'},
 {text:'Tap the guard. Stop to shoot.',x:9,y:10,kind:'attack',target:1},
 {text:'Tap the Seeker to take it',x:9.8,y:3.4,kind:'phone'},
 {text:'Alarm! Tap the exit',x:9.8,y:18.1,kind:'exit'},
] as const;
export function guideAllows(step:number,command:CombatCommand){'worklet';const g=GUIDE_STEPS[step];if(!g)return true;return command.kind===g.kind&&(g.kind==='attack'?command.target===g.target:Math.hypot(command.x-g.x,command.y-g.y)<1.1);}
export function guideDone(step:number,s:GameState){const g=GUIDE_STEPS[step];if(!g)return false;if(step===3)return Math.hypot(s.x-g.x,s.y-g.y)<.2&&s.guards[1]?.gunPhase==='aim';if(g.kind==='attack')return (s.guards[g.target]?.hp??1)<=0;if(g.kind==='phone')return s.carrying;if(g.kind==='exit')return s.status==='won';return Math.hypot(s.x-g.x,s.y-g.y)<.2;}
