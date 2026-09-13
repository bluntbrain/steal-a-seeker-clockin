import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signInWithFallback,unpackSignedMessage} from '../src/wallet/signInFallback';
const account={address:'wallet-a',addressBase64:'encoded'},payload={domain:'example.com',address:account.address,nonce:'12345678'};
test('uses standard sign-in directly when supported',async()=>{
 const result={account,signedMessage:new Uint8Array([1]),signature:new Uint8Array(64)};
 assert.equal(await signInWithFallback(payload,async()=>result,()=>account,async()=>{throw Error('should not sign again');},()=>assert.fail()),result);
});
test('missing optional result falls back to signing the same challenge',async()=>{
 let calls=0;
 const result=await signInWithFallback(payload,async()=>{throw Error('Sign in result not retrieved.');},()=>account,async(a,message)=>{calls++;assert.equal(a,account);assert.match(new TextDecoder().decode(message),/Nonce: 12345678/);return [new Uint8Array([...message,...new Uint8Array(64).fill(9)])];},()=>{});
 assert.equal(calls,1);assert.equal(result.signature.length,64);assert.equal(result.signature[0],9);
});
test('does not retry declines, transport errors, or account changes',async()=>{
 for(const error of [new Error('User declined'),new Error('Network request failed')])await assert.rejects(signInWithFallback(payload,async()=>{throw error;},()=>account,async()=>{assert.fail('must not request signature');},()=>assert.fail()),e=>e===error);
 await assert.rejects(signInWithFallback(payload,async()=>{throw Error('Sign in result not retrieved.');},()=>({...account,address:'different'}),async()=>{assert.fail();},()=>assert.fail()),/Wallet changed/);
});
test('rejects modified, missing and truncated signed messages',()=>{
 assert.throws(()=>unpackSignedMessage(new Uint8Array([1]),undefined));
 assert.throws(()=>unpackSignedMessage(new Uint8Array([1]),new Uint8Array(64)));
 assert.throws(()=>unpackSignedMessage(new Uint8Array([1]),new Uint8Array(65)));
});
