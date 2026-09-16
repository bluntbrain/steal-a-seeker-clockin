import {combatLevel} from '../src/game/combat-levels';
import {z} from 'zod';
import {CAMPAIGN_IDS,getLevel,type LevelDefinition,type MissionId} from '../src/game/level';
import {initialState,step} from '../src/game/simulation';
const command=z.object({seq:z.number().int().min(1).max(14400),kind:z.enum(['move','attack','phone','exit','switch','stop']),x:z.number().min(0).max(24),y:z.number().min(0).max(40),target:z.number().int().min(-1).max(63)}).strict();
export const replayInput=z.object({version:z.union([z.literal(1),z.literal(2)]),chunks:z.array(z.object({x:z.number().int().min(-127).max(127),y:z.number().int().min(-127).max(127),buttons:z.number().int().min(0).max(7),command:command.optional(),ticks:z.number().int().min(1).max(14400)}).strict()).min(1).max(14400)}).strict();
export type ReplayResult={status:'won'|'caught'|'timeout'|'incomplete';score:number;ticks:number;seconds:number;battery:number;delivered:number;spotted:boolean;hp?:number;shots?:number;kills?:number;damageTaken?:number};
export function verifyReplay(mission:MissionId,input:unknown,definition?:LevelDefinition):ReplayResult{
 if(!CAMPAIGN_IDS.includes(mission))throw new Error('Unknown ranked mission.');
 const replay=replayInput.parse(input),level=definition??(replay.version===2?combatLevel(mission):getLevel(mission)),limit=level.hardLimitSeconds*30,state=initialState(mission,level);let count=0,dash=0,tool=0,commandSeq=0;
 if(!!level.combat!==(replay.version===2))throw new Error('Replay does not match mission combat version.');
 for(const chunk of replay.chunks){
  if(replay.version===1&&chunk.command)throw new Error('Legacy replay cannot contain combat commands.');
  if(replay.version===2&&(chunk.buttons||chunk.x||chunk.y))throw new Error('Combat requires command input.');
  if(chunk.command){if(chunk.ticks!==1||chunk.command.seq<=commandSeq)throw new Error('Invalid command sequence.');commandSeq=chunk.command.seq;}
  if(count+chunk.ticks>limit)throw new Error('Replay exceeds the mission time limit.');
  if((chunk.buttons&6)!==0&&chunk.ticks!==1)throw new Error('An action edge must occupy one tick.');
  for(let n=0;n<chunk.ticks;n++){
   if(state.status!=='playing')throw new Error('Replay continues after a terminal result.');
   if(chunk.buttons&2)dash++;if(chunk.buttons&4)tool++;
   step(state,{x:chunk.x/127,y:chunk.y/127,interact:!!(chunk.buttons&1),dash,tool,command:chunk.command});count++;
  }
 }
 return {status:state.status==='playing'?'incomplete':state.status,score:state.score,ticks:state.ticks,seconds:state.elapsed,battery:state.battery,delivered:state.delivered,spotted:state.spotted,...(state.combat?{hp:state.combat.hp,shots:state.combat.shots,kills:state.combat.kills,damageTaken:state.combat.damageTaken}:{})};
}
