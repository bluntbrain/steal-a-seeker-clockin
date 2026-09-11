import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_IDS} from '../src/game/level';
import {fixtureReplay} from './fixtures/replay';
import {verifyReplay} from '../server/replay';
for(const mission of CAMPAIGN_IDS)test(`${mission}: quantized recording and verifier agree on the full route`,()=>{
 const {state,replay}=fixtureReplay(mission),verified=verifyReplay(mission,replay);assert.equal(state.status,'won');assert.equal(verified.status,state.status);assert.equal(verified.ticks,state.ticks);assert.equal(verified.score,state.score);assert.equal(verified.battery,state.battery);assert.equal(verified.delivered,state.delivered);assert.equal(verified.spotted,state.spotted);
});
