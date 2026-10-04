import test from 'node:test';import assert from 'node:assert/strict';
import {playImpact} from '../src/audio/impact-feedback';
import {musicIndex,musicGain} from '../src/audio/music';
import selection from '../assets/music-spy-v2/selection.json';
test('confirmed impact starts its audio and edge glow together, after the seek',async()=>{
 const calls:string[]=[];let finish!:()=>void;const player={volume:1,loop:false,pause(){},play(){calls.push('sound');},seekTo(){calls.push('seek');return new Promise<void>(r=>{finish=r;});}};
 const pending=playImpact(player,()=>true,()=>calls.push('glow'));assert.deepEqual(calls,['seek']);finish();await pending;assert.deepEqual(calls,['seek','sound','glow']);
});
test('impact completed after pause or restart cannot replay a sound or flash',async()=>{
 const calls:string[]=[];await playImpact({volume:1,loop:false,pause(){},play(){calls.push('sound');},async seekTo(){}},()=>false,()=>calls.push('glow'));assert.deepEqual(calls,[]);
});
test('all campaign levels rotate only the new spy cues with safe fallbacks',()=>{
 const chosen=Array.from({length:200},(_,i)=>selection.tracks[musicIndex(i+1)]);
 assert.deepEqual([...new Set(chosen)],['vault-infiltration','midnight-pursuit']);
 assert(chosen.every((track,i)=>i===0||track!==chosen[i-1]));
 for(const n of [NaN,Infinity,-4,0])assert.equal(musicIndex(n),0);
 assert.equal(musicIndex(99),0);assert.equal(musicIndex(100),1);assert.equal(musicIndex(1.9),0);
});
test('spy music ducks during alarms and keeps gain in bounds',()=>{
 assert(musicGain(.65,true)<musicGain(.65,false));
 assert.equal(musicGain(0,false),0);assert.equal(musicGain(NaN,false),0);
 assert.equal(musicGain(-1,true),0);assert.equal(musicGain(2,false),.34);
});
