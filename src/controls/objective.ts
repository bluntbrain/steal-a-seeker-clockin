import type {GameState} from '../game/simulation';
export function phoneObjective(state:Pick<GameState,'delivered'|'carrying'>,total:number){
 if(state.delivered>=total)return 'All phones secured';
 if(state.carrying)return total>1?`Return phone ${state.delivered+1} of ${total} to EXIT`:'Return to EXIT';
 return total>1?`${state.delivered>0?'One secured. ':''}Take phone ${state.delivered+1} of ${total}`:'Take the glowing phone';
}
