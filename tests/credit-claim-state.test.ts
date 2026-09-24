import test from 'node:test';
import assert from 'node:assert/strict';
import {creditClaimState} from '../src/campaign/credit-claim-state';

test('verified replay with zero extra credits continues immediately',()=>{
 const state=creditClaimState({amount:0,saved:true});
 assert.equal(state.waiting,false);assert.equal(state.label,'Continue');assert.equal(state.canContinueLater,false);
});
test('an improved replay still offers its actual additional credits',()=>{
 assert.equal(creditClaimState({amount:5,saved:true}).label,'Claim 5 credits');
});
test('failed sync cannot trap a durably saved run or claim unverified credits',()=>{
 const state=creditClaimState({amount:null,saved:true,message:'Server unavailable'});
 assert.equal(state.label,'Retry sync');assert.equal(state.canContinueLater,true);assert.equal(state.waiting,false);
});
test('a slow verifier allows continuing only after the replay was saved',()=>{
 assert.equal(creditClaimState({amount:null,saved:true}).waiting,true);
 assert.equal(creditClaimState({amount:null,saved:true}).canContinueLater,false);
 assert.equal(creditClaimState({amount:null,saved:true},false,false,true).canContinueLater,true);
 assert.equal(creditClaimState({amount:null},false,false,true).canContinueLater,false);
});
test('a failed local save must be retried before leaving',()=>{
 const state=creditClaimState({amount:null,saved:false,message:'Could not save'});
 assert.equal(state.label,'Retry save');assert.equal(state.canContinueLater,false);
});
test('wallet connection stays available without blocking departure from a saved win',()=>{
 const state=creditClaimState({amount:null,saved:true},true);
 assert.equal(state.label,'Connect wallet to claim');assert.equal(state.canContinueLater,true);
 assert.equal(creditClaimState({amount:null,saved:true},true,true).canContinueLater,false);
});
