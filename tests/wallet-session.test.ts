import test from 'node:test';import assert from 'node:assert/strict';
import {exclusiveWalletSession,freshPaymentAuthorization} from '../src/wallet/session-guard';
test('payment drops a stale authorization token while preserving chain and identity',()=>{
 const original={auth_token:'old-session',chain:'solana:mainnet',identity:{uri:'https://stealaseeker.bluntbrain.com'}};
 const fresh=freshPaymentAuthorization(original);assert.equal('auth_token' in fresh,false);assert.equal(fresh.chain,original.chain);assert.deepEqual(fresh.identity,original.identity);assert.equal(original.auth_token,'old-session');
});
test('wallet sessions serialize and a failed session does not block the next one',async()=>{
 const events:string[]=[];let release!:()=>void;const gate=new Promise<void>(r=>release=r);
 const first=exclusiveWalletSession(async()=>{events.push('first');await gate;events.push('closed');throw Error('cancelled');});const rejected=assert.rejects(first,/cancelled/);
 const second=exclusiveWalletSession(async()=>{events.push('second');return 7;});await new Promise(r=>setTimeout(r,1));assert.deepEqual(events,['first']);release();await rejected;assert.equal(await second,7);assert.deepEqual(events,['first','closed','second']);
});
