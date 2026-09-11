import {step,type Input,type GameState} from './simulation';
import {appendReplay,quantizeAxis,type ReplayChunk} from '../../shared/replay';
export function recordStep(state:GameState,input:Input,chunks:ReplayChunk[]){
 'worklet';if(state.status!=='playing')return;
 const x=quantizeAxis(input.x),y=quantizeAxis(input.y),buttons=Number(input.interact)+(input.dash!==state.dashSeen?2:0)+((input.tool??0)!==state.toolSeen?4:0);
 appendReplay(chunks,x,y,buttons);step(state,{...input,x:x/127,y:y/127});
}
