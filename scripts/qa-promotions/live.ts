/** Live smoke test: generated QA wallet only; no transaction signing or sending. Codes read privately. */
import {generateKeyPairSync,createPrivateKey,createPublicKey,randomUUID,sign} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {homedir} from 'node:os';
import assert from 'node:assert/strict';
import {getBase58Decoder} from '@solana/kit';
import {createSignInMessage} from '@solana/wallet-standard-util';
async function main(){
const base='https://seeker-api-production-41b3.up.railway.app',privateRoot=homedir()+'/.config/steal-a-seeker',keyfile=privateRoot+'/promotion-qa-wallet.pem';
if(!existsSync(keyfile)){const k=generateKeyPairSync('ed25519');writeFileSync(keyfile,k.privateKey.export({format:'pem',type:'pkcs8'}),{mode:0o600});}
const key=createPrivateKey(readFileSync(keyfile)),wallet=getBase58Decoder().decode(createPublicKey(key).export({type:'spki',format:'der'}).subarray(-32));
const config=JSON.parse(readFileSync(privateRoot+'/promotions.json','utf8'));
let token:string|undefined;const checks:any[]=[];
async function api(path:string,body?:unknown,method=body?'POST':'GET'){const r=await fetch(base+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});const v=await r.json();assert.ok(r.ok,`${path}: HTTP ${r.status} ${v.error??''}`);return v;}
const health=await api('/health');checks.push({check:'health',result:health});const catalog=await api('/catalog');assert.equal(catalog.testPricing,false);checks.push({check:'normal mainnet pricing',passed:true});
const c=await api('/auth/challenge',{wallet}),m=createSignInMessage(c.payload);const auth=await api('/auth/verify',{wallet,id:c.id,signedMessage:Buffer.from(m).toString('base64'),signature:sign(null,m,key).toString('base64')});token=auth.token;checks.push({check:'real signed authentication',passed:true});
const free=config.find((p:any)=>p.percentOff===100);
const preview=await api('/promotions/preview',{code:free.code,sku:'campaign'});assert.equal(preview.percentOff,100);assert.equal(preview.bonusSkus.length,7);assert.equal(preview.pricing,undefined);checks.push({check:'100 percent preview needs no price',passed:true});
for(const percent of [50,25]){
 const promo=config.find((p:any)=>p.percentOff===percent),p=await api('/promotions/preview',{code:promo.code,sku:'campaign'});assert.equal(p.percentOff,percent);assert.equal(p.pricing.campaignOffer.rebateSkr,0);
 for(const currency of ['SKR','SOL']){
  const price=p.pricing.options.find((v:any)=>v.currency===currency);assert.ok(BigInt(price.amount)>0);
  if(!auth.account.entitlements.includes('campaign')){const o=await api('/orders',{sku:'campaign',currency,promotionCode:promo.code,idempotencyKey:randomUUID()});assert.equal(o.promotion.percentOff,percent);assert.equal(o.campaignTerms?.rebate??0,0);assert.equal(o.status,'quoted');await api(`/orders/${o.id}/cancel`,{});checks.push({check:`${percent} percent ${currency} order and cancellation`,passed:true});}
 }
 checks.push({check:`${percent} percent live price preview`,passed:true});
}
const before=await api('/orders');const claim=await api('/promotions/claim',{code:free.code,sku:'campaign'});assert.equal(claim.entitlements.length,8);const again=await api('/promotions/claim',{code:free.code,sku:'campaign'});assert.deepEqual(again.entitlements,claim.entitlements);assert.equal((await api('/orders')).length,before.length);checks.push({check:'free claim plus retry, 8 entitlements, zero payment orders',passed:true});
const restored=await api('/me');assert.deepEqual(restored.entitlements,claim.entitlements);assert.equal(restored.credits,auth.account.credits);checks.push({check:'ownership restored, credit balance unchanged',passed:true});
const equipped=await api('/me/equipment',{sku:'solana-toly'},'PUT');assert.equal(equipped.equipment.outfit,'solana-toly');checks.push({check:'gifted skin equip',passed:true});
const league=await api('/league');const run=await api('/league/start',{contractId:league.contracts[0].id,rulesHash:league.rulesHash,requestKey:randomUUID()});assert.equal(run.practice,false);await api(`/runs/${run.id}/abandon`,{});checks.push({check:'ranked weekly access; test attempt abandoned without score',passed:true});
await api('/auth/logout',{});const report={at:new Date().toISOString(),api:base,wallet,checks,noPaymentSent:true,communityRedemptionsUsedForQA:1};mkdirSync('verification/qa/2026-09-28-promotions',{recursive:true});writeFileSync('verification/qa/2026-09-28-promotions/live.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
void main().catch(e=>{console.error(e.message);process.exitCode=1;});
