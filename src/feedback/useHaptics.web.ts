import type {HapticCue} from './haptic-policy';
// Browsers have no reliable equivalent to Android's native haptic primitives.
const silent=(_cue:HapticCue)=>{};
export function useHaptics(){return silent;}
