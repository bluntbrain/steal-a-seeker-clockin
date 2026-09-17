import test from 'node:test';import assert from 'node:assert/strict';
import {playImpact} from '../src/audio/impact-feedback';
import {musicIndex} from '../src/audio/music';
test('confirmed impact starts its audio and edge glow together, after the seek',async()=>{
 const calls:string[]=[];let finish!:()=>void;const player={volume:1,loop:false,pause(){},play(){calls.push('sound');},seekTo(){calls.push('seek');return new Promise<void>(r=>{finish=r;});}};
 const pending=playImpact(player,()=>true,()=>calls.push('glow'));assert.deepEqual(calls,['seek']);finish();await pending;assert.deepEqual(calls,['seek','sound','glow']);
});
test('impact completed after pause or restart cannot replay a sound or flash',async()=>{
 const calls:string[]=[];await playImpact({volume:1,loop:false,pause(){},play(){calls.push('sound');},async seekTo(){}},()=>false,()=>calls.push('glow'));assert.deepEqual(calls,[]);
});
test('music has one slot per mission, safe fallbacks, and weekly district reuse',()=>{
 assert.deepEqual(Array.from({length:12},(_,i)=>musicIndex(i+1)),Array.from({length:12},(_,i)=>i));
 assert.deepEqual([1,5,9].map(musicIndex),[0,4,8]);assert.equal(musicIndex(NaN),0);assert.equal(musicIndex(99),11);
});
