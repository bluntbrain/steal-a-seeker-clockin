// the haptic vocabulary: which cue may play when. textures live in haptic-patterns.ts, delivery in useHaptics.ts
export type HapticCue='tapMove'|'tapTarget'|'blocked'|'select'|'start'|'confirm'|'error'|'melee'|'armor'|'kill'|'stealthKill'|'bossKill'|'damage'|'pickup'|'exitTick'|'switch'|'spotted'|'suspicion'|'success'|'caught'|'claim'|'coin'|'dash'|'decoy';
export const HAPTIC_POLICY:Record<HapticCue,{gap:number;priority:number}>={
 tapMove:{gap:60,priority:1},tapTarget:{gap:60,priority:3},blocked:{gap:250,priority:3},select:{gap:90,priority:1},start:{gap:250,priority:5},confirm:{gap:350,priority:7},error:{gap:350,priority:7},
 melee:{gap:120,priority:4},armor:{gap:200,priority:4},kill:{gap:180,priority:9},stealthKill:{gap:180,priority:9},bossKill:{gap:400,priority:11},damage:{gap:180,priority:10},pickup:{gap:350,priority:6},exitTick:{gap:150,priority:2},switch:{gap:250,priority:5},
 spotted:{gap:1500,priority:8},suspicion:{gap:1200,priority:2},success:{gap:700,priority:12},caught:{gap:700,priority:13},claim:{gap:700,priority:6},coin:{gap:110,priority:1},dash:{gap:250,priority:0},decoy:{gap:250,priority:0},
};
/** reduced effects keeps the cues that carry game state the player must feel, and drops texture */
export const ESSENTIAL_CUES:ReadonlySet<HapticCue>=new Set<HapticCue>(['kill','stealthKill','bossKill','damage','spotted','success','caught','pickup','confirm','error','start']);
/** patterns run as waveforms and may be cancelled by a higher cue; the rest are single pulses */
export const PATTERN_PRIORITY=7;
/** one cue per gap; within 90 ms of a different cue only a higher one may follow. a repeated cue (fast taps) is
 * governed by its own gap alone */
export function createHapticGate(){
 let last=-Infinity,priority=-1,lastCue:HapticCue|null=null;const times:Partial<Record<HapticCue,number>>={};
 return (cue:HapticCue,now:number)=>{
  const p=HAPTIC_POLICY[cue];
  if(now-(times[cue]??-Infinity)<p.gap)return false;
  if(cue!==lastCue&&now-last<90&&p.priority<=priority)return false;
  times[cue]=now;last=now;priority=p.priority;lastCue=cue;return true;
 };
}
