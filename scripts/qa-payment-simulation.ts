// Read-only mainnet simulation of the actual app transaction builder.
// Uses only a public buyer address from a historical receipt. No keys or sends.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {address,getBase58Decoder,getTransactionEncoder} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {paymentTransaction} from '../src/commerce/payment';
import {MAINNET_SKR_MINT} from '../shared/network';
import {rpc,SYSTEM_PROGRAM,TOKEN_PROGRAM} from '../server/chain';
import type {Order} from '../shared/commerce';
assert.equal(process.env.EXPO_PUBLIC_SOLANA_NETWORK,'mainnet');
const url=process.env.QA_RPC_URL||'https://api.mainnet.solana.com';
const treasury='BNgBygzFkVLGw4ipkxXgt2kuNcME1YdAE2hK5s81ogdn';
const receipts:Record<string,string>={SOL:'35KXUMSS4yQjz7Bd37vCCc2fCNh74yYjoDRCyemW7o2PiypwsQC4zj4CBm4uVoiqJs9UAbcLWv9Sfy4BZLLPpm7j',SKR:'5ULU7War9jpFa1jvbZXKq31sZorS38gQV6H7iEyNZxc1jMaVTxspXTTDnLsU31XXmPKEQrpLjWF8mZZaToD4n5Yz'};
async function main(){
 const [destination]=await findAssociatedTokenPda({owner:address(treasury),mint:address(MAINNET_SKR_MINT),tokenProgram:address(TOKEN_PROGRAM)});
 const checks=[];
 for(const sku of ['campaign','credits-500'] as const){
  const prices=await fetch(`https://seeker-api-production-41b3.up.railway.app/pricing/${sku}`).then(r=>r.json()) as any;
  for(const price of prices.options){
 const tx=await rpc<any>(url,'getTransaction',[receipts[price.currency],{encoding:'json',commitment:'finalized',maxSupportedTransactionVersion:0}]);assert(tx?.meta?.err===null);
 const wallet=tx.transaction.message.accountKeys[0];assert.notEqual(wallet,treasury);
 const [ata]=await findAssociatedTokenPda({owner:address(wallet),mint:address(MAINNET_SKR_MINT),tokenProgram:address(TOKEN_PROGRAM)});
   const native=price.currency==='SOL',life=await rpc<any>(url,'getLatestBlockhash',[{commitment:'finalized'}]),id=randomUUID();
   const order:Order={id,wallet,sku,status:'verifying',cluster:'solana:mainnet',mint:native?SYSTEM_PROGRAM:MAINNET_SKR_MINT,tokenProgram:native?SYSTEM_PROGRAM:TOKEN_PROGRAM,amount:price.amount,decimals:price.decimals,currency:price.currency,source:native?wallet:ata,destination:native?treasury:destination,recipient:treasury,reference:getBase58Decoder().decode(randomBytes(32)),memo:`seeker-order:${id}`,createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+300000).toISOString(),signature:null,detail:null,payment:{id:randomUUID(),blockhash:life.value.blockhash,lastValidBlockHeight:String(life.value.lastValidBlockHeight),contextSlot:String(life.context.slot)}};
   const wire=Buffer.from(getTransactionEncoder().encode(paymentTransaction(order))).toString('base64');
   const sim=await rpc<any>(url,'simulateTransaction',[wire,{encoding:'base64',sigVerify:false,commitment:'finalized',minContextSlot:life.context.slot}]);
   checks.push({sku,currency:price.currency,amount:price.amount,error:sim.value.err,units:sim.value.unitsConsumed});
   console.log(sku,price.currency,JSON.stringify({error:sim.value.err,units:sim.value.unitsConsumed}));
   assert.equal(sim.value.err,null,JSON.stringify(sim.value.logs));
  }
 }
 writeFileSync('verification/payment-simulation-qa.json',JSON.stringify({at:new Date().toISOString(),checks,limitations:['Unsigned simulation only. No transfer signed or broadcast. Does not test the physical Phantom UI.']},null,2)+'\n');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
