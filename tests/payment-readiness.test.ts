import {paymentDiagnostic,unavailableMessage} from '../server/payment-errors';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DevnetChain,rpc,RpcError,TOKEN_PROGRAM} from '../server/chain';
import {GENESIS} from '../shared/network';

test('RPC retries a throttled read once and preserves sanitized failure diagnostics',async()=>{
 let calls=0;
 const fetcher=(async()=>++calls===1?new Response('',{status:429}):Response.json({result:'ok'})) as typeof fetch;
 assert.equal(await rpc('https://provider.invalid/private-key','getGenesisHash',[],fetcher),'ok');assert.equal(calls,2);
 await assert.rejects(rpc('https://provider.invalid/secret','getGenesisHash',[],(async()=>Response.json({error:{code:-32602,message:'secret'}})) as typeof fetch),error=>error instanceof RpcError&&error.code===-32602&&!error.message.includes('secret'));
});
test('RPC retry is bounded and never rebroadcasts a write',async()=>{
 let calls=0;const fetcher=(async()=>{calls++;return new Response('',{status:429});}) as typeof fetch;
 await assert.rejects(rpc('https://rpc.invalid','getLatestBlockhash',[],fetcher),/429/);assert.equal(calls,2);
 calls=0;await assert.rejects(rpc('https://rpc.invalid','sendTransaction',[],fetcher),/429/);assert.equal(calls,1);
});
test('readiness coalesces callers, caches briefly, and rechecks treasury after expiry',async t=>{
 let calls=0,now=1000,treasuryReady=true;
 t.mock.method(globalThis,'fetch',async(_url:string,init:RequestInit)=>{
  calls++;const {method,params}=JSON.parse(init.body as string);
  const result=method==='getGenesisHash'?GENESIS['solana:mainnet']:{value:params[0]==='mint'?{owner:TOKEN_PROGRAM,data:{parsed:{type:'mint',info:{decimals:6}}}}:treasuryReady?{owner:TOKEN_PROGRAM,data:{parsed:{info:{owner:'treasury',mint:'mint',state:'initialized'}}}}:null};
  return Response.json({result});
 });
 const chain=new DevnetChain({rpcUrl:'https://rpc.invalid',mint:'mint',recipient:'treasury',destination:'ata',decimals:6,cluster:'solana:mainnet'},()=>now);
 await Promise.all([chain.ready(),chain.ready(),chain.ready()]);assert.equal(calls,3);
 await chain.ready();assert.equal(calls,3);
 now+=15001;treasuryReady=false;await assert.rejects(chain.ready(),/treasury token account/);
 const failedCalls=calls;await assert.rejects(chain.ready(),/treasury token account/);assert(calls>failedCalls,'A failed check must not be cached as healthy');
});
test('readiness refuses an RPC for the wrong chain',async t=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json({result:GENESIS['solana:devnet']}));
 const chain=new DevnetChain({rpcUrl:'https://rpc.invalid',mint:'mint',recipient:'treasury',destination:'ata',decimals:6,cluster:'solana:mainnet'});
 await assert.rejects(chain.ready(),/network does not match/);
});

test('payment diagnostics never include provider credentials or arbitrary exception messages',async()=>{
 assert.deepEqual(paymentDiagnostic(new RpcError('getSignaturesForAddress',429)),{kind:'rpc',method:'getSignaturesForAddress',code:429});
 assert(!JSON.stringify(paymentDiagnostic(new Error('https://provider.invalid?api-key=secret'))).includes('secret'));
 assert.match(unavailableMessage('/orders/:id/prepare'),/No new payment was requested/);
 assert.doesNotMatch(unavailableMessage('/orders'),/will be reconciled/);
 assert.match(unavailableMessage('/orders/:id/transaction'),/Do not send another payment/);
 assert.match(unavailableMessage('/orders/:id/reconcile'),/Check payment/);
});
