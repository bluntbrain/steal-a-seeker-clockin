// textures for every cue: a single pulse at a chosen strength, a second pulse after a delay, or a waveform the
// motor plays at its default strength. waveforms are [wait, on, wait, on, ...] in milliseconds
import type {HapticCue} from './haptic-policy';
export type Pulse='light'|'medium'|'heavy';
export type HapticTexture={kind:'pulse';style:Pulse;follow?:{after:number;style:Pulse}}|{kind:'wave';pattern:readonly number[]};
export const HAPTIC_TEXTURES:Record<HapticCue,HapticTexture>={
 tapMove:{kind:'pulse',style:'light'},
 tapTarget:{kind:'pulse',style:'medium'},
 blocked:{kind:'wave',pattern:[0,18,40,18]},
 select:{kind:'pulse',style:'light'},
 start:{kind:'pulse',style:'heavy'},
 confirm:{kind:'wave',pattern:[0,30,50,45]},
 error:{kind:'wave',pattern:[0,35,45,35]},
 melee:{kind:'pulse',style:'medium'},
 armor:{kind:'wave',pattern:[0,25,35,45]},
 // a kill is a thud and a tick; a stealth kill starts soft and lands hard; a boss falls in three rising beats
 kill:{kind:'wave',pattern:[0,45,55,22]},
 stealthKill:{kind:'wave',pattern:[0,28,70,60]},
 bossKill:{kind:'wave',pattern:[0,55,65,55,65,95]},
 damage:{kind:'wave',pattern:[0,45,45,45]},
 pickup:{kind:'pulse',style:'heavy',follow:{after:70,style:'light'}},
 exitTick:{kind:'pulse',style:'light'},
 switch:{kind:'pulse',style:'medium'},
 spotted:{kind:'wave',pattern:[0,24,55,24]},
 suspicion:{kind:'pulse',style:'light'},
 success:{kind:'wave',pattern:[0,30,65,45,65,85]},
 caught:{kind:'wave',pattern:[0,110,70,210]},
 claim:{kind:'pulse',style:'heavy'},
 coin:{kind:'pulse',style:'light'},
 dash:{kind:'pulse',style:'light'},
 decoy:{kind:'pulse',style:'light'},
};
/** total time a texture occupies the motor, used by tests and the settings preview spacing */
export function textureDuration(texture:HapticTexture){
 if(texture.kind==='wave')return texture.pattern.reduce((a,b)=>a+b,0);
 return 60+(texture.follow?texture.follow.after+50:0);
}
/** the settings preview plays one cue per tier so the feel can be judged on the device */
export const PREVIEW_CUES:readonly {cue:HapticCue;label:string}[]=[{cue:'tapMove',label:'Tap'},{cue:'melee',label:'Hit'},{cue:'kill',label:'Takedown'},{cue:'damage',label:'Damage'}];
