export type HapticCue='melee'|'armor'|'select'|'start'|'confirm'|'shot'|'damage'|'kill'|'pickup'|'dash'|'success'|'caught'|'decoy'|'spot'|'switch'|'claim'|'coin';
export const HAPTIC_POLICY:Record<HapticCue,{gap:number;priority:number}>={
 melee:{gap:170,priority:1},armor:{gap:200,priority:1},select:{gap:100,priority:0},start:{gap:250,priority:1},confirm:{gap:350,priority:3},shot:{gap:140,priority:0},damage:{gap:180,priority:4},kill:{gap:180,priority:2},
 pickup:{gap:350,priority:2},dash:{gap:250,priority:1},success:{gap:700,priority:5},caught:{gap:700,priority:5},decoy:{gap:250,priority:1},spot:{gap:1500,priority:2},switch:{gap:250,priority:2},claim:{gap:700,priority:3},coin:{gap:110,priority:1},
};
/** Suppress duplicate bursts and let damage interrupt light weapon/UI taps. */
export function createHapticGate(){let last=-Infinity,priority=-1;const times:Partial<Record<HapticCue,number>>={};return (cue:HapticCue,now:number)=>{const p=HAPTIC_POLICY[cue];if(now-(times[cue]??-Infinity)<p.gap||now-last<90&&p.priority<=priority)return false;times[cue]=now;last=now;priority=p.priority;return true;};}
