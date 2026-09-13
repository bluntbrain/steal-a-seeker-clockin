import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {getBase58Decoder} from '@solana/kit';
import {paymentTransaction} from '../src/commerce/payment';
import type {Order} from '../shared/commerce';
const pub=()=>getBase58Decoder().decode(randomBytes(32));
test('resuming an approval compiles identical bytes, with only the buyer required to sign',()=>{
 const order:Order={id:'fixture',wallet:pub(),sku:'campaign',status:'verifying',cluster:'solana:devnet',mint:pub(),tokenProgram:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',decimals:6,amount:'50000000',recipient:pub(),source:pub(),destination:pub(),reference:pub(),memo:'seeker-order:fixture',createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+900000).toISOString(),signature:null,detail:null,payment:{id:'attempt',blockhash:pub(),lastValidBlockHeight:'250',contextSlot:'1000'}};
 const first=paymentTransaction(order),resumed=paymentTransaction(JSON.parse(JSON.stringify(order)));
 assert.deepEqual(first.messageBytes,resumed.messageBytes);assert.deepEqual(Object.keys(first.signatures),[order.wallet]);
 const changed=paymentTransaction({...order,payment:{...order.payment!,blockhash:pub()}});assert.notDeepEqual(changed.messageBytes,first.messageBytes);
 assert.throws(()=>paymentTransaction({...order,payment:undefined}),/Prepare/);
});

test('native SOL payment compiles a System transfer with exact lamports and buyer signature',()=>{
 const wallet=pub(),recipient=pub();const order:Order={id:'sol-fixture',wallet,sku:'campaign',status:'verifying',currency:'SOL',cluster:'solana:devnet',mint:'11111111111111111111111111111111',tokenProgram:'11111111111111111111111111111111',decimals:9,amount:'98800000',recipient,source:wallet,destination:recipient,reference:pub(),memo:'seeker-order:sol-fixture',createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+300000).toISOString(),signature:null,detail:null,payment:{id:'attempt',blockhash:pub(),lastValidBlockHeight:'250',contextSlot:'1000'}};
 const tx=paymentTransaction(order);assert.deepEqual(Object.keys(tx.signatures),[wallet]);assert.deepEqual(tx.messageBytes,paymentTransaction(structuredClone(order)).messageBytes);
 assert.notDeepEqual(tx.messageBytes,paymentTransaction({...order,amount:'98800001'}).messageBytes);
});
