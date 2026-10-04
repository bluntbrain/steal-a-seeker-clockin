import test from 'node:test';import assert from 'node:assert/strict';
import {playImpact} from '../src/audio/impact-feedback';
import {musicIndex} from '../src/audio/music';
import selection from '../assets/music-v1/selection.json';
test('confirmed impact starts its audio and edge glow together, after the seek',async()=>{
 const calls:string[]=[];let finish!:()=>void;const player={volume:1,loop:false,pause(){},play(){calls.push('sound');},seekTo(){calls.push('seek');return new Promise<void>(r=>{finish=r;});}};
 const pending=playImpact(player,()=>true,()=>calls.push('glow'));assert.deepEqual(calls,['seek']);finish();await pending;assert.deepEqual(calls,['seek','sound','glow']);
});
test('impact completed after pause or restart cannot replay a sound or flash',async()=>{
 const calls:string[]=[];await playImpact({volume:1,loop:false,pause(){},play(){calls.push('sound');},async seekTo(){}},()=>false,()=>calls.push('glow'));assert.deepEqual(calls,[]);
});
test('campaign music uses only the five approved tracks with safe fallbacks',()=>{
 const chosen=Array.from({length:12},(_,i)=>selection.tracks[musicIndex(i+1)]);
 assert.deepEqual([...new Set(chosen)].sort((a,b)=>a!-b!),[2,3,4,10,12]);
 assert(chosen.every((track,i)=>i===0||track!==chosen[i-1]),'Adjacent missions should change music');
 assert.equal(chosen[11],12,'Finish with Last Seeker');
 assert.deepEqual([1,5,9].map(n=>selection.tracks[musicIndex(n)]),[2,12,10]);
 for(const n of [NaN,Infinity,-4,0])assert.equal(musicIndex(n),0);
 assert.equal(musicIndex(99),4);assert.equal(musicIndex(1.9),0);
});
