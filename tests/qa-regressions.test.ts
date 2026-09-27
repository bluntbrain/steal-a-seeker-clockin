import test from 'node:test';
import assert from 'node:assert/strict';
import {gridCardWidth} from '../src/components/grid-layout';
import {errorKind,walletErrorMessage} from '../src/wallet/diagnostics';
import {joinWalletConnection} from '../src/wallet/session-guard';
import {watchPhoneFrame} from '../src/components/phone-filament/frame-readiness';

test('three shop cards fit measured content even at fractional Android density',()=>{
 for(const density of [1,2,2.625,2.75,3])for(const width of [296,336,360,387.4285714285714,406,430]){
  const card=gridCardWidth(width,density);
  assert(card*3+16<=width,`${width} at ${density} overflows and wraps the third card`);
  assert(width-(card*3+16)<3/density+1e-8,'No empty column or large unused strip');
 }
});
test('native missing-wallet transport errors receive specific recovery copy',()=>{
 for(const error of [{code:'ERROR_WALLET_NOT_FOUND',message:'Failed to bind client'},new Error('Found no installed wallet that supports the mobile wallet protocol.'),new Error('No wallet found')]){
  assert.equal(errorKind(error),'wallet-unavailable');
  assert.match(walletErrorMessage(error),/Install and unlock Phantom/);
  assert.match(walletErrorMessage(error),/return here and retry/);
 }
 assert.equal(errorKind({code:'ERROR_ASSOCIATION_CANCELLED',message:'Association failed'}),'declined');
 assert.equal(errorKind(new Error('Network request failed')),'connection');
});
test('rapid Connect requests share one transport and return the same account',async()=>{
 let count=0,release!:(value:{address:string})=>void;
 const run=()=>{count++;return new Promise<{address:string}>(resolve=>{release=resolve;});};
 const attempts=Array.from({length:20},()=>joinWalletConnection(run));
 await new Promise(resolve=>setImmediate(resolve));assert.equal(count,1);
 const account={address:'test-account'};release(account);
 assert((await Promise.all(attempts)).every(value=>value===account));
 assert.equal(await joinWalletConnection(async()=>{count++;return account;}),account);assert.equal(count,2);
});
test('a cancelled or missing-wallet connection permits an explicit retry',async()=>{
 const error={code:'ERROR_WALLET_NOT_FOUND'};let calls=0;
 const first=joinWalletConnection(async()=>{calls++;throw error;});
 const second=joinWalletConnection(async()=>{calls++;});
 const outcomes=await Promise.allSettled([first,second]);
 assert.equal(calls,1);assert(outcomes.every(value=>value.status==='rejected'&&value.reason===error));
 assert.equal(await joinWalletConnection(async()=>42),42);
});

test('phone controls wait for actual model geometry and stop probing once visible',async t=>{
 t.mock.timers.enable({apis:['setInterval']});
 let picked:{id:number}|undefined,ready=0,calls=0;
 const stop=watchPhoneFrame({getViewport:()=>({width:1080,height:1200}),pickEntity:async(x,y)=>{calls++;assert.equal(x,180);assert.equal(y,200);return picked;}},new Set([7]),3,()=>ready++);
 t.mock.timers.tick(250);await new Promise(r=>setImmediate(r));assert.equal(ready,0);
 picked={id:99};t.mock.timers.tick(250);await new Promise(r=>setImmediate(r));assert.equal(ready,0);
 picked={id:7};t.mock.timers.tick(250);await new Promise(r=>setImmediate(r));assert.equal(ready,1);
 t.mock.timers.tick(1000);await new Promise(r=>setImmediate(r));assert.equal(calls,3);stop();
});

test('phone rendering probes never overlap or reveal a closed viewer',async t=>{
 t.mock.timers.enable({apis:['setInterval']});
 let calls=0,ready=0,resolve!:(entity:{id:number})=>void;
 const stop=watchPhoneFrame({getViewport:()=>({width:400,height:600}),pickEntity:()=>{calls++;return new Promise(r=>{resolve=r;});}},new Set([7]),1,()=>ready++);
 t.mock.timers.tick(2000);assert.equal(calls,1);stop();resolve({id:7});
 await new Promise(r=>setImmediate(r));assert.equal(ready,0);
});

test('a released native phone view cannot cause an unhandled probe rejection',async t=>{
 t.mock.timers.enable({apis:['setInterval']});let ready=0;
 const stop=watchPhoneFrame({getViewport:()=>{throw new Error('released view');},pickEntity:async()=>({id:7})},new Set([7]),1,()=>ready++);
 t.mock.timers.tick(250);await new Promise(r=>setImmediate(r));assert.equal(ready,0);stop();
});
