import type {LevelDefinition} from '../game/level';
/** Seconds until the next change (closing when open, opening when closed). */
export function exitWindowSeconds(window:NonNullable<LevelDefinition['exitWindow']>,elapsed:number){
 const phase=((elapsed+window.phase)%window.period+window.period)%window.period;
 return Math.max(0,Math.ceil((phase<window.openSeconds?window.openSeconds:window.period)-phase));
}
