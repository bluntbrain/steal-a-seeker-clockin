import {step,type Input,type GameState} from './simulation';
import {appendReplay,quantizeAxis,type ReplayChunk} from '../../shared/replay';
export function recordStep(state:GameState,input:Input,chunks:ReplayChunk[]){
 'worklet';if(state.status!=='playing')return;
 if(state.combat){const command=input.command&&input.command.seq>state.combat.commandSeen?{...input.command}:undefined;if(command)chunks.push({x:0,y:0,buttons:0,ticks:1,command});else{const last=chunks[chunks.length-1];if(last&&!last.command&&last.ticks<65535)last.ticks++;else chunks.push({x:0,y:0,buttons:0,ticks:1});}step(state,{...input,x:0,y:0});return;}
 const x=quantizeAxis(input.x),y=quantizeAxis(input.y),buttons=Number(input.interact)+(input.dash!==state.dashSeen?2:0)+((input.tool??0)!==state.toolSeen?4:0);
 appendReplay(chunks,x,y,buttons);step(state,{...input,x:x/127,y:y/127});
}
