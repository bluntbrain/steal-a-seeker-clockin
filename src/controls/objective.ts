import type {GameState} from '../game/simulation';
// left: guards still standing while the kill-all rule holds the final exit shut
export function phoneObjective(state:Pick<GameState,'delivered'|'carrying'>,total:number,left=0){
 if(state.delivered>=total)return 'All phones secured';
 if(state.carrying&&left>0&&state.delivered+1>=total)return `Take down ${left} more guard${left===1?'':'s'}`;
 if(state.carrying)return total>1?`Return phone ${state.delivered+1} of ${total} to EXIT`:'Return to EXIT';
 return total>1?`${state.delivered>0?'One secured. ':''}Take phone ${state.delivered+1} of ${total}`:'Take the glowing phone';
}
