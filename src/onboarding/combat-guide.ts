import type {GameState} from '../game/simulation';
import type {CombatCommand} from '../game/combat';
export const GUIDE_STEPS=[
 {text:'Tap here to move',x:2.1,y:15.3,kind:'move'},
 {text:'Tap behind the crate',x:2.1,y:12.2,kind:'move'},
 {text:'Tap the drone to shoot. Then take the Seeker and escape using cover.',x:3,y:11,kind:'attack',target:0},
] as const;
export function guideAllows(step:number,command:CombatCommand){'worklet';const g=GUIDE_STEPS[step];if(!g)return true;return command.kind===g.kind&&(g.kind==='attack'?command.target===g.target:Math.hypot(command.x-g.x,command.y-g.y)<1.1);}
// The teaching ring is a generous touch target. Once accepted, move to its
// actual waypoint; otherwise a valid off-centre tap can never satisfy guideDone.
export function guideCommand(step:number,command:CombatCommand):CombatCommand|null{
 'worklet';const g=GUIDE_STEPS[step];if(!g)return command;
 const candidate=g.kind==='move'&&command.kind==='stop'?{...command,kind:'move' as const}:command;
 if(!guideAllows(step,candidate))return null;
 return g.kind==='move'?{...candidate,x:g.x,y:g.y}:candidate;
}
export function guideTarget(step:number,s:GameState){
 const g=GUIDE_STEPS[step];if(!g)return null;
 if(g.kind==='attack')return s.guards[g.target]??g;
 return g;
}
export function guideDone(step:number,s:GameState){const g=GUIDE_STEPS[step];if(!g)return false;if(g.kind==='attack')return (s.guards[g.target]?.hp??1)<=0;return Math.hypot(s.x-g.x,s.y-g.y)<.2;}
