import {test} from 'node:test';
import assert from 'node:assert/strict';
import {walletLog,walletFailure,walletReport,walletStep,walletErrorMessage} from '../src/wallet/diagnostics';

test('diagnostics discard unknown fields and never serialize arbitrary SDK errors',()=>{
 const secret='sensitive-auth-payload-do-not-log';
 walletLog('test.safe',{status:401,token:secret,body:secret,accounts:2} as never);
 walletFailure('test.failure',{code:-32000,message:secret,stack:secret,data:{auth_token:secret}});
 assert.equal(walletReport().includes(secret),false);
 assert.match(walletReport(),/"code":-32000/);
 assert.match(walletReport(),/"accounts":2/);
});
test('network failure is not reported as user cancellation',()=>{
 assert.match(walletErrorMessage(new Error('Network request failed')),/connection/);
 assert.match(walletErrorMessage({code:-3}),/declined/);
});
test('steps retain the original result and error without serializing them',async()=>{
 const result={token:'private-result'};
 assert.equal(await walletStep('test.success',async()=>result),result);
 const original=new Error('private-error');
 await assert.rejects(walletStep('test.error',async()=>{throw original;}),e=>e===original);
 assert.equal(walletReport().includes('private-result'),false);
 assert.equal(walletReport().includes('private-error'),false);
});
test('diagnostic buffer stays bounded',()=>{
 for(let i=0;i<220;i++)walletLog('test.bounded');
 assert.equal(walletReport().split('\n').length,201);
});
