import {initialState,type Input} from './simulation';
import {recordStep} from './recording';
import type {MissionId} from './level';
import type {Replay,ReplayChunk} from '../../shared/replay';
export function parityRun(mission:MissionId,replay:Replay){
 'worklet';const state=initialState(mission),recorded:ReplayChunk[]=[];let dash=0,tool=0;
 for(const chunk of replay.chunks)for(let n=0;n<chunk.ticks;n++){if(chunk.buttons&2)dash++;if(chunk.buttons&4)tool++;const input:Input={x:chunk.x/127,y:chunk.y/127,interact:!!(chunk.buttons&1),dash,tool};recordStep(state,input,recorded);}
 const round=(n:number)=>Math.round(n*1e6)/1e6;
 return {status:state.status,ticks:state.ticks,score:state.score,battery:state.battery,delivered:state.delivered,spotted:state.spotted,dashes:state.dashes,decoysLeft:state.decoysLeft,x:round(state.x),y:round(state.y),power:state.power,activations:state.activations,guards:state.guards.map(g=>({x:round(g.x),y:round(g.y),mode:g.mode,exposure:round(g.exposure)})),recordedTicks:recorded.reduce((n,c)=>n+c.ticks,0)};
}
