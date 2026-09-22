import test from 'node:test';
import assert from 'node:assert/strict';
import {createOutbox} from '../src/campaign/outbox';
type Run={mission:string;replay:number};
function setup(send:(token:string,item:Run)=>Promise<{credits:number}>){const disk=new Map<string,Run[]>();let failWrite=false;const queue=createOutbox({read:async(w:string)=>disk.get(w)??[],write:async(w:string,items:Run[])=>{if(failWrite)throw Error('Disk full');disk.set(w,items);},send});return {queue,disk,fail:()=>{failWrite=true;}};}
test('foreground win and background importer share one receipt, including after remount',async()=>{
 let calls=0,resolve!:()=>void;const wait=new Promise<void>(r=>resolve=r),{queue,disk}=setup(async()=>{calls++;await wait;return {credits:60};}),run={mission:'01',replay:1};
 await queue.enqueue('wallet',run);const a=queue.submit('wallet','token',run),b=queue.submit('wallet','token',run);resolve();assert.deepEqual(await a,{credits:60});assert.deepEqual(await b,{credits:60});assert.equal(calls,1);assert.deepEqual(disk.get('wallet'),[]);
 await queue.enqueue('wallet',run);assert.equal((await queue.submit('wallet','token',run)).credits,60);assert.equal(calls,1);assert.deepEqual(disk.get('wallet'),[]);
});
test('failed upload stays durable and a later retry succeeds',async()=>{let attempts=0;const {queue,disk}=setup(async()=>{if(++attempts===1)throw Error('Offline');return {credits:50};}),run={mission:'01',replay:1};await queue.enqueue('wallet',run);await assert.rejects(queue.submit('wallet','token',run));assert.equal(disk.get('wallet')?.length,1);assert.equal((await queue.submit('wallet','token',run)).credits,50);assert.deepEqual(disk.get('wallet'),[]);});
test('old upload cannot erase a newer win on the same mission',async()=>{let resolve!:()=>void;const wait=new Promise<void>(r=>resolve=r),{queue,disk}=setup(async()=>{await wait;return {credits:50};});const old={mission:'01',replay:1},next={mission:'01',replay:2};await queue.enqueue('wallet',old);const upload=queue.submit('wallet','token',old);await queue.enqueue('wallet',next);resolve();await upload;assert.deepEqual(disk.get('wallet'),[next]);});
test('disk cleanup failure does not discard the confirmed award',async()=>{const {queue,fail}=setup(async()=>({credits:60})),run={mission:'01',replay:1};await queue.enqueue('wallet',run);fail();assert.equal((await queue.submit('wallet','token',run)).credits,60);});
test('failed historical replay does not block submitting the current win',async()=>{const {queue,disk}=setup(async(_,run)=>{if(run.replay===1)throw Error('Old rules');return {credits:55};});await queue.enqueue('wallet',{mission:'01',replay:1});const fresh={mission:'02',replay:2};await queue.enqueue('wallet',fresh);assert.equal((await queue.submit('wallet','token',fresh)).credits,55);assert.deepEqual(disk.get('wallet'),[{mission:'01',replay:1}]);});
test('uploads and receipts never cross wallet/session boundaries',async()=>{let calls=0;const {queue}=setup(async()=>({credits:++calls})),run={mission:'01',replay:1};assert.equal((await queue.submit('a','token-a',run)).credits,1);assert.equal((await queue.submit('b','token-b',run)).credits,2);assert.equal((await queue.submit('a','new-token',run)).credits,3);});

test('connecting during a guest import shares the award and clears both queues',async()=>{
 let calls=0,resolve!:()=>void;const wait=new Promise<void>(r=>resolve=r),{queue,disk}=setup(async()=>{calls++;await wait;return {credits:60};}),run={mission:'01',replay:99};
 await queue.enqueue('guest',run);await queue.enqueue('wallet',run);
 const importing=queue.submit('guest','same-session',run),claim=queue.submit('wallet','same-session',run);
 resolve();assert.deepEqual(await importing,{credits:60});assert.deepEqual(await claim,{credits:60});assert.equal(calls,1);
 assert.deepEqual(disk.get('guest'),[]);assert.deepEqual(disk.get('wallet'),[]);
 await queue.enqueue('wallet',run);assert.equal((await queue.submit('wallet','same-session',run)).credits,60);assert.equal(calls,1);assert.deepEqual(disk.get('wallet'),[]);
});
