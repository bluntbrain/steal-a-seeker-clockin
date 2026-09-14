import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {getBase58Decoder} from '@solana/kit';
import {paymentTransaction} from '../src/commerce/payment';
import {submitPayment} from '../src/wallet/submitPayment';
import type {Order} from '../shared/commerce';
function fixture(){const pub=()=>getBase58Decoder().decode(randomBytes(32)),wallet=pub(),recipient=pub(),original=paymentTransaction({cluster:'solana:devnet',wallet,recipient,source:wallet,destination:recipient,currency:'SOL',amount:'10000000',reference:pub(),memo:'seeker-order:fixture',payment:{id:'fixture',blockhash:pub(),lastValidBlockHeight:'250',contextSlot:'1000'}} as Order),bytes=Uint8Array.from({length:64},()=>1),signed={...original,signatures:{[wallet]:bytes}} as unknown as typeof original;return {original,signed,signature:getBase58Decoder().decode(bytes)};}
const response=(result:unknown)=>new Response(JSON.stringify({jsonrpc:'2.0',id:1,result}));
test('app sends the same signed bytes on transport retry and waits for confirmation',async()=>{
 const f=fixture(),calls:any[]=[],stages:string[]=[];let sends=0;
 const fetcher=(async(_url,init)=>{const body=JSON.parse(init!.body as string);calls.push(body);if(body.method==='sendTransaction'){if(++sends===1)throw new Error('Network request failed');return response(f.signature);}return response({value:[{confirmationStatus:'confirmed',err:null}]});}) as typeof fetch;
 await submitPayment(f.original,f.signed,{rpcUrl:'https://example.invalid',minContextSlot:1000n,fetcher,wait:async()=>{},log:s=>stages.push(s)});
 assert.equal(calls[0].params[0],calls[1].params[0]);assert.equal(calls[0].params[1].skipPreflight,false);assert.equal(sends,2);assert.ok(stages.includes('payment.rpc.confirmed'));
});
test('preflight insufficient funds stops submission retries with a useful error',async()=>{
 const f=fixture();let calls=0;await assert.rejects(submitPayment(f.original,f.signed,{rpcUrl:'https://example.invalid',minContextSlot:1000n,wait:async()=>{},fetcher:(async()=>{calls++;return new Response(JSON.stringify({error:{code:-32002,message:'InsufficientFundsForFee'}}));}) as typeof fetch}),/Not enough funds/);assert.equal(calls,1);
});
test('a changed payment or missing signature is rejected before any broadcast',async()=>{
 const f=fixture(),message=Uint8Array.from(f.signed.messageBytes);message[0]=message[0]!^1;let calls=0;const options={rpcUrl:'https://example.invalid',minContextSlot:1n,wait:async()=>{},fetcher:(async()=>{calls++;throw Error('must not send');}) as typeof fetch};
 await assert.rejects(submitPayment(f.original,{...f.signed,messageBytes:message} as never,options),/changed the payment/);
 await assert.rejects(submitPayment(f.original,f.original,options),/signed payment/);assert.equal(calls,0);
});
test('execution failure is not reported as confirmation; dropped sends retain signature for reconciliation',async()=>{
 const f=fixture();const fetcher=(async(_u,init)=>{const b=JSON.parse(init!.body as string);return b.method==='sendTransaction'?response(f.signature):response({value:[{confirmationStatus:'confirmed',err:{InstructionError:[0,1]}}]});}) as typeof fetch;
 await assert.rejects(submitPayment(f.original,f.signed,{rpcUrl:'https://example.invalid',minContextSlot:1n,wait:async()=>{},fetcher}),/transaction failed on Solana/);
 const stages:string[]=[];const dropped=(async(_u,init)=>{const b=JSON.parse(init!.body as string);if(b.method==='sendTransaction')throw Error('connection lost');return response(b.method==='getBlockHeight'?251:{value:[null]});}) as typeof fetch;
 const bytes=await submitPayment(f.original,f.signed,{rpcUrl:'https://example.invalid',minContextSlot:1n,wait:async()=>{},fetcher:dropped,log:s=>stages.push(s)});assert.equal(getBase58Decoder().decode(bytes),f.signature);assert.ok(stages.includes('payment.rpc.submission-uncertain'));
});
