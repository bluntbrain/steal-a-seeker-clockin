import type {ProductId} from './commerce';
import type {ProductPricing,PriceSnapshot} from './pricing';
/** Public offer metadata. Never includes the redeemable code. */
export type PromotionOffer={id:string;label:string;percentOff:number;sku:ProductId;bonusSkus:ProductId[];expiresAt:string};
export type PromotionPreview=PromotionOffer&{pricing?:ProductPricing};
export type PromotionSnapshot=PromotionOffer&{originalAmount:string;originalUsdCents?:number};
export function discountedPrice(price:PriceSnapshot,percentOff:number):PriceSnapshot{
 if(!Number.isInteger(percentOff)||percentOff<1||percentOff>=100)throw Error('Invalid paid discount');
 return {...price,amount:((BigInt(price.amount)*BigInt(100-percentOff)+99n)/100n).toString(),usdCents:Math.ceil(price.usdCents*(100-percentOff)/100)};
}
