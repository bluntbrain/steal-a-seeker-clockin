import {initialState,step,type Input,type GameState} from './simulation';
import {appendReplay,quantizeAxis,type Replay,type ReplayChunk} from '../../shared/replay';
import type {LevelDefinition,MissionId} from './level';
export function recordStep(state:GameState,input:Input,chunks:ReplayChunk[]){
 'worklet';if(state.status!=='playing')return;
 if(state.combat){const command=input.command&&input.command.seq>state.combat.commandSeen?{...input.command}:undefined;if(command)chunks.push({x:0,y:0,buttons:0,ticks:1,command});else{const last=chunks[chunks.length-1];if(last&&!last.command&&last.ticks<65535)last.ticks++;else chunks.push({x:0,y:0,buttons:0,ticks:1});}step(state,{...input,x:0,y:0});return;}
 const x=quantizeAxis(input.x),y=quantizeAxis(input.y),buttons=Number(input.interact)+(input.dash!==state.dashSeen?2:0)+((input.tool??0)!==state.toolSeen?4:0);
 appendReplay(chunks,x,y,buttons);step(state,{...input,x:x/127,y:y/127});
}

/** rebuilds the state a recorded replay reaches; the same stepping the verifier uses, so a local restore equals the server result */
export function replayState(mission:MissionId,replay:Replay,definition?:LevelDefinition){
 'worklet';
 const state=initialState(mission,definition);let dash=0,tool=0;
 if(!!state.combat!==(replay.version===2))throw new Error('Saved run uses different controls.');
 for(const c of replay.chunks)for(let n=0;n<c.ticks;n++){
  if(state.status!=='playing')throw new Error('Saved run continues after its result.');
  if(c.buttons&2)dash++;if(c.buttons&4)tool++;
  step(state,{x:c.x/127,y:c.y/127,interact:!!(c.buttons&1),dash,tool,command:c.command});
 }
 return state;
}
