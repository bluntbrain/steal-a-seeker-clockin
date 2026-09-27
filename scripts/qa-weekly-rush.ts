import {initialState,idleInput} from '../src/game/simulation';
import {combatTap,type CombatCommand} from '../src/game/combat';
import {recordStep} from '../src/game/recording';
import type {LevelDefinition,Point} from '../src/game/level';
import type {ReplayChunk} from '../shared/replay';
// Additional ordinary-tap strategies for armored weekly encounters. A frontal
// auto-attack bot is not a valid test of a mission designed around flanking.
export function solveWeeklyRush(l:LevelDefinition){
 for(const wait of [0,30,60,90])for(const outward of [0,1.2,10.8])for(const returning of [0,1.2,10.8]){
  const s=initialState(l.mission,l),chunks:ReplayChunk[]=[];let seq=0,phase=-1,index=0,points:Point[]=[];
  for(let frame=0;frame<l.hardLimitSeconds*30&&s.status==='playing';frame++){
   let command:CombatCommand|undefined;
   if(frame>=wait&&frame%6===0){const current=s.delivered*2+Number(s.carrying),dest=s.carrying?{x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2}:l.targets?.[s.delivered]??l.phone;
    if(current!==phase){phase=current;index=0;const lane=s.carrying?returning:outward;points=lane?[{x:lane,y:s.y},{x:lane,y:dest.y},dest]:[dest];}
    while(index<points.length-1&&Math.hypot(s.x-points[index]!.x,s.y-points[index]!.y)<.35)index++;
    const p=points[index]!;command=combatTap(s,p.x,p.y,++seq);
   }
   recordStep(s,{...idleInput(),command},chunks);
  }
  if(process.env.QA_TRACE)console.log({wait,outward,returning,status:s.status,x:s.x,y:s.y,hp:s.combat!.hp,delivered:s.delivered,carrying:s.carrying,elapsed:s.elapsed,order:s.combat!.order});
  if(s.status==='won')return {strategy:`rush:${wait}:${outward}:${returning}`,ticks:s.ticks,hp:s.combat!.hp,kills:s.combat!.kills,score:s.score,replay:{version:2 as const,chunks}};
 }
 return null;
}
