import test from 'node:test';
import assert from 'node:assert/strict';
import {HAPTIC_TEXTURES,textureDuration,PREVIEW_CUES} from '../src/feedback/haptic-patterns';
import {HAPTIC_POLICY,type HapticCue} from '../src/feedback/haptic-policy';
test('every cue has a texture, waveforms alternate wait and buzz, and nothing holds the motor longer than half a second',()=>{
 for(const cue of Object.keys(HAPTIC_POLICY) as HapticCue[]){
  const t=HAPTIC_TEXTURES[cue];assert(t,cue);
  if(t.kind==='wave'){assert.equal(t.pattern[0],0,`${cue} starts at once`);assert(t.pattern.length%2===0&&t.pattern.length>=4,`${cue} is a real pattern`);for(const ms of t.pattern)assert(ms>=0&&ms<=250,`${cue} step ${ms}`);}
  assert(textureDuration(t)<=500,`${cue} ${textureDuration(t)} ms`);
 }
});
test('the three tiers are told apart: ticks are light pulses, kills are heavier patterns, a boss kill outlasts a kill',()=>{
 for(const cue of ['tapMove','select','exitTick','suspicion'] as const){const t=HAPTIC_TEXTURES[cue];assert(t.kind==='pulse'&&t.style==='light',cue);}
 const kill=HAPTIC_TEXTURES.kill,boss=HAPTIC_TEXTURES.bossKill,stealth=HAPTIC_TEXTURES.stealthKill;
 assert(kill.kind==='wave'&&boss.kind==='wave'&&stealth.kind==='wave');
 assert(textureDuration(boss)>textureDuration(kill));
 assert(stealth.pattern[1]!<stealth.pattern[3]!,'a stealth kill starts soft and lands hard');
 assert(kill.pattern[1]!>kill.pattern[3]!,'a kill is a thud then a tick');
 assert.equal(HAPTIC_TEXTURES.caught.kind,'wave');assert(textureDuration(HAPTIC_TEXTURES.caught)>textureDuration(HAPTIC_TEXTURES.damage));
});
test('the settings preview covers a tick, a hit and a takedown',()=>{
 assert.deepEqual(PREVIEW_CUES.map(p=>p.cue),['tapMove','melee','kill','damage']);
});
