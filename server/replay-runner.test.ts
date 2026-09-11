import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyReplayInWorker,ReplayBusyError} from './replay-runner';
const input={version:1,chunks:[{x:0,y:0,buttons:0,ticks:10}]};
test('isolated replay returns computed state and enforces worker capacity',async()=>{
 const results=await Promise.allSettled([verifyReplayInWorker('practice',input),verifyReplayInWorker('practice',input),verifyReplayInWorker('practice',input)]);
 for(const result of results.slice(0,2)){assert.equal(result.status,'fulfilled');if(result.status==='fulfilled'){assert.equal(result.value.status,'incomplete');assert.equal(result.value.ticks,10);}}
 assert.equal(results[2]!.status,'rejected');if(results[2]!.status==='rejected')assert(results[2]!.reason instanceof ReplayBusyError);
});
test('a timed-out worker releases capacity for the next replay',async()=>{
 await assert.rejects(verifyReplayInWorker('practice',input,{timeoutMs:1}),/time budget/);const result=await verifyReplayInWorker('practice',input);assert.equal(result.ticks,10);
});
