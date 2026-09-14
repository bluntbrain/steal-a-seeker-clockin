import test from 'node:test';
import assert from 'node:assert/strict';
import {Keypair} from '@solana/web3.js';
import {getBase58Decoder} from '@solana/kit';
import {sendWithWallet} from '../src/wallet/sendWithWallet';
import {paymentTransaction} from '../src/commerce/payment';
import type {Order} from '../shared/commerce';
const pub=()=>Keypair.generate().publicKey.toBase58();
function fixture(currency:'SOL'|'SKR'){
 const wallet=pub(),order={wallet,currency,cluster:'solana:devnet',recipient:pub(),source:pub(),destination:pub(),mint:pub(),tokenProgram:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',decimals:6,amount:'10000000',reference:pub(),memo:'seeker-order:fixture',payment:{id:'a',blockhash:pub(),lastValidBlockHeight:'250',contextSlot:'1000'}} as Order;
 return {wallet,tx:paymentTransaction(order)};
}
for(const currency of ['SOL','SKR'] as const)test(`official SDK sends ${currency} once and returns its receipt for server verification`,async()=>{
 const f=fixture(currency),bytes=new Uint8Array(64).fill(1);let calls=0;
 const result=await sendWithWallet({signAndSendTransactions:async request=>{calls++;assert.equal(request.transactions.length,1);assert.equal(request.minContextSlot,1000);assert.equal(request.skipPreflight,false);assert.equal(request.commitment,'confirmed');return [getBase58Decoder().decode(bytes)];}},f.tx,f.wallet,1000n);
 assert.equal(calls,1);assert.deepEqual(result,bytes);
});
test('a wallet send error never automatically opens a second payment or falls back to local broadcast',async()=>{
 const f=fixture('SOL');let calls=0;
 await assert.rejects(sendWithWallet({signAndSendTransactions:async()=>{calls++;throw Error('callback lost');}},f.tx,f.wallet,1n),/callback lost/);assert.equal(calls,1);
});
test('wrong payer and invalid receipts are rejected',async()=>{
 const f=fixture('SOL');let calls=0;const wallet={signAndSendTransactions:async()=>{calls++;return [];}};
 await assert.rejects(sendWithWallet(wallet,f.tx,pub(),1n),/different wallet/);assert.equal(calls,0);
 await assert.rejects(sendWithWallet(wallet,f.tx,f.wallet,1n),/one payment receipt/);
 await assert.rejects(sendWithWallet({signAndSendTransactions:async()=>[getBase58Decoder().decode(new Uint8Array(64))]},f.tx,f.wallet,1n),/invalid receipt/);
});
