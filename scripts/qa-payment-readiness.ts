// Mainnet-safe HTTP QA: ephemeral sign-in and unsigned approval payloads only.
// Never signs or broadcasts a transfer; never uses a treasury private key.
import assert from 'node:assert/strict';
import {generateKeyPairSync,randomUUID,sign} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import {getBase58Decoder} from '@solana/kit';
import {createSignInMessage} from '@solana/wallet-standard-util';
import type {Order} from '../shared/commerce';
const base=process.env.QA_API_URL||'https://seeker-api-production-41b3.up.railway.app';
const report:{at:string;api:string;checks:unknown[];limitations:string[]}={at:new Date().toISOString(),api:base,checks:[],limitations:['No transfer signed or broadcast. Physical Phantom approval and live settlement require a user test.']};
async function api(path:string,token?:string,body?:unknown){
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(token?{authorization:`Bearer ${token}`}:{}) ,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const data=await r.json();assert.equal(r.status,200,`${path}: ${r.status} ${JSON.stringify(data)}`);return data as any;
}
async function main(){
 const health=await api('/health');assert.equal(health.cluster,'solana:mainnet');
 for(const sku of ['campaign','credits-500','credits-1500','credits-3500']){
  const pricing=await api(`/pricing/${sku}`);assert.equal(pricing.options.length,2);assert(Date.parse(pricing.expiresAt)>Date.now());
  for(const currency of ['SKR','SOL']){
   // Separate empty wallet ensures no legacy purchase or pending order can mask a failure.
   const keys=generateKeyPairSync('ed25519'),wallet=getBase58Decoder().decode(keys.publicKey.export({format:'der',type:'spki'}).subarray(-32));
   const challenge=await api('/auth/challenge',undefined,{wallet}),message=createSignInMessage(challenge.payload);
   const auth=await api('/auth/verify',undefined,{id:challenge.id,wallet,signedMessage:Buffer.from(message).toString('base64'),signature:sign(null,message,keys.privateKey).toString('base64')});
   const token=auth.token;
   try{
    const idempotencyKey=randomUUID(),order:Order=await api('/orders',token,{sku,currency,idempotencyKey});assert.equal(order.cluster,'solana:mainnet');assert.equal(order.currency,currency);assert(BigInt(order.amount)>0n);
    const duplicate=await api('/orders',token,{sku,currency,idempotencyKey});assert.equal(duplicate.id,order.id);
    let prepared=false;
    {
     const p=await api(`/orders/${order.id}/prepare`,token,{});assert(p.payment?.blockhash);assert(!p.signature);prepared=true;
     const repeat=await api(`/orders/${order.id}/prepare`,token,{});assert.deepEqual(repeat.payment,p.payment);
    }
    const account=await api('/me',token);assert.equal(account.credits,0);assert.equal(account.entitlements.length,0);
    report.checks.push({sku,currency,quote:true,idempotency:true,prepared,unsigned:true,unpaidGrantsNothing:true});console.log(`PASS ${sku} ${currency}: quote, ${prepared?'unsigned approval, ':''}idempotency, no unpaid grant`);
   }finally{await api('/auth/logout',token,{});}
  }
 }
 const ready=await api('/health/payments');assert.equal(ready.ok,true);
}
main().catch(e=>{report.checks.push({error:e instanceof Error?e.message:'QA failed'});console.error(e.message);process.exitCode=1;}).finally(()=>{mkdirSync('verification',{recursive:true});writeFileSync('verification/payment-readiness-qa.json',JSON.stringify(report,null,2)+'\n');});
