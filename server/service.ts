import {CREDIT_PACKS,STORE_ITEMS,RETIRED_ITEMS} from '../shared/store';
import type {SolanaCluster} from '../shared/network';
import {CoinbasePriceFeed,priceProduct,productPricing,type PriceFeed} from './pricing';
import type {PaymentCurrency} from '../shared/pricing';
import {campaignTerms} from '../shared/economy';
import type {ReturnService} from './returns';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import type {Pool} from 'pg';
import {address,getAddressEncoder,getBase58Decoder} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {verifySignIn} from '@solana/wallet-standard-util';
import {PRODUCTS,type ProductId,type Order,type AccountState,type SignInChallenge} from '../shared/commerce';
import {transaction} from './db';
import {mergeProgress,type SyncedProgress} from './progress';
import {TOKEN_PROGRAM,SYSTEM_PROGRAM,RpcError,type PaymentChain,type Verification} from './chain';
export class ServiceError extends Error{constructor(public status:number,message:string,public diagnostic?:string){super(message);}}
export type CommerceConfig={creditPackPrices?:Record<string,number>;storeCreditPrices?:Record<string,number>;passSkr?:number;testPricing?:boolean;cluster?:SolanaCluster;shopPrices?:Record<string,string>;priceDivisor?:number;campaignUsdCents?:number;rebateSkr?:number;allowlist?:string[];allowAllWallets?:boolean;identityUri:string;mint:string;recipient:string;decimals:number;destination:string;campaignOffer?:boolean;usdPricing?:boolean};
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const iso=(d:Date|string)=>new Date(d).toISOString();
function orderFromRow(r:Record<string,any>):Order{return {id:r.id,wallet:r.wallet,sku:r.sku,status:r.status,currency:r.currency??'SKR',...(r.price_snapshot?{pricing:r.price_snapshot}:{}),...(r.campaign_terms?{campaignTerms:r.campaign_terms}:{}),cluster:r.cluster,mint:r.mint,tokenProgram:r.token_program,decimals:r.decimals,amount:r.amount,recipient:r.recipient,source:r.source,destination:r.destination,reference:r.reference,memo:r.memo,createdAt:iso(r.created_at),expiresAt:iso(r.expires_at),signature:r.signature,detail:r.detail,...(r.payment_authorization?{payment:r.payment_authorization}:{})};}
export class CommerceService {
 campaignReturns?:ReturnService;
 constructor(public pool:Pool,public chain:PaymentChain,public config:CommerceConfig,private prices:PriceFeed=new CoinbasePriceFeed()){}
 async paymentReady(){
  try{await this.chain.ready();}catch(error){
   const diagnostic=error instanceof RpcError?error.message:'Payment network, mint or treasury readiness check failed.';
   throw new ServiceError(503,'The payment network is temporarily unavailable. No payment was requested. Please try again shortly.',diagnostic);
  }
 }
 async pricing(sku:ProductId){try{return {...await productPricing(sku,this.prices,this.config.decimals,this.config.priceDivisor??1,this.config.campaignUsdCents,this.config.shopPrices,this.config.passSkr,this.config.creditPackPrices),...(sku==='campaign'?{campaignOffer:{testPricing:this.config.testPricing??false,usdCents:this.config.campaignUsdCents??1000/(this.config.priceDivisor??1),rebateSkr:this.config.rebateSkr??25,missions:12,cluster:this.config.cluster??'solana:devnet'}}:{})};}catch{throw new ServiceError(503,'Live prices are unavailable. Refresh prices before paying.');}}
 async challenge(wallet:string):Promise<SignInChallenge>{
  address(wallet);if(this.config.cluster==='solana:mainnet'&&!this.config.allowAllWallets&&!this.config.allowlist?.includes(wallet))throw new ServiceError(403,'This Mainnet test is limited to the configured tester wallet.');const now=new Date(),expires=new Date(now.getTime()+5*60_000),id=randomUUID();
  const payload:SignInChallenge['payload']={domain:new URL(this.config.identityUri).host,address:wallet,statement:`Sign in to Steal a Seeker on ${this.config.cluster==='solana:mainnet'?'Mainnet':'Devnet'}. This does not authorize a payment.`,uri:this.config.identityUri,version:'1',chainId:this.config.cluster??'solana:devnet',nonce:randomBytes(16).toString('hex'),issuedAt:now.toISOString(),expirationTime:expires.toISOString()};
  await this.pool.query('INSERT INTO auth_challenges(id,wallet,payload,expires_at) VALUES($1,$2,$3,$4)',[id,wallet,payload,expires]);return {id,payload};
 }
 async signIn(input:{id:string;wallet:string;signedMessage:string;signature:string}){
  const result=await this.pool.query('SELECT * FROM auth_challenges WHERE id=$1 AND consumed_at IS NULL AND expires_at>now()',[input.id]);const row=result.rows[0];
  if(!row||row.wallet!==input.wallet)throw new ServiceError(401,'Sign-in challenge expired or belongs to another wallet.');
  let valid=false;try{valid=verifySignIn(row.payload,{account:{address:input.wallet,publicKey:new Uint8Array(getAddressEncoder().encode(address(input.wallet))),chains:[this.config.cluster??'solana:devnet'],features:['solana:signIn']},signedMessage:new Uint8Array(Buffer.from(input.signedMessage,'base64')),signature:new Uint8Array(Buffer.from(input.signature,'base64'))});}catch{/* Malformed signatures fail closed. */}
  if(!valid)throw new ServiceError(401,'Wallet signature does not match this sign-in request.');
  const token=randomBytes(32).toString('hex'),expiresAt=new Date(Date.now()+24*3600_000);
  await transaction(this.pool,async db=>{const used=await db.query('UPDATE auth_challenges SET consumed_at=now() WHERE id=$1 AND consumed_at IS NULL AND expires_at>now() RETURNING id',[input.id]);if(!used.rowCount)throw new ServiceError(401,'This sign-in request has already been used.');await db.query('INSERT INTO wallets(address) VALUES($1) ON CONFLICT DO NOTHING',[input.wallet]);await db.query('INSERT INTO sessions(token_hash,wallet,expires_at) VALUES($1,$2,$3)',[hash(token),input.wallet,expiresAt]);});
  return {token,expiresAt:expiresAt.toISOString(),account:await this.me(input.wallet)};
 }
 async authenticate(token:string){const r=await this.pool.query('SELECT wallet FROM sessions WHERE token_hash=$1 AND expires_at>now()',[hash(token)]);if(!r.rowCount)throw new ServiceError(401,'Sign in again to continue.');return r.rows[0].wallet as string;}
 async logout(token:string){await this.pool.query('DELETE FROM sessions WHERE token_hash=$1',[hash(token)]);}
 async me(wallet:string):Promise<AccountState>{const [profile,items]=await Promise.all([this.pool.query('SELECT equipment,progress,credits FROM wallets WHERE address=$1',[wallet]),this.pool.query('SELECT sku FROM entitlements WHERE wallet=$1 ORDER BY sku',[wallet])]);if(!profile.rowCount)throw new ServiceError(404,'Account not found.');const stars=await this.pool.query('SELECT mission,stars FROM campaign_credit_stars WHERE wallet=$1',[wallet]);return {wallet,...profile.rows[0],creditStars:Object.fromEntries(stars.rows.map(r=>[r.mission,r.stars])),entitlements:items.rows.map(r=>r.sku)};}
 async createOrder(wallet:string,sku:ProductId,key:string,currency:PaymentCurrency='SKR'):Promise<Order>{
  if(this.config.cluster==='solana:mainnet'&&!this.config.allowAllWallets&&!this.config.allowlist?.includes(wallet))throw new ServiceError(403,'Wallet not enabled for Mainnet testing.');
  const product=PRODUCTS.find(p=>p.id===sku);if(!product)throw new ServiceError(400,'Unknown product.');
  if(RETIRED_ITEMS.includes(sku))throw new ServiceError(400,'This item is no longer for sale.');
  if(currency==='SOL'&&!this.config.usdPricing)throw new ServiceError(503,'SOL payments are not enabled.');
  const existing=await this.pool.query('SELECT * FROM orders WHERE wallet=$1 AND idempotency_key=$2',[wallet,key]);if(existing.rowCount){if(existing.rows[0].sku!==sku||(existing.rows[0].currency??'SKR')!==currency)throw new ServiceError(409,'This request key belongs to another product.');return orderFromRow(existing.rows[0]);}
  await this.paymentReady();
  let snapshot;try{snapshot=this.config.usdPricing?priceProduct(sku,currency,await this.prices.rates(),this.config.decimals,Date.now(),this.config.priceDivisor??1,this.config.campaignUsdCents,this.config.shopPrices,this.config.passSkr,this.config.creditPackPrices):undefined;}catch{throw new ServiceError(503,'Live prices are unavailable. Refresh prices before paying.');}
  const native=currency==='SOL',mint=native?SYSTEM_PROGRAM:this.config.mint,program=native?SYSTEM_PROGRAM:TOKEN_PROGRAM,decimals=native?9:this.config.decimals,destination=native?this.config.recipient:this.config.destination;
  const [tokenSource]=await findAssociatedTokenPda({owner:address(wallet),mint:address(this.config.mint),tokenProgram:address(TOKEN_PROGRAM)});
  const source=native?wallet:tokenSource;
  return transaction(this.pool,async db=>{
   await db.query('SELECT address FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);
   const retry=await db.query('SELECT * FROM orders WHERE wallet=$1 AND idempotency_key=$2',[wallet,key]);if(retry.rowCount){if(retry.rows[0].sku!==sku||(retry.rows[0].currency??'SKR')!==currency)throw new ServiceError(409,'This request key belongs to another product.');return orderFromRow(retry.rows[0]);}
   const owned=await db.query('SELECT 1 FROM entitlements WHERE wallet=$1 AND sku=$2',[wallet,sku]);if(owned.rowCount&&product.kind!=='credits')throw new ServiceError(409,'You already own this item. Restore your purchases.');
   const pending=await db.query("SELECT * FROM orders WHERE wallet=$1 AND sku=$2 AND (status IN ('verifying','needs_review') OR (status='quoted' AND expires_at>now())) ORDER BY created_at DESC LIMIT 1",[wallet,sku]);if(pending.rowCount){if((pending.rows[0].currency??'SKR')!==currency)throw new ServiceError(409,'Finish or cancel the existing quote before changing payment currency.');return orderFromRow(pending.rows[0]);}
   const id=randomUUID(),reference=getBase58Decoder().decode(randomBytes(32)),created=new Date(),expires=new Date(created.getTime()+(snapshot?5:15)*60_000),amount=snapshot?.amount??(BigInt(product.price)*10n**BigInt(this.config.decimals)).toString();
   const r=await db.query(`INSERT INTO orders(id,wallet,sku,idempotency_key,status,cluster,mint,token_program,decimals,amount,recipient,source,destination,reference,memo,created_at,expires_at,currency,price_snapshot) VALUES($1,$2,$3,$4,'quoted',$18,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,[id,wallet,sku,key,mint,program,decimals,amount,this.config.recipient,source,destination,reference,`seeker-order:${id}`,created,expires,currency,snapshot??null,this.config.cluster??'solana:devnet']);if(sku==='campaign'&&this.config.campaignOffer&&(this.config.rebateSkr??campaignTerms.rebate)>0){const terms={...campaignTerms,rebate:this.config.rebateSkr??campaignTerms.rebate};await db.query('UPDATE orders SET campaign_terms=$2 WHERE id=$1',[id,terms]);r.rows[0].campaign_terms=terms;}return orderFromRow(r.rows[0]);
  });
 }
 async cancelQuote(wallet:string,id:string){return transaction(this.pool,async db=>{
  const row=await db.query('SELECT * FROM orders WHERE id=$1 AND wallet=$2 FOR UPDATE',[id,wallet]);if(!row.rowCount)throw new ServiceError(404,'Order not found.');
  const o=row.rows[0];if(o.status!=='quoted'||o.payment_authorization||o.signature)throw new ServiceError(409,'A payment was already prepared. Restore its result before changing currency.');
  await db.query("UPDATE orders SET expires_at=LEAST(expires_at,now()),detail='Unprepared quote cancelled.' WHERE id=$1",[id]);return {ok:true};
 });}
 async getOrder(wallet:string,id:string){const r=await this.pool.query('SELECT * FROM orders WHERE id=$1 AND wallet=$2',[id,wallet]);if(!r.rowCount)throw new ServiceError(404,'Order not found.');return orderFromRow(r.rows[0]);}
 async orders(wallet:string){return (await this.pool.query('SELECT * FROM orders WHERE wallet=$1 ORDER BY created_at DESC LIMIT 50',[wallet])).rows.map(orderFromRow);}
 async preparePayment(wallet:string,id:string,reconcileOnly=false):Promise<Order>{
  const observed=await this.getOrder(wallet,id);if(observed.status==='fulfilled')return observed;
  await this.chain.ready();
  const lifetime=await this.chain.lifetime(),height=await this.chain.height(Number(lifetime.contextSlot));
  const expired=!!observed.payment&&height>Number(observed.payment.lastValidBlockHeight);
  // Read finalized reference history after the old transaction can no longer
  // land. A missing wallet callback alone is never permission to pay again.
  const found=await this.chain.find(observed.reference,Number(lifetime.contextSlot));
  let unresolved=false;for(const sig of found){const result=await this.chain.verify(observed,sig);if(result.state==='pending')unresolved=true;await this.check(observed,sig,result);}
  return transaction(this.pool,async db=>{
   const row=await db.query('SELECT * FROM orders WHERE id=$1 AND wallet=$2 FOR UPDATE',[id,wallet]);const current=orderFromRow(row.rows[0]);
   if(current.status==='fulfilled')return current;
   if(current.status==='needs_review'||unresolved)throw new ServiceError(409,'Payment reconciliation must finish before another approval.');
   if(current.payment&&current.payment.id!==observed.payment?.id)return current;
   if(current.payment&&!expired)return current; // Same bytes, same signature on a resumed approval.
   if(current.status==='verifying'&&!current.payment)throw new ServiceError(409,'An earlier payment needs reconciliation.');
   if(reconcileOnly||new Date(current.expiresAt).getTime()<=Date.now()){
    await db.query("UPDATE order_attempts SET state='expired',detail='Approval expired; finalized reference scan found no completed payment.' WHERE order_id=$1 AND state='pending'",[id]);
    const ended=await db.query("UPDATE orders SET status='quoted',payment_authorization=NULL,signature=NULL,detail='Wallet request expired. No finalized payment was found. You can try again.' WHERE id=$1 RETURNING *",[id]);return orderFromRow(ended.rows[0]);
   }
   if(current.campaignTerms){
    if(this.campaignReturns&&(this.campaignReturns.config.mint!==this.config.mint||this.campaignReturns.config.treasury!==this.config.recipient||this.campaignReturns.config.source!==this.config.destination||this.campaignReturns.config.decimals!==this.config.decimals))throw new ServiceError(503,'Campaign treasury configuration does not match this order.');
    if(!this.campaignReturns?.chain)throw new ServiceError(503,'Completion rebate funding is unavailable. No wallet payment has been requested.');
    await db.query('SELECT address FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);
    const existing=await db.query('SELECT r.* FROM campaign_rebates c JOIN return_reservations r ON r.id=c.reservation_id WHERE c.wallet=$1',[wallet]);
    const amount=BigInt(current.campaignTerms.rebate)*10n**BigInt(this.config.decimals);
    if(existing.rowCount&&(existing.rows[0].state!=='held'||existing.rows[0].amount!==amount.toString()||existing.rows[0].mint!==this.config.mint||existing.rows[0].treasury!==this.config.recipient))throw new ServiceError(409,'Existing campaign reservation requires reconciliation.');
    const reserve=existing.rows[0]??await this.campaignReturns.reserveInTransaction(db,wallet,`campaign-v2:${current.id}`,amount);
    await db.query('INSERT INTO campaign_rebates(wallet,reservation_id,terms) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[wallet,reserve.id,current.campaignTerms]);
   }
   const payment={id:randomUUID(),...lifetime};
   const updated=await db.query("UPDATE orders SET payment_authorization=$2,status='verifying',signature=NULL,detail='Wallet approval prepared. Resume the same transaction or restore its receipt.' WHERE id=$1 RETURNING *",[id,payment]);
   if(expired)await db.query("UPDATE order_attempts SET state='expired',detail='Blockhash expired; finalized reference scan found no completed payment.' WHERE order_id=$1 AND state='pending'",[id]);
   return orderFromRow(updated.rows[0]);
  });
 }
 async attach(wallet:string,id:string,signature:string){const order=await this.getOrder(wallet,id);if(order.status==='fulfilled')return order;const count=await this.pool.query('SELECT count(*) FROM order_attempts WHERE order_id=$1 AND signature<>$2',[id,signature]);if(Number(count.rows[0].count)>=5)throw new ServiceError(409,'This order needs payment reconciliation before another attempt.');await this.pool.query('INSERT INTO order_attempts(signature,order_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[signature,id]);await this.check(order,signature);return this.getOrder(wallet,id);}
 async check(order:Order,signature:string,verified?:Verification){
  const result=verified??await this.chain.verify(order,signature);
  if(result.state!=='verified'){
   if(result.state==='invalid'){await this.pool.query("UPDATE order_attempts SET state='invalid',detail=$3 WHERE order_id=$1 AND signature=$2",[order.id,signature,result.detail]);await this.pool.query("UPDATE orders SET detail=$2 WHERE id=$1 AND status='quoted'",[order.id,result.detail]);return;}
   await this.pool.query("UPDATE orders SET status=$2,signature=$3,detail=$4,checked_at=now() WHERE id=$1 AND status IN ('quoted','verifying') AND ($2='needs_review' OR NOT EXISTS(SELECT 1 FROM order_attempts a WHERE a.order_id=orders.id AND a.signature=$3 AND a.state='expired'))",[order.id,result.state==='needs_review'?'needs_review':'verifying',signature,result.detail]);return;
  }
  await transaction(this.pool,async db=>{
   const current=await db.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[order.id]);if(current.rows[0]?.status==='fulfilled')return;
   await db.query('SELECT address FROM wallets WHERE address=$1 FOR UPDATE',[order.wallet]);
   if(order.campaignTerms){const reserve=await db.query("SELECT 1 FROM campaign_rebates c JOIN return_reservations r ON r.id=c.reservation_id WHERE c.wallet=$1 AND r.state='held'",[order.wallet]);if(!reserve.rowCount){await db.query("UPDATE orders SET status='needs_review',signature=$2,detail='Payment arrived without a reserved completion rebate. Support reconciliation required; do not pay again.' WHERE id=$1",[order.id,signature]);return;}}
   const duplicate=await db.query('SELECT order_id FROM payment_receipts WHERE signature=$1',[signature]);if(duplicate.rowCount&&duplicate.rows[0].order_id!==order.id)throw new ServiceError(409,'Payment already belongs to another order.');
   const owned=await db.query('SELECT 1 FROM entitlements WHERE wallet=$1 AND sku=$2',[order.wallet,order.sku]);
   if(owned.rowCount&&!CREDIT_PACKS.some(p=>p.id===order.sku)){await db.query("UPDATE orders SET status='needs_review',signature=$2,detail='Duplicate purchase payment needs a refund review.' WHERE id=$1",[order.id,signature]);return;}
   const allocated=await db.query("INSERT INTO transfer_receipts(signature,instruction_index,source_kind,source_id,slot) VALUES($1,$2,'order',$3,$4) ON CONFLICT DO NOTHING RETURNING source_id",[signature,result.instructionIndex,order.id,result.slot]);
   if(!allocated.rowCount)throw new ServiceError(409,'This transfer instruction already fulfilled another purchase or entry.');
   await db.query('INSERT INTO payment_receipts(signature,order_id,instruction_index,slot) VALUES($1,$2,$3,$4)',[signature,order.id,result.instructionIndex,result.slot]);
   const pack=CREDIT_PACKS.find(p=>p.id===order.sku);
   if(pack){const balance=await db.query('UPDATE wallets SET credits=credits+$2 WHERE address=$1 RETURNING credits',[order.wallet,pack.credits]);await db.query('INSERT INTO credit_ledger(id,wallet,source,delta,balance_after) VALUES($1,$2,$3,$4,$5)',[randomUUID(),order.wallet,`order:${order.id}`,pack.credits,balance.rows[0].credits]);}
   else await db.query('INSERT INTO entitlements(wallet,sku,order_id) VALUES($1,$2,$3)',[order.wallet,order.sku,order.id]);
   await db.query("UPDATE orders SET status='fulfilled',signature=$2,detail=NULL,checked_at=now() WHERE id=$1",[order.id,signature]);
   await db.query("UPDATE order_attempts SET state='verified' WHERE order_id=$1 AND signature=$2",[order.id,signature]);
  });
 }
 async reconcile(id:string){const r=await this.pool.query('SELECT * FROM orders WHERE id=$1',[id]);if(!r.rowCount)return;const order=orderFromRow(r.rows[0]);if(order.status==='fulfilled')return;
  // A prepared approval already needs a finalized reference scan and expiry
  // proof in preparePayment. Do it once, not two scans per background poll.
  if(order.payment&&order.status!=='needs_review'){
   const attempts=await this.pool.query("SELECT signature FROM order_attempts WHERE order_id=$1 AND state='pending'",[id]);
   const signatures=new Set<string>(attempts.rows.map(r=>r.signature));if(order.signature)signatures.add(order.signature);
   for(const sig of signatures)await this.check(order,sig);
   await this.preparePayment(order.wallet,id,true);
  }else{
   const attempts=await this.pool.query("SELECT signature FROM order_attempts WHERE order_id=$1 AND state='pending'",[id]);
   const signatures=new Set<string>(attempts.rows.map(r=>r.signature));if(order.signature)signatures.add(order.signature);
   for(const sig of await this.chain.find(order.reference))signatures.add(sig);
   for(const sig of signatures)await this.check(order,sig);
  }
  await this.pool.query('UPDATE orders SET checked_at=now() WHERE id=$1',[id]);
 }
 async releaseUnpaidCampaignReservations(limit=4){
  if(!this.campaignReturns)return 0;
  const candidates=await this.pool.query("SELECT c.wallet,c.reservation_id FROM campaign_rebates c WHERE NOT EXISTS(SELECT 1 FROM entitlements e WHERE e.wallet=c.wallet AND e.sku='campaign') ORDER BY c.created_at LIMIT $1",[Math.max(1,Math.min(8,limit))]);
  let released=0;
  for(const candidate of candidates.rows){
   const orders=await this.pool.query("SELECT * FROM orders WHERE wallet=$1 AND sku='campaign' AND campaign_terms IS NOT NULL",[candidate.wallet]);
   if(orders.rows.some(o=>new Date(o.expires_at).getTime()>Date.now()||o.status==='needs_review'||o.status==='fulfilled'))continue;
   // preparePayment proves the original blockhash can no longer land and
   // scans finalized reference history before clearing an expired approval.
   // An RPC failure or unresolved transaction leaves every liability held.
   for(const o of orders.rows)await this.preparePayment(candidate.wallet,o.id);
   const didRelease=await transaction(this.pool,async db=>{
    await db.query('SELECT address FROM wallets WHERE address=$1 FOR UPDATE',[candidate.wallet]);
    const owned=await db.query("SELECT 1 FROM entitlements WHERE wallet=$1 AND sku='campaign'",[candidate.wallet]);if(owned.rowCount)return false;
    const current=await db.query("SELECT 1 FROM orders WHERE wallet=$1 AND sku='campaign' AND campaign_terms IS NOT NULL AND (expires_at>now() OR status<>'quoted' OR payment_authorization IS NOT NULL OR signature IS NOT NULL)",[candidate.wallet]);if(current.rowCount)return false;
    const held=await db.query('SELECT reservation_id FROM campaign_rebates WHERE wallet=$1 FOR UPDATE',[candidate.wallet]);if(held.rows[0]?.reservation_id!==candidate.reservation_id)return false;
    await this.campaignReturns!.releaseInTransaction(db,candidate.reservation_id,'unpaid-finalized-expiry');
    await db.query('DELETE FROM campaign_rebates WHERE wallet=$1',[candidate.wallet]);return true;
   });if(didRelease)released++;
  }return released;
 }
 async syncProgress(wallet:string,incoming:SyncedProgress){
  await transaction(this.pool,async db=>{const row=await db.query('SELECT progress FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);if(!row.rowCount)throw new ServiceError(404,'Account not found.');const next=mergeProgress(row.rows[0].progress,incoming);await db.query('UPDATE wallets SET progress=$2 WHERE address=$1',[wallet,next]);});return this.me(wallet);
 }
 async redeem(wallet:string,sku:string,expectedPrice?:number){
  if(RETIRED_ITEMS.includes(sku))throw new ServiceError(400,'This item is no longer for sale.');
  const item=STORE_ITEMS.find(i=>i.id===sku);if(!item)throw new ServiceError(400,'Unknown store item.');
  const price=this.config.storeCreditPrices?.[sku]??item.price;
  await transaction(this.pool,async db=>{const r=await db.query('SELECT credits FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);if(!r.rowCount)throw new ServiceError(404,'Account not found.');const owned=await db.query('SELECT 1 FROM entitlements WHERE wallet=$1 AND sku=$2',[wallet,sku]);if(owned.rowCount)return;
   // A prepared or still-valid token checkout reserves this ownership path.
   // A parallel credit redemption must not spend credits while that transfer can land.
   const pending=await db.query("SELECT 1 FROM orders WHERE wallet=$1 AND sku=$2 AND (status IN ('verifying','needs_review') OR payment_authorization IS NOT NULL OR signature IS NOT NULL OR (status='quoted' AND expires_at>now())) LIMIT 1",[wallet,sku]);
   if(pending.rowCount)throw new ServiceError(409,'A wallet checkout for this skin is open. Restore or cancel that checkout before spending credits.');
   if((expectedPrice??item.price)!==price)throw new ServiceError(409,'Price changed. Refresh the store and review it before buying.');if(r.rows[0].credits<price)throw new ServiceError(409,'Not enough credits.');const balance=r.rows[0].credits-price;await db.query('UPDATE wallets SET credits=$2,equipment=equipment || $3::jsonb WHERE address=$1',[wallet,balance,JSON.stringify({[item.kind]:sku})]);await db.query('INSERT INTO entitlements(wallet,sku) VALUES($1,$2)',[wallet,sku]);await db.query('INSERT INTO credit_ledger(id,wallet,source,delta,balance_after) VALUES($1,$2,$3,$4,$5)',[randomUUID(),wallet,`redeem:${sku}`,-price,balance]);});return this.me(wallet);
 }
 async equip(wallet:string,sku:ProductId){const product=PRODUCTS.find(p=>p.id===sku);if(!product||product.kind==='access'||product.kind==='credits')throw new ServiceError(400,'This item cannot be equipped.');const owned=await this.pool.query('SELECT 1 FROM entitlements WHERE wallet=$1 AND sku=$2',[wallet,sku]);if(!owned.rowCount)throw new ServiceError(403,'You do not own this item.');await this.pool.query('UPDATE wallets SET equipment=equipment || $2::jsonb WHERE address=$1',[wallet,JSON.stringify({[product.kind]:sku})]);return this.me(wallet);}
 async unequip(wallet:string,slot:'outfit'|'trail'|'frame'|'rack'){await this.pool.query('UPDATE wallets SET equipment=equipment-$2::text WHERE address=$1',[wallet,slot]);return this.me(wallet);}
}
