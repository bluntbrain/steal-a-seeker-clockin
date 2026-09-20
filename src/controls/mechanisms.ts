import type {LevelDefinition} from '../game/level';
import type {GameState} from '../game/simulation';
export function gateSwitchIndex(level:LevelDefinition,gateIndex:number){
 'worklet';const gate=level.gates?.[gateIndex];if(!gate?.mode)return -1;
 return (level.switches??[]).findIndex(p=>gate.mode==='power'?p.kind==='power':p.kind==='relay'&&(p.channel??0)===(gate.relay??0));
}
export function mechanismHint(state:GameState,level:LevelDefinition){
 const closed=(level.gates??[]).findIndex((_,i)=>state.closedGates[i]&&gateSwitchIndex(level,i)>=0);
 if(closed>=0)return state.combat?.order?.kind==='switch'?'Moving to the switch…':'Tap the ⏻ switch to open the gate';
 if(level.gates?.some((_,i)=>gateSwitchIndex(level,i)>=0)&&state.activations>0&&!state.carrying)return 'Gate open. Take the glowing phone';
 return undefined;
}
