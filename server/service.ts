import {randomBytes,randomUUID,createHash} from 'node:crypto';
import type {Pool} from 'pg';
import {address,getAddressEncoder,getBase58Decoder} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {verifySignIn} from '@solana/wallet-standard-util';
import {PRODUCTS,type ProductId,type Order,type AccountState,type SignInChallenge} from '../shared/commerce';
import {transaction} from './db';
import {mergeProgress,type SyncedProgress} from './progress';
import {TOKEN_PROGRAM,type PaymentChain,type Verification} from './chain';
export class ServiceError extends Error{constructor(public status:number,message:string){super(message);}}
export type CommerceConfig={identityUri:string;mint:string;recipient:string;decimals:number;destination:string};
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const iso=(d:Date|string)=>new Date(d).toISOString();
function orderFromRow(r:Record<string,any>):Order{return {id:r.id,wallet:r.wallet,sku:r.sku,status:r.status,cluster:r.cluster,mint:r.mint,tokenProgram:r.token_program,decimals:r.decimals,amount:r.amount,recipient:r.recipient,source:r.source,destination:r.destination,reference:r.reference,memo:r.memo,createdAt:iso(r.created_at),expiresAt:iso(r.expires_at),signature:r.signature,detail:r.detail,...(r.payment_authorization?{payment:r.payment_authorization}:{})};}
export class CommerceService {
 constructor(public pool:Pool,public chain:PaymentChain,public config:CommerceConfig){}
 async challenge(wallet:string):Promise<SignInChallenge>{
  address(wallet);const now=new Date(),expires=new Date(now.getTime()+5*60_000),id=randomUUID();
  const payload:SignInChallenge['payload']={domain:new URL(this.config.identityUri).host,address:wallet,statement:'Sign in to Steal a Seeker on devnet. This does not authorize a payment.',uri:this.config.identityUri,version:'1',chainId:'solana:devnet',nonce:randomBytes(16).toString('hex'),issuedAt:now.toISOString(),expirationTime:expires.toISOString()};
  await this.pool.query('INSERT INTO auth_challenges(id,wallet,payload,expires_at) VALUES($1,$2,$3,$4)',[id,wallet,payload,expires]);return {id,payload};
 }
 async signIn(input:{id:string;wallet:string;signedMessage:string;signature:string}){
  const result=await this.pool.query('SELECT * FROM auth_challenges WHERE id=$1 AND consumed_at IS NULL AND expires_at>now()',[input.id]);const row=result.rows[0];
  if(!row||row.wallet!==input.wallet)throw new ServiceError(401,'Sign-in challenge expired or belongs to another wallet.');
  let valid=false;try{valid=verifySignIn(row.payload,{account:{address:input.wallet,publicKey:new Uint8Array(getAddressEncoder().encode(address(input.wallet))),chains:['solana:devnet'],features:['solana:signIn']},signedMessage:new Uint8Array(Buffer.from(input.signedMessage,'base64')),signature:new Uint8Array(Buffer.from(input.signature,'base64'))});}catch{/* Malformed signatures fail closed. */}
  if(!valid)throw new ServiceError(401,'Wallet signature does not match this sign-in request.');
  const token=randomBytes(32).toString('hex'),expiresAt=new Date(Date.now()+24*3600_000);
  await transaction(this.pool,async db=>{const used=await db.query('UPDATE auth_challenges SET consumed_at=now() WHERE id=$1 AND consumed_at IS NULL AND expires_at>now() RETURNING id',[input.id]);if(!used.rowCount)throw new ServiceError(401,'This sign-in request has already been used.');await db.query('INSERT INTO wallets(address) VALUES($1) ON CONFLICT DO NOTHING',[input.wallet]);await db.query('INSERT INTO sessions(token_hash,wallet,expires_at) VALUES($1,$2,$3)',[hash(token),input.wallet,expiresAt]);});
  return {token,expiresAt:expiresAt.toISOString(),account:await this.me(input.wallet)};
 }
 async authenticate(token:string){const r=await this.pool.query('SELECT wallet FROM sessions WHERE token_hash=$1 AND expires_at>now()',[hash(token)]);if(!r.rowCount)throw new ServiceError(401,'Sign in again to continue.');return r.rows[0].wallet as string;}
 async logout(token:string){await this.pool.query('DELETE FROM sessions WHERE token_hash=$1',[hash(token)]);}
 async me(wallet:string):Promise<AccountState>{const [profile,items]=await Promise.all([this.pool.query('SELECT equipment,progress FROM wallets WHERE address=$1',[wallet]),this.pool.query('SELECT sku FROM entitlements WHERE wallet=$1 ORDER BY sku',[wallet])]);if(!profile.rowCount)throw new ServiceError(404,'Account not found.');return {wallet,...profile.rows[0],entitlements:items.rows.map(r=>r.sku)};}
 async createOrder(wallet:string,sku:ProductId,key:string):Promise<Order>{
  const product=PRODUCTS.find(p=>p.id===sku);if(!product)throw new ServiceError(400,'Unknown product.');
  const existing=await this.pool.query('SELECT * FROM orders WHERE wallet=$1 AND idempotency_key=$2',[wallet,key]);if(existing.rowCount){if(existing.rows[0].sku!==sku)throw new ServiceError(409,'This request key belongs to another product.');return orderFromRow(existing.rows[0]);}
  try{await this.chain.ready();}catch{throw new ServiceError(503,'Devnet payments are not ready. No payment has been requested.');}
  const [source]=await findAssociatedTokenPda({owner:address(wallet),mint:address(this.config.mint),tokenProgram:address(TOKEN_PROGRAM)});
  return transaction(this.pool,async db=>{
   await db.query('SELECT address FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);
   const retry=await db.query('SELECT * FROM orders WHERE wallet=$1 AND idempotency_key=$2',[wallet,key]);if(retry.rowCount){if(retry.rows[0].sku!==sku)throw new ServiceError(409,'This request key belongs to another product.');return orderFromRow(retry.rows[0]);}
   const owned=await db.query('SELECT 1 FROM entitlements WHERE wallet=$1 AND sku=$2',[wallet,sku]);if(owned.rowCount)throw new ServiceError(409,'You already own this item. Restore your purchases.');
   const pending=await db.query("SELECT * FROM orders WHERE wallet=$1 AND sku=$2 AND (status IN ('verifying','needs_review') OR (status='quoted' AND expires_at>now())) ORDER BY created_at DESC LIMIT 1",[wallet,sku]);if(pending.rowCount)return orderFromRow(pending.rows[0]);
   const id=randomUUID(),reference=getBase58Decoder().decode(randomBytes(32)),created=new Date(),expires=new Date(created.getTime()+15*60_000),amount=(BigInt(product.price)*10n**BigInt(this.config.decimals)).toString();
   const r=await db.query(`INSERT INTO orders(id,wallet,sku,idempotency_key,status,cluster,mint,token_program,decimals,amount,recipient,source,destination,reference,memo,created_at,expires_at) VALUES($1,$2,$3,$4,'quoted','solana:devnet',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,[id,wallet,sku,key,this.config.mint,TOKEN_PROGRAM,this.config.decimals,amount,this.config.recipient,source,this.config.destination,reference,`seeker-order:${id}`,created,expires]);return orderFromRow(r.rows[0]);
  });
 }
 async getOrder(wallet:string,id:string){const r=await this.pool.query('SELECT * FROM orders WHERE id=$1 AND wallet=$2',[id,wallet]);if(!r.rowCount)throw new ServiceError(404,'Order not found.');return orderFromRow(r.rows[0]);}
 async orders(wallet:string){return (await this.pool.query('SELECT * FROM orders WHERE wallet=$1 ORDER BY created_at DESC LIMIT 50',[wallet])).rows.map(orderFromRow);}
 async preparePayment(wallet:string,id:string):Promise<Order>{
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
   if(new Date(current.expiresAt).getTime()<=Date.now()){
    const ended=await db.query("UPDATE orders SET status='quoted',payment_authorization=NULL,signature=NULL,detail='Quote and payment lifetime expired. No finalized payment was found; request a new quote.' WHERE id=$1 RETURNING *",[id]);return orderFromRow(ended.rows[0]);
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
   await this.pool.query("UPDATE orders SET status=$2,signature=$3,detail=$4,checked_at=now() WHERE id=$1 AND status IN ('quoted','verifying')",[order.id,result.state==='needs_review'?'needs_review':'verifying',signature,result.detail]);return;
  }
  await transaction(this.pool,async db=>{
   const current=await db.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[order.id]);if(current.rows[0]?.status==='fulfilled')return;
   await db.query('SELECT address FROM wallets WHERE address=$1 FOR UPDATE',[order.wallet]);
   const duplicate=await db.query('SELECT order_id FROM payment_receipts WHERE signature=$1',[signature]);if(duplicate.rowCount&&duplicate.rows[0].order_id!==order.id)throw new ServiceError(409,'Payment already belongs to another order.');
   const owned=await db.query('SELECT 1 FROM entitlements WHERE wallet=$1 AND sku=$2',[order.wallet,order.sku]);
   if(owned.rowCount){await db.query("UPDATE orders SET status='needs_review',signature=$2,detail='Duplicate purchase payment needs a refund review.' WHERE id=$1",[order.id,signature]);return;}
   await db.query('INSERT INTO payment_receipts(signature,order_id,instruction_index,slot) VALUES($1,$2,$3,$4)',[signature,order.id,result.instructionIndex,result.slot]);
   await db.query('INSERT INTO entitlements(wallet,sku,order_id) VALUES($1,$2,$3)',[order.wallet,order.sku,order.id]);
   await db.query("UPDATE orders SET status='fulfilled',signature=$2,detail=NULL,checked_at=now() WHERE id=$1",[order.id,signature]);
   await db.query("UPDATE order_attempts SET state='verified' WHERE order_id=$1 AND signature=$2",[order.id,signature]);
  });
 }
 async reconcile(id:string){const r=await this.pool.query('SELECT * FROM orders WHERE id=$1',[id]);if(!r.rowCount)return;const order=orderFromRow(r.rows[0]);if(order.status==='fulfilled')return;
  const attempts=await this.pool.query("SELECT signature FROM order_attempts WHERE order_id=$1 AND state='pending'",[id]);const signatures=new Set<string>(attempts.rows.map(r=>r.signature));if(order.signature)signatures.add(order.signature);for(const sig of await this.chain.find(order.reference))signatures.add(sig);
  for(const sig of signatures)await this.check(order,sig);await this.pool.query('UPDATE orders SET checked_at=now() WHERE id=$1',[id]);
 }
 async syncProgress(wallet:string,incoming:SyncedProgress){
  await transaction(this.pool,async db=>{const row=await db.query('SELECT progress FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);if(!row.rowCount)throw new ServiceError(404,'Account not found.');const owned=await db.query("SELECT 1 FROM entitlements WHERE wallet=$1 AND sku='campaign'",[wallet]);if(!owned.rowCount)throw new ServiceError(403,'Campaign access is required to sync campaign progress.');const next=mergeProgress(row.rows[0].progress,incoming);await db.query('UPDATE wallets SET progress=$2 WHERE address=$1',[wallet,next]);});return this.me(wallet);
 }
 async equip(wallet:string,sku:ProductId){const product=PRODUCTS.find(p=>p.id===sku);if(!product||product.kind==='access')throw new ServiceError(400,'This item cannot be equipped.');const owned=await this.pool.query('SELECT 1 FROM entitlements WHERE wallet=$1 AND sku=$2',[wallet,sku]);if(!owned.rowCount)throw new ServiceError(403,'You do not own this item.');await this.pool.query('UPDATE wallets SET equipment=equipment || $2::jsonb WHERE address=$1',[wallet,JSON.stringify({[product.kind]:sku})]);return this.me(wallet);}
}
