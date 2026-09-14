export type PaymentCurrency='SKR'|'SOL';
export type PriceSnapshot={currency:PaymentCurrency;usdCents:number;rateUsd:string;quotedAt:string;source:'Coinbase spot';amount:string;decimals:number};
export type ProductPricing={campaignOffer?:{usdCents:number;rebateSkr:number;missions:number;cluster:string};sku:string;expiresAt:string;options:PriceSnapshot[]};
export const CAMPAIGN_USD_CENTS=1000;
export const paymentCurrency=(value:{currency?:PaymentCurrency})=>value.currency??'SKR';
export const currencyLabel=(currency:PaymentCurrency,mainnet=false)=>currency==='SOL'?(mainnet?'SOL':'devnet SOL'):(mainnet?'SKR':'TEST SKR');
export const usdLabel=(cents:number)=>`$${(cents/100).toFixed(2)}`;
