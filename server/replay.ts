import {z} from 'zod';
import {CAMPAIGN_IDS,getLevel,type LevelDefinition,type MissionId} from '../src/game/level';
import {initialState,step} from '../src/game/simulation';
export const replayInput=z.object({version:z.literal(1),chunks:z.array(z.object({x:z.number().int().min(-127).max(127),y:z.number().int().min(-127).max(127),buttons:z.number().int().min(0).max(7),ticks:z.number().int().min(1).max(14400)}).strict()).min(1).max(14400)}).strict();
export type ReplayResult={status:'won'|'caught'|'timeout'|'incomplete';score:number;ticks:number;seconds:number;battery:number;delivered:number;spotted:boolean};
export function verifyReplay(mission:MissionId,input:unknown,definition?:LevelDefinition):ReplayResult{
 if(!CAMPAIGN_IDS.includes(mission))throw new Error('Unknown ranked mission.');
 const replay=replayInput.parse(input),limit=(definition??getLevel(mission)).hardLimitSeconds*30,state=initialState(mission,definition);let count=0,dash=0,tool=0;
 for(const chunk of replay.chunks){
  if(count+chunk.ticks>limit)throw new Error('Replay exceeds the mission time limit.');
  if((chunk.buttons&6)!==0&&chunk.ticks!==1)throw new Error('An action edge must occupy one tick.');
  for(let n=0;n<chunk.ticks;n++){
   if(state.status!=='playing')throw new Error('Replay continues after a terminal result.');
   if(chunk.buttons&2)dash++;if(chunk.buttons&4)tool++;
   step(state,{x:chunk.x/127,y:chunk.y/127,interact:!!(chunk.buttons&1),dash,tool});count++;
  }
 }
 return {status:state.status==='playing'?'incomplete':state.status,score:state.score,ticks:state.ticks,seconds:state.elapsed,battery:state.battery,delivered:state.delivered,spotted:state.spotted};
}
