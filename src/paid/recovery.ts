import type {PaidEntry} from '../../shared/paid';
import type {Replay} from '../../shared/replay';
import rules from '../../shared/rules-manifest.json';
import {getLevel,type LevelDefinition,type MissionId} from '../game/level';
import {initialState,step} from '../game/simulation';

export function assertPaidRules(entry:PaidEntry){
 const m=entry.manifest;
 if(m.rulesHash!==rules.rulesHash||m.levelHash!==rules.levelHashes[m.mission as keyof typeof rules.levelHashes]||m.seed!==0||m.loadout!=='standard'||m.hardLimitSeconds!==getLevel(m.mission).hardLimitSeconds)throw new Error('This entry uses different game rules. Update the app, or refund it before starting.');
}
export function replayTicks(replay:Replay,limit:number){
 if(replay?.version!==1||!Array.isArray(replay.chunks)||replay.chunks.length>limit)throw new Error('Saved run data could not be read. It has been kept for recovery.');
 let ticks=0;
 for(const c of replay.chunks){
  if(!c||![c.x,c.y,c.buttons,c.ticks].every(Number.isInteger)||Math.abs(c.x)>127||Math.abs(c.y)>127||c.buttons<0||c.buttons>7||c.ticks<1||((c.buttons&6)!==0&&c.ticks!==1))throw new Error('Saved run inputs are invalid.');
  ticks+=c.ticks;if(ticks>limit)throw new Error('Saved run exceeds the mission limit.');
 }
 return ticks;
}
// Recorder chunks are canonical. Only the final repeated-input chunk may grow.
export function isReplayPrefix(a:Replay,b:Replay){
 return a.chunks.length<=b.chunks.length&&a.chunks.every((c,i)=>{const n=b.chunks[i];return !!n&&c.x===n.x&&c.y===n.y&&c.buttons===n.buttons&&(i===a.chunks.length-1?c.ticks<=n.ticks:c.ticks===n.ticks);});
}
export function restorePaidState(mission:MissionId,replay:Replay,definition?:LevelDefinition){
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

export type PaidPlay={entry:PaidEntry;replay:Replay};
