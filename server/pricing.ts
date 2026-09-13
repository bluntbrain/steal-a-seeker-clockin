import {PRODUCTS,type ProductId} from '../shared/commerce';
import {CAMPAIGN_USD_CENTS,type PaymentCurrency,type PriceSnapshot,type ProductPricing} from '../shared/pricing';
const SCALE=1_000_000_000n;
const ceil=(a:bigint,b:bigint)=>(a+b-1n)/b;
export function rateUnits(rate:string){
 if(!/^\d+(\.\d{1,9})?$/.test(rate))throw new Error('Invalid market rate.');
 const [whole,fraction='']=rate.split('.'),value=BigInt(whole!)*SCALE+BigInt(fraction.padEnd(9,'0'));
 if(value<=0n)throw new Error('Invalid market rate.');return value;
}
export type Rates={SKR:string;SOL:string;at:number};
export function priceProduct(sku:ProductId,currency:PaymentCurrency,rates:Rates,skrDecimals:number,now=Date.now()):PriceSnapshot{
 if(now-rates.at>60000||rates.at>now+5000)throw new Error('Market rate expired.');
 const product=PRODUCTS.find(p=>p.id===sku);if(!product)throw new Error('Unknown product.');
 const skrRate=rateUnits(rates.SKR),rate=rateUnits(rates[currency]);
 const target=sku==='campaign'?BigInt(CAMPAIGN_USD_CENTS)*SCALE/100n:BigInt(product.price)*skrRate;
 const decimals=currency==='SOL'?9:skrDecimals,scale=10n**BigInt(decimals),step=currency==='SOL'?100_000n:scale;
 const amount=ceil(target*scale,rate*step)*step;
 if(amount<=0n||amount>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Quote outside supported limits.');
 return {currency,amount:String(amount),decimals,usdCents:Number(ceil(amount*rate*100n,scale*SCALE)),rateUsd:rates[currency],quotedAt:new Date(rates.at).toISOString(),source:'Coinbase spot'};
}
export interface PriceFeed{rates():Promise<Rates>}
export class CoinbasePriceFeed implements PriceFeed{
 private cached?:Rates;private pending?:Promise<Rates>;
 constructor(private fetcher:typeof fetch=fetch,private now=Date.now){}
 async rates():Promise<Rates>{
  if(this.cached&&this.now()-this.cached.at<60000)return this.cached;
  if(this.pending)return this.pending;
  this.pending=(async()=>{const at=this.now();const values=await Promise.all((['SKR','SOL'] as const).map(async currency=>{
   const r=await this.fetcher(`https://api.coinbase.com/v2/prices/${currency}-USD/spot`,{signal:AbortSignal.timeout(8000)});
   if(!r.ok)throw new Error('Market prices unavailable.');const body=await r.json() as {data?:{base?:string;currency?:string;amount?:string}};
   if(body.data?.base!==currency||body.data.currency!=='USD'||!body.data.amount)throw new Error('Invalid price response.');rateUnits(body.data.amount);return body.data.amount;
  }));const next={SKR:values[0]!,SOL:values[1]!,at};this.cached=next;return next;})();
  try{return await this.pending;}finally{this.pending=undefined;}
 }
}
export async function productPricing(sku:ProductId,feed:PriceFeed,decimals:number):Promise<ProductPricing>{const rates=await feed.rates();return {sku,expiresAt:new Date(rates.at+60000).toISOString(),options:(['SKR','SOL'] as const).map(currency=>priceProduct(sku,currency,rates,decimals))};}
