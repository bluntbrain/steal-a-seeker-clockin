import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyReplay} from './replay';
import {fixtureReplay} from '../tests/fixtures/replay';
function successfulReplay(){const result=fixtureReplay('practice');assert.equal(result.state.status,'won');return result;}
test('quantized input replay reproduces completion and computed score without a client score field',()=>{
 const {state,replay}=successfulReplay(),result=verifyReplay('practice',replay);assert.equal(result.status,'won');assert.equal(result.score,state.score);assert.equal(result.ticks,state.ticks);assert.equal(result.battery,state.battery);assert.equal(result.delivered,1);
 assert.throws(()=>verifyReplay('practice',{...replay,score:999999}));
 const altered=structuredClone(replay);for(const c of altered.chunks)c.buttons=0;assert.notEqual(verifyReplay('practice',altered).status,'won');
});
test('verifier rejects impossible inputs, oversized runs, repeated edges and post-completion ticks',()=>{
 const valid={version:1,chunks:[{x:0,y:0,buttons:0,ticks:1}]};assert.equal(verifyReplay('practice',valid).status,'incomplete');
 for(const c of [{x:128,y:0,buttons:0,ticks:1},{x:0,y:0,buttons:8,ticks:1},{x:0,y:0,buttons:2,ticks:2},{x:0,y:0,buttons:0,ticks:14400},{x:NaN,y:0,buttons:0,ticks:1}])assert.throws(()=>verifyReplay('practice',{version:1,chunks:[c]}));
 const {replay}=successfulReplay();replay.chunks.push({x:0,y:0,buttons:0,ticks:1});assert.throws(()=>verifyReplay('practice',replay),/terminal/);
});
