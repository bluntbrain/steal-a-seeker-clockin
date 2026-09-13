import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicKey,generateKeyPairSync,randomBytes,verify} from 'node:crypto';
import {address,generateKeyPairSigner,getAddressEncoder,getBase58Decoder,getCompiledTransactionMessageDecoder,getTransactionDecoder} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {DevnetReturnChain,loadReturnSignerJson} from './return-chain';
import {DEVNET_GENESIS,TOKEN_PROGRAM,MEMO_PROGRAM} from './chain';
import type {ReturnBinding,SignedReturn} from './returns';
const b58=(b:Uint8Array)=>getBase58Decoder().decode(b),pub=()=>b58(randomBytes(32));
test('sealed devnet signer validates bytes and treasury without leaking malformed input',async()=>{
 const keys=generateKeyPairSync('ed25519'),secret=keys.privateKey.export({format:'der',type:'pkcs8'}).subarray(-32),publicBytes=keys.publicKey.export({format:'der',type:'spki'}).subarray(-32);
 const json=JSON.stringify([...secret,...publicBytes]),expected=b58(publicBytes);
 assert.equal((await loadReturnSignerJson(json,expected)).address,expected);
 await assert.rejects(loadReturnSignerJson(json,pub()),/does not match/);
 for(const input of ['PRIVATE-MARKER',JSON.stringify(['PRIVATE-MARKER']),JSON.stringify(Array(64).fill(256))]){
  await assert.rejects(loadReturnSignerJson(input,expected),e=>e instanceof Error&&e.message==='Invalid dedicated devnet signer configuration.');
 }
});
async function fixture(){
 const signer=await generateKeyPairSigner(),mint=pub(),wallet=pub(),source=pub();
 const [destination]=await findAssociatedTokenPda({owner:address(wallet),mint:address(mint),tokenProgram:address(TOKEN_PROGRAM)});
 const binding:ReturnBinding={id:crypto.randomUUID(),mint,wallet,treasury:signer.address,source,destination,amount:'10000000',decimals:6,reference:pub(),memo:'seeker-return:test'};
 const calls:{method:string;params:unknown[]}[]=[],overrides=new Map<string,unknown|(()=>unknown)>();
 let sentSignature='';
 const call=async<T>(method:string,params:unknown[]=[]):Promise<T>=>{
  calls.push({method,params});if(overrides.has(method)){const value=overrides.get(method);return (typeof value==='function'?(value as ()=>unknown)():value) as T;}
  const info=(type:string,info:unknown)=>({context:{slot:200},value:{owner:TOKEN_PROGRAM,data:{parsed:{type,info}}}});
  const values:Record<string,unknown>={getGenesisHash:DEVNET_GENESIS,getBalance:{context:{slot:200},value:100000000},getLatestBlockhash:{context:{slot:200},value:{blockhash:pub(),lastValidBlockHeight:500}},getFeeForMessage:{context:{slot:200},value:5000},getMinimumBalanceForRentExemption:2039280,simulateTransaction:{context:{slot:200},value:{err:null}},getBlockHeight:100,getSignatureStatuses:{context:{slot:600},value:[null]},getFirstAvailableBlock:0,getSignaturesForAddress:[]};
  if(method==='getAccountInfo')return (params[0]===mint?info('mint',{decimals:6,isInitialized:true}):info('account',{owner:signer.address,mint,state:'initialized',tokenAmount:{amount:'100000000',decimals:6}})) as T;
  if(method==='sendTransaction'){const tx=getTransactionDecoder().decode(Buffer.from(params[0] as string,'base64'));sentSignature=b58(new Uint8Array(tx.signatures[signer.address]!));return sentSignature as T;}
  if(!(method in values))throw new Error('Unexpected RPC '+method);return values[method] as T;
 };
 return {signer,binding,calls,overrides,chain:new DevnetReturnChain({mint,treasury:signer.address,source,decimals:6,rpcUrl:'https://unused.invalid'},signer,call)};
}
function finalized(binding:ReturnBinding,signed:SignedReturn){
 const tx=getTransactionDecoder().decode(Buffer.from(signed.wire,'base64')),message=getCompiledTransactionMessageDecoder().decode(tx.messageBytes),keys=message.staticAccounts;
 if(message.version!==0)throw new Error('Expected a v0 return transaction');
 const balance=(owner:string,account:string,amount:string)=>({accountIndex:keys.indexOf(address(account)),mint:binding.mint,owner,uiTokenAmount:{amount,decimals:6}});
 return {slot:600,blockTime:0,transaction:{signatures:[signed.signature],message:{header:{numRequiredSignatures:message.header.numSignerAccounts},accountKeys:keys,instructions:message.instructions.map(i=>({programIdIndex:i.programAddressIndex,accounts:i.accountIndices??[],data:b58(new Uint8Array(i.data??[]))}))}},meta:{err:null,preTokenBalances:[balance(binding.treasury,binding.source,'10000000')],postTokenBalances:[balance(binding.treasury,binding.source,'0'),balance(binding.wallet,binding.destination,binding.amount)]}};
}
test('return preparation creates a genuinely signed ATA/TransferChecked/memo transaction without sending it',async()=>{
 const f=await fixture(),signed=await f.chain.prepare(f.binding);assert(!f.calls.some(c=>c.method==='sendTransaction'));
 const tx=getTransactionDecoder().decode(Buffer.from(signed.wire,'base64')),message=getCompiledTransactionMessageDecoder().decode(tx.messageBytes);
 if(message.version!==0)throw new Error('Expected a v0 return transaction');
 const publicKey=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(getAddressEncoder().encode(f.signer.address))]),type:'spki',format:'der'});
 assert(verify(null,Buffer.from(tx.messageBytes),publicKey,Buffer.from(tx.signatures[f.signer.address]!)));assert.equal(message.instructions.length,3);
 const transfer=message.instructions[1]!,data=Buffer.from(transfer.data!);assert.equal(message.staticAccounts[transfer.programAddressIndex],TOKEN_PROGRAM);assert.equal(data[0],12);assert.equal(data.readBigUInt64LE(1),10000000n);assert.equal(data[9],6);
 const accounts=transfer.accountIndices!.map(i=>message.staticAccounts[i]);assert.deepEqual(accounts,[f.binding.source,f.binding.mint,f.binding.destination,f.binding.treasury,f.binding.reference]);
 const memo=message.instructions[2]!;assert.equal(message.staticAccounts[memo.programAddressIndex],MEMO_PROGRAM);assert.equal(Buffer.from(memo.data!).toString(),f.binding.memo);
 await f.chain.broadcast(signed);const send=f.calls.find(c=>c.method==='sendTransaction')!;assert.equal(send.params[0],signed.wire);assert.equal((send.params[1] as any).skipPreflight,false);
});
test('return signer refuses other networks, mismatched destination and excessive or failed preflight costs',async()=>{
 const f=await fixture();f.overrides.set('getGenesisHash','mainnet');await assert.rejects(f.chain.prepare(f.binding),/restricted to devnet/);assert(!f.calls.some(c=>c.method==='sendTransaction'));
 f.overrides.delete('getGenesisHash');await assert.rejects(f.chain.prepare({...f.binding,destination:pub()}),/does not belong/);
 f.overrides.set('getFeeForMessage',{value:10001});await assert.rejects(f.chain.prepare(f.binding),/fee budget/);
 f.overrides.delete('getFeeForMessage');f.overrides.set('simulateTransaction',{value:{err:{InstructionError:[0,'Custom']}}});await assert.rejects(f.chain.prepare(f.binding),/preflight failed/);
});
test('return verification matches finalized transfer including a newly created recipient token account',async()=>{
 const f=await fixture(),signed=await f.chain.prepare(f.binding),value=finalized(f.binding,signed);
 f.overrides.set('getSignatureStatuses',{context:{slot:600},value:[{slot:600,err:null,confirmationStatus:'finalized'}]});f.overrides.set('getTransaction',value);
 assert.deepEqual(await f.chain.inspect(f.binding,signed),{state:'settled',slot:600});
 value.meta.postTokenBalances[1]!.owner=pub();assert.equal((await f.chain.inspect(f.binding,signed)).state,'review');
 f.overrides.set('getTransaction',null);await assert.rejects(f.chain.inspect(f.binding,signed),/unavailable/);
});
test('return expiry requires elapsed lifetime, covered RPC history and a second status check',async()=>{
 const f=await fixture(),signed=await f.chain.prepare(f.binding);assert.equal((await f.chain.inspect(f.binding,signed)).state,'pending');
 f.overrides.set('getBlockHeight',501);assert.equal((await f.chain.inspect(f.binding,signed)).state,'expired');
 assert(f.calls.filter(c=>c.method==='getSignatureStatuses').every(c=>(c.params[1] as any).searchTransactionHistory===true));
 f.overrides.set('getFirstAvailableBlock',201);await assert.rejects(f.chain.inspect(f.binding,signed),/archival/);
 f.overrides.delete('getFirstAvailableBlock');f.overrides.set('getSignaturesForAddress',[{signature:signed.signature,err:null}]);await assert.rejects(f.chain.inspect(f.binding,signed),/further finalized/);
 f.overrides.set('getSignaturesForAddress',[{signature:pub(),err:null}]);await assert.rejects(f.chain.inspect(f.binding,signed),/further finalized/);
 f.overrides.set('getSignaturesForAddress',[{signature:pub()}]);await assert.rejects(f.chain.inspect(f.binding,signed),/RPC error field/);
});
test('non-finalized or malformed status cannot authorize a replacement return',async()=>{
 const f=await fixture(),signed=await f.chain.prepare(f.binding);f.overrides.set('getBlockHeight',501);
 f.overrides.set('getSignatureStatuses',{context:{slot:600},value:[{slot:550,err:null,confirmationStatus:'confirmed'}]});assert.equal((await f.chain.inspect(f.binding,signed)).state,'pending');
 f.overrides.set('getSignatureStatuses',{context:{slot:600},value:[{slot:550,confirmationStatus:'finalized'}]});await assert.rejects(f.chain.inspect(f.binding,signed),/RPC error field/);
 f.overrides.set('getSignatureStatuses',{context:{slot:600},value:[{slot:550,err:{InstructionError:[1,'Custom']},confirmationStatus:'finalized'}]});assert.equal((await f.chain.inspect(f.binding,signed)).state,'failed');
});
test('stale balance and status changing during the expiry scan leave settlement unresolved',async()=>{
 const f=await fixture();await assert.rejects(f.chain.available(201),/older than/);const signed=await f.chain.prepare(f.binding);f.overrides.set('getBlockHeight',501);
 let reads=0;f.overrides.set('getSignatureStatuses',()=>({context:{slot:600},value:++reads===1?[null]:[{slot:550,err:null,confirmationStatus:'finalized'}]}));
 await assert.rejects(f.chain.inspect(f.binding,signed),/changed during/);
});
