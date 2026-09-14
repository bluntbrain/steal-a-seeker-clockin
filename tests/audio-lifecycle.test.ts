import {test} from 'node:test';
import assert from 'node:assert/strict';
import {protectAudioPlayer,type GameAudioPlayer} from '../src/audio/safePlayer';
import {turntableFrame} from '../src/components/phoneRotation';
import {playerCopy} from '../src/game/playerCopy';
function fixture(overrides:Partial<GameAudioPlayer>={}){return {volume:1,loop:false,pause(){},play(){},async seekTo(){},...overrides};}
test('released native audio cannot throw through cleanup or volume updates',()=>{
 let logs=0,calls=0;const audio=protectAudioPlayer(fixture({pause(){calls++;throw new Error('Cannot use shared object that was already released');}}),()=>logs++);
 assert.doesNotThrow(()=>{audio.pause();audio.pause();audio.volume=.5;audio.play();});assert.equal(logs,1);assert.equal(calls,1);
});
test('late seek callback cannot play after unmount',async()=>{
 let resolve!:()=>void,plays=0;const audio=protectAudioPlayer(fixture({seekTo:()=>new Promise<void>(r=>{resolve=r;}),play(){plays++;}}),()=>assert.fail());
 const pending=audio.seekTo(0).then(()=>audio.play());audio.deactivate();resolve();await pending;assert.equal(plays,0);
});
test('a rejected native media operation is contained',async()=>{
 let logs=0;const audio=protectAudioPlayer(fixture({async seekTo(){throw new Error('released');}}),()=>logs++);await audio.seekTo(0);audio.play();assert.equal(logs,1);
});
test('turntable wraps both drag directions and preserves opposite views',()=>{assert.equal(turntableFrame(0,-14),15);assert.equal(turntableFrame(15,14),0);assert.equal(turntableFrame(0,112),8);assert.equal(turntableFrame(0,224),0);});
test('older challenge copy is translated without changing manifests',()=>{assert.equal(playerCopy('No decoys on this contract.'),'No distractions on this contract.');assert.equal(playerCopy('DECOY'),'DISTRACT');});
