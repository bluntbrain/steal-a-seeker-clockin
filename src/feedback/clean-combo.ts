// Presentation only. Never included in GameState, replay inputs or scoring.
export type ComboSnapshot={run:string;tick:number;kills:number;damage:number;active:boolean};
export type CleanCombo={previous:ComboSnapshot;count:number;lastKill:number};
export const COMBO_WINDOW_TICKS=120;
export function updateCleanCombo(before:CleanCombo|undefined,next:ComboSnapshot):CleanCombo{
 const reset={previous:next,count:0,lastKill:-COMBO_WINDOW_TICKS-1};
 if(!before||!next.active||!before.previous.active||next.run!==before.previous.run||
  next.tick<before.previous.tick||next.kills<before.previous.kills||next.damage!==before.previous.damage)return reset;
 const delta=next.kills-before.previous.kills;
 const count=next.tick-before.lastKill<=COMBO_WINDOW_TICKS?before.count:0;
 return {previous:next,count:delta>0?count+delta:count,lastKill:delta>0?next.tick:before.lastKill};
}
export function comboLabel(count:number){return count===2?'DOUBLE TAKEDOWN':count===3?'TRIPLE TAKEDOWN':`CLEAN SWEEP ×${count}`;}
