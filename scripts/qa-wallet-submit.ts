// Devnet QA for the same sign -> app submit -> confirm path used on Android.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {createPrivateKey,sign,randomUUID} from 'node:crypto';
import {createKeyPairFromBytes,getBase58Decoder,signTransaction} from '@solana/kit';
import {createSignInMessage} from '@solana/wallet-standard-util';
import {paymentTransaction} from '../src/commerce/payment';
import {submitPayment} from '../src/wallet/submitPayment';
import {rpc,DEVNET_GENESIS} from '../server/chain';
import type {Order} from '../shared/commerce';
const url='https://stealaseeker.bluntbrain.com',rpcUrl='https://api.devnet.solana.com',checks:unknown[]=[];
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function api(path:string,token?:string,body?:unknown):Promise<any>{for(let i=0;i<4;i++){const r=await fetch(url+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});if(r.status===503&&i<3){await wait(2500);continue;}assert.equal(r.status,200,path);return r.json();}}
async function main(){assert.equal(await rpc(rpcUrl,'getGenesisHash'),DEVNET_GENESIS);
 for(const currency of ['SOL','SKR'] as const){const bytes=Uint8Array.from(JSON.parse(readFileSync(join(homedir(),'.config/steal-a-seeker/qa',`usd-${currency.toLowerCase()}-buyer.json`),'utf8'))),wallet=getBase58Decoder().decode(bytes.slice(32)),key=createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.from(bytes.slice(0,32))]),format:'der',type:'pkcs8'}),c=await api('/auth/challenge',undefined,{wallet}),message=createSignInMessage(c.payload),auth=await api('/auth/verify',undefined,{id:c.id,wallet,signedMessage:Buffer.from(message).toString('base64'),signature:sign(null,message,key).toString('base64')});
  if(auth.account.entitlements.includes('profile-frame')){console.log(`${currency} previously verified`);await api('/auth/logout',auth.token,{});continue;}
  const quoted:Order=await api('/orders',auth.token,{sku:'profile-frame',currency,idempotencyKey:randomUUID()}),order:Order=await api(`/orders/${quoted.id}/prepare`,auth.token,{}),original=paymentTransaction(order),signed=await signTransaction([await createKeyPairFromBytes(bytes)],original),signature=getBase58Decoder().decode(await submitPayment(original,signed,{rpcUrl,minContextSlot:BigInt(order.payment!.contextSlot),log:s=>console.log(currency,s)}));
  await api(`/orders/${order.id}/transaction`,auth.token,{signature});let state:Order=order;
  for(let i=0;i<30;i++){state=await api(`/orders/${order.id}/reconcile`,auth.token,{});if(state.status==='fulfilled')break;await wait(2000);}assert.equal(state.status,'fulfilled');assert.ok((await api('/me',auth.token)).entitlements.includes('profile-frame'));
  checks.push({currency,wallet,orderId:order.id,signature,status:state.status});writeFileSync('verification/wallet-app-submit.json',JSON.stringify({checks,physicalPhantomApprovalTested:false},null,2));await api('/auth/logout',auth.token,{});console.log(`PASS ${currency}: app submission and fulfillment`);
 }
}
main().catch(e=>{console.error(e instanceof Error?e.message:'QA failure');process.exitCode=1;});
