import test from 'node:test';
import assert from 'node:assert/strict';
import {pricingFailure} from '../src/commerce/pricing-state';
test('unsupported server products do not endlessly retry exchange rates',()=>{
 for(const status of [400,404]){const failure=pricingFailure({status});assert(failure.unavailable);assert.doesNotMatch(failure.message,/Tap to retry/);}
});
test('rate and connection outages still offer retry without leaking diagnostics',()=>{
 for(const error of [{status:503},{status:429},new Error('private provider address')]){const failure=pricingFailure(error);assert.equal(failure.unavailable,false);assert.match(failure.message,/Tap to retry/);assert.doesNotMatch(failure.message,/private/);}
});
