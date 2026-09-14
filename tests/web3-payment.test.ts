import test from 'node:test';
import assert from 'node:assert/strict';
import {Keypair,VersionedTransaction,type Connection} from '@solana/web3.js';
import {getBase58Decoder} from '@solana/kit';
import {paymentTransaction} from '../src/commerce/payment';
import {web3Payment} from '../src/wallet/web3Payment';
import type {Order} from '../shared/commerce';
function fixture(currency:'SOL'|'SKR'='SOL'){
 const buyer=Keypair.generate(),pub=()=>Keypair.generate().publicKey.toBase58(),wallet=buyer.publicKey.toBase58();
 const original=paymentTransaction({cluster:'solana:devnet',wallet,recipient:pub(),source:pub(),destination:pub(),mint:pub(),tokenProgram:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',decimals:6,currency,amount:'10000000',reference:pub(),memo:'seeker-order:fixture',payment:{id:'fixture',blockhash:pub(),lastValidBlockHeight:'250',contextSlot:'1000'}} as Order);
 return {buyer,original,sign:async(tx:VersionedTransaction)=>{tx.sign([buyer]);return tx;}};
}
for(const currency of ['SOL','SKR'] as const)test(`reference Web3 payment flow signs and sends ${currency}, preserving the prepared order`,async()=>{
 const f=fixture(currency),raws:Uint8Array[]=[],stages:string[]=[];let sends=0;
 const connection={sendRawTransaction:async(raw:any,options:any)=>{assert.equal(options.skipPreflight,false);assert.equal(options.minContextSlot,1000);raws.push(Uint8Array.from(raw));if(++sends===1)throw Error('connection lost');const tx=VersionedTransaction.deserialize(raw);return getBase58Decoder().decode(tx.signatures[0]!);},confirmTransaction:async(strategy:any)=>{assert.equal(strategy.lastValidBlockHeight,250);return {value:{err:null}};}} as unknown as Connection;
 const result=await web3Payment(f.original,{rpcUrl:'https://example.invalid',minContextSlot:1000n,sign:f.sign,connection,wait:async()=>{},log:s=>stages.push(s)});
 assert.equal(result.length,64);assert.deepEqual(raws[0],raws[1]);assert.deepEqual(VersionedTransaction.deserialize(raws[0]!).message.serialize(),f.original.messageBytes);assert.ok(stages.includes('payment.web3.confirmed'));
});
test('Web3 flow rejects a wallet-mutated message and missing signature before sending',async()=>{
 const f=fixture();let sends=0;
 const options={rpcUrl:'https://example.invalid',minContextSlot:1n,connection:{sendRawTransaction:async()=>{sends++;}} as unknown as Connection,wait:async()=>{}};
 await assert.rejects(web3Payment(f.original,{...options,sign:async tx=>{tx.message.recentBlockhash=Keypair.generate().publicKey.toBase58();tx.sign([f.buyer]);return tx;}}),/changed the payment/);
 await assert.rejects(web3Payment(f.original,{...options,sign:async tx=>tx}),/signed payment/);assert.equal(sends,0);
});
test('lost Web3 send response retains exactly one signed payment for backend reconciliation',async()=>{
 const f=fixture();let signs=0,sends=0;const stages:string[]=[];
 const result=await web3Payment(f.original,{rpcUrl:'https://example.invalid',minContextSlot:1n,sign:async tx=>{signs++;return f.sign(tx);},connection:{sendRawTransaction:async()=>{sends++;throw Error('network');}} as unknown as Connection,wait:async()=>{},log:s=>stages.push(s)});
 assert.equal(signs,1);assert.equal(sends,3);assert.equal(result.length,64);assert.ok(stages.includes('payment.web3.submission-uncertain'));
});
test('confirmation failure is not represented as a successful payment',async()=>{
 const f=fixture(),connection={sendRawTransaction:async(raw:any)=>getBase58Decoder().decode(VersionedTransaction.deserialize(raw).signatures[0]!),confirmTransaction:async()=>({value:{err:{InstructionError:[0,1]}}})} as unknown as Connection;
 await assert.rejects(web3Payment(f.original,{rpcUrl:'https://example.invalid',minContextSlot:1n,sign:f.sign,connection,wait:async()=>{}}),/failed on Solana/);
});
test('prepared payments include a deterministic bounded fee budget so Phantom need not mutate them',async()=>{
 const {ComputeBudgetInstruction,ComputeBudgetProgram,TransactionMessage}=await import('@solana/web3.js');
 const {getTransactionEncoder}=await import('@solana/kit');
 const f=fixture('SKR'),tx=VersionedTransaction.deserialize(Uint8Array.from(getTransactionEncoder().encode(f.original))),instructions=TransactionMessage.decompile(tx.message).instructions;
 assert.equal(instructions.length,4);
 assert.ok(instructions[0]!.programId.equals(ComputeBudgetProgram.programId));
 assert.ok(instructions[1]!.programId.equals(ComputeBudgetProgram.programId));
 const {units}=ComputeBudgetInstruction.decodeSetComputeUnitLimit(instructions[0]!);
 const {microLamports}=ComputeBudgetInstruction.decodeSetComputeUnitPrice(instructions[1]!);
 assert.equal(units,200000);assert.equal(microLamports,5000n);
 assert.equal((BigInt(units)*microLamports+999999n)/1000000n,1000n);
 assert.equal(instructions[2]!.programId.toBase58(),'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
});
