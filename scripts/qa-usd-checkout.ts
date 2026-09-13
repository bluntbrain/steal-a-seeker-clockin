// Devnet-only live checkout QA. Dedicated test wallets; no real money or DB access.
import assert from 'node:assert/strict';
import {generateKeyPairSync,createPrivateKey,randomUUID,sign} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createKeyPairFromBytes,getBase58Decoder,signTransaction,getBase64EncodedWireTransaction} from '@solana/kit';
import {createSignInMessage} from '@solana/wallet-standard-util';
import {paymentTransaction} from '../src/commerce/payment';
import {DEVNET_GENESIS,rpc} from '../server/chain';
import type {Order} from '../shared/commerce';
const base='https://stealaseeker.bluntbrain.com',rpcUrl='https://api.devnet.solana.com',root=join(homedir(),'.config/steal-a-seeker'),qa=join(root,'qa');
const report:{checks:unknown[];transactions:unknown[];limitations:string[];at:string}={at:new Date().toISOString(),checks:[],transactions:[],limitations:['Automated devnet signing. Physical Phantom approval remains a separate check.'],};
const reportFile='verification/usd-checkout-qa.json';
if(existsSync(reportFile)){const previous=JSON.parse(readFileSync(reportFile,'utf8'));report.transactions=previous.transactions??[];report.checks=previous.checks??[];}
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function api(path:string,token?:string,body?:unknown,attempt=0):Promise<any>{const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(token?{authorization:`Bearer ${token}`}:{}) ,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});if(r.status===503&&attempt<4){await sleep(2500*(attempt+1));return api(path,token,body,attempt+1);}assert.equal(r.status,200,`${path}: HTTP ${r.status}`);return r.json() as Promise<any>;}
async function main(){
 assert.equal(await rpc(rpcUrl,'getGenesisHash'),DEVNET_GENESIS);
 mkdirSync(qa,{recursive:true,mode:0o700});
 for(const currency of ['SOL','SKR'] as const){
  const file=join(qa,`usd-${currency.toLowerCase()}-buyer.json`);let fresh=false;
  if(!existsSync(file)){const keys=generateKeyPairSync('ed25519'),seed=keys.privateKey.export({type:'pkcs8',format:'der'}).subarray(-32),pub=keys.publicKey.export({type:'spki',format:'der'}).subarray(-32);writeFileSync(file,JSON.stringify([...seed,...pub]),{mode:0o600});fresh=true;}
  const bytes=Uint8Array.from(JSON.parse(readFileSync(file,'utf8'))),wallet=getBase58Decoder().decode(bytes.slice(32));
  if(fresh){
   const transfer=execFileSync('solana',['transfer','--url','devnet','--keypair',join(root,'devnet-treasury.json'),'--allow-unfunded-recipient',wallet,currency==='SOL'?'0.12':'0.02'],{encoding:'utf8'});assert.ok(transfer.includes('Signature'));
   console.log(`Funded dedicated ${currency} devnet QA wallet`);
  }
  if(currency==='SKR' && !(await rpc<any>(rpcUrl,'getTokenAccountsByOwner',[wallet,{mint:'4sCj4QkKckWb452KZFyQuWp64v6edpS9Erb4pJa4hLm2'},{encoding:'jsonParsed'}])).value.length)execFileSync('spl-token',['--url','devnet','transfer','--owner',join(root,'devnet-treasury.json'),'--fee-payer',join(root,'devnet-treasury.json'),'4sCj4QkKckWb452KZFyQuWp64v6edpS9Erb4pJa4hLm2','650',wallet,'--fund-recipient','--allow-unfunded-recipient'],{encoding:'utf8'});
  const c=await api('/auth/challenge',undefined,{wallet}),message=createSignInMessage(c.payload),privateKey=createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.from(bytes.slice(0,32))]),format:'der',type:'pkcs8'});
  const signed=sign(null,message,privateKey),auth=await api('/auth/verify',undefined,{id:c.id,wallet,signedMessage:Buffer.from(message).toString('base64'),signature:signed.toString('base64')}),token=auth.token;
  if(auth.account.entitlements.includes('campaign')){const restored=await api('/orders',token);const paid=restored.find((o:Order)=>o.currency===currency&&o.status==='fulfilled');assert.ok(paid);const duplicate=await api(`/orders/${paid.id}/transaction`,token,{signature:paid.signature});assert.equal(duplicate.status,'fulfilled');const campaign=await api('/campaign',token);assert.equal(campaign.rebate,25);report.checks=report.checks.filter((c:any)=>c.currency!==currency);report.checks.push({currency,wallet,restored:true,fulfilled:true,duplicateCallbackIdempotent:true,rewardTestSkr:campaign.rebate});console.log(`PASS ${currency}: prior payment restored`);await api('/auth/logout',token,{});continue;}
  let order:Order=await api('/orders',token,{sku:'campaign',currency,idempotencyKey:randomUUID()});assert.equal(order.currency,currency);assert.ok(order.pricing!.usdCents>=1000);
  order=await api(`/orders/${order.id}/prepare`,token,{});assert.ok(order.payment);const repeat=await api(`/orders/${order.id}/prepare`,token,{});assert.deepEqual(repeat.payment,order.payment);
  const kp=await createKeyPairFromBytes(bytes),tx=await signTransaction([kp],paymentTransaction(order));
  console.log(`Prepared ${currency} order ${order.id}`);
  const sent=await fetch(rpcUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'sendTransaction',params:[getBase64EncodedWireTransaction(tx),{encoding:'base64',skipPreflight:false,preflightCommitment:'finalized',maxRetries:3}]})}).then(r=>r.json()) as any;assert.ok(!sent.error,JSON.stringify(sent.error));const signature=sent.result as string;
  report.transactions.push({currency,wallet,orderId:order.id,signature,amount:order.amount,pricing:order.pricing});writeFileSync(reportFile,JSON.stringify(report,null,2));
  // Exercise the lost-wallet-callback path: restore by reference without attaching.
  let result:Order=order;for(let i=0;i<35;i++){result=await api(`/orders/${order.id}/reconcile`,token,{});if(result.status==='fulfilled')break;await sleep(2500);}
  assert.equal(result.status,'fulfilled');const duplicate=await api(`/orders/${order.id}/transaction`,token,{signature});assert.equal(duplicate.status,'fulfilled');
  const me=await api('/me',token);assert.equal(me.entitlements.filter((p:string)=>p==='campaign').length,1);
  const campaign=await api('/campaign',token);assert.equal(campaign.rebate,25);
  report.checks.push({currency,wallet,fulfilled:true,lostCallbackRestored:true,duplicateCallbackIdempotent:true,rewardTestSkr:campaign.rebate});
  await api('/auth/logout',token,{});writeFileSync(reportFile,JSON.stringify(report,null,2));console.log(`PASS ${currency}: campaign paid, restored, one entitlement, 25 TEST SKR reward reserved`);
 }
 writeFileSync(reportFile,JSON.stringify(report,null,2));
}
main().catch(e=>{console.error('USD checkout QA failed:',e instanceof Error?e.message:'Unknown failure');writeFileSync(reportFile,JSON.stringify(report,null,2));process.exitCode=1;});
