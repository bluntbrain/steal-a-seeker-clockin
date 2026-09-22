import test from 'node:test';
import assert from 'node:assert/strict';
import {isDuplicateTap,tapReady,TAP_INTERVAL_MS,type PendingTap} from '../src/controls/tapQueue';
test('rapid burst stays bounded, keeps newest intent and drains without a backlog',()=>{
 let pending:PendingTap|null=null,elapsed=TAP_INTERVAL_MS,processed:PendingTap[]=[];
 // 100 taps in a second, sampled by a 100 Hz test frame clock.
 for(let t=0;t<1000;t+=10){pending={x:t/100,y:5,at:t};elapsed+=10;if(tapReady(pending,elapsed)){processed.push(pending);pending=null;elapsed=0;}}
 assert(processed.length<=14);assert(processed.length>=12);
 for(let i=1;i<processed.length;i++)assert(processed[i]!.at-processed[i-1]!.at>=TAP_INTERVAL_MS);
 elapsed+=TAP_INTERVAL_MS;if(tapReady(pending,elapsed)){processed.push(pending!);pending=null;}
 assert.equal(processed.at(-1)?.at,990);assert.equal(pending,null);
});
test('ordinary first tap is ready immediately; only short duplicate taps are ignored',()=>{
 const tap={x:3,y:4,at:1000};assert(tapReady(tap,TAP_INTERVAL_MS));assert(!tapReady(null,1000));
 assert(isDuplicateTap(tap,{x:3.02,y:4.01,at:1050}));assert(!isDuplicateTap(tap,{x:5,y:4,at:1050}));assert(!isDuplicateTap(tap,{x:3,y:4,at:1300}));assert(!isDuplicateTap(null,tap));
});
