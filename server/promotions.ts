import {z} from 'zod';
import type {PoolClient} from 'pg';
import {PRODUCTS,type ProductId} from '../shared/commerce';
import type {PromotionOffer} from '../shared/promotions';
import {RETIRED_ITEMS} from '../shared/store';
import {ServiceError} from './service';
const sku=z.enum(PRODUCTS.filter(p=>p.kind!=='credits'&&!RETIRED_ITEMS.includes(p.id)).map(p=>p.id) as [ProductId,...ProductId[]]);
const schema=z.array(z.object({id:z.string().regex(/^[a-z0-9-]{1,50}$/),code:z.string().trim().min(4).max(64).regex(/^[A-Za-z0-9_-]+$/).transform(v=>v.toUpperCase()),label:z.string().min(1).max(80),percentOff:z.number().int().min(1).max(100),sku,bonusSkus:z.array(sku).max(20).default([]),startsAt:z.iso.datetime(),expiresAt:z.iso.datetime(),maxRedemptions:z.number().int().positive().max(100000),enabled:z.boolean().default(true)}).strict()).max(30);
export type PromotionConfig=z.infer<typeof schema>[number];
export function parsePromotions(raw:string|undefined):PromotionConfig[]{
 try{const entries=schema.parse(JSON.parse(raw||'[]'));if(new Set(entries.map(p=>p.id)).size!==entries.length||new Set(entries.map(p=>p.code)).size!==entries.length||entries.some(p=>Date.parse(p.expiresAt)<=Date.parse(p.startsAt)||p.bonusSkus.some(id=>!id.startsWith('solana-'))))throw Error();return entries;}
 catch{throw Error('Invalid PROMOTIONS_JSON configuration. Check offer fields and unique IDs; values are not logged.');}
}
export function resolvePromotion(entries:PromotionConfig[],code:string,sku:ProductId){const p=entries.find(p=>p.code===code.trim().toUpperCase());if(!p||p.sku!==sku)throw new ServiceError(400,'This code is not valid for this item.');return p;}
export function activePromotion(p:PromotionConfig){const now=Date.now();if(!p.enabled||now<Date.parse(p.startsAt)||now>=Date.parse(p.expiresAt))throw new ServiceError(400,'This offer is not active or has expired.');}
export function publicOffer(p:PromotionConfig):PromotionOffer{return {id:p.id,label:p.label,percentOff:p.percentOff,sku:p.sku,bonusSkus:p.bonusSkus,expiresAt:p.expiresAt};}
/** All capacity changes are serialized across replicas. Wallet lock is acquired first by callers. */
export async function reservePromotion(db:PoolClient,p:PromotionConfig,wallet:string,orderId:string|null){
 await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`promotion:${p.id}`]);
 activePromotion(p);
 // Never release an approval that can still settle. preparePayment clears it only after finalized reconciliation.
 await db.query(`UPDATE promotion_redemptions r SET state='released',updated_at=now() FROM orders o WHERE r.order_id=o.id AND r.promotion_id=$1 AND r.state='reserved' AND o.status='quoted' AND o.expires_at<=now() AND o.payment_authorization IS NULL AND o.signature IS NULL`,[p.id]);
 const old=await db.query('SELECT state FROM promotion_redemptions WHERE promotion_id=$1 AND wallet=$2',[p.id,wallet]);
 if(old.rows[0]?.state==='granted')throw new ServiceError(409,'This wallet has already used this offer.');
 if(old.rows[0]?.state==='reserved')throw new ServiceError(409,'This offer is reserved for an existing payment. Check that payment first.');
 const count=await db.query("SELECT count(*) FROM promotion_redemptions WHERE promotion_id=$1 AND state IN ('granted','reserved')",[p.id]);
 if(Number(count.rows[0].count)>=p.maxRedemptions)throw new ServiceError(409,'This offer has been fully claimed.');
 await db.query(`INSERT INTO promotion_redemptions(promotion_id,wallet,state,order_id,granted_skus) VALUES($1,$2,$3,$4,$5) ON CONFLICT(promotion_id,wallet) DO UPDATE SET state=EXCLUDED.state,order_id=EXCLUDED.order_id,granted_skus=EXCLUDED.granted_skus,updated_at=now()`,[p.id,wallet,orderId?'reserved':'granted',orderId,JSON.stringify(orderId?[]:[p.sku,...p.bonusSkus])]);
}
