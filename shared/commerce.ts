import type {PromotionSnapshot} from './promotions';
import {CREDIT_PACKS} from './store';
import type {PaymentCurrency,PriceSnapshot} from './pricing';
import {CAMPAIGN_OFFER,type CampaignTerms} from './economy';
export const PRODUCTS = [
 {id:'campaign',name:'Game Pass',price:CAMPAIGN_OFFER.price,kind:'access',description:'Weekly ranked competition. One purchase per wallet. Campaign and practice are free.'},
 {id:'night-courier',name:'Night Courier',price:20,kind:'outfit',description:'Charcoal and mint courier outfit. Same gameplay stats.'},
 {id:'signal-runner',name:'Frost Runner',price:20,kind:'outfit',description:'Snowflake hood and mint winter trim. Same gameplay stats.'},
 {id:'circuit-scout',name:'Circuit Scout',price:20,kind:'outfit',description:'Mint circuit stripes on charcoal. Same gameplay stats.'},
 {id:'archive-keeper',name:'Archive Keeper',price:20,kind:'outfit',description:'Cream jacket with tan satchel straps. Same gameplay stats.'},
 {id:'solana-toly',name:'Toly',price:100,kind:'outfit',description:'Permanent cosmetic character. Same gameplay stats.'},
 {id:'solana-mert',name:'Mert',price:100,kind:'outfit',description:'Permanent cosmetic character. Same gameplay stats.'},
 {id:'solana-chase',name:'Chase',price:100,kind:'outfit',description:'Permanent cosmetic character. Same gameplay stats.'},
 {id:'solana-lily',name:'Lily',price:100,kind:'outfit',description:'Permanent cosmetic character. Same gameplay stats.'},
 {id:'solana-vibhu',name:'Vibhu',price:100,kind:'outfit',description:'Permanent cosmetic character. Same gameplay stats.'},
 {id:'solana-akshay',name:'Akshay Rajan',price:100,kind:'outfit',description:'Permanent cosmetic character. Same gameplay stats.'},
 {id:'solana-beeman',name:'Beeman',price:100,kind:'outfit',description:'Permanent cosmetic character. Same gameplay stats.'},
 {id:'escape-trail',name:'Escape trail',price:8,kind:'trail',description:'A mint trail during escape. Cosmetic only.'},
 {id:'profile-frame',name:'Profile frame',price:5,kind:'frame',description:'A frame for your player profile.'},
 {id:'rack-theme',name:'Rack theme',price:12,kind:'rack',description:'A new finish for your collection rack.'},
 ...CREDIT_PACKS.map(p=>({id:p.id,name:`${p.credits.toLocaleString()} credits`,price:p.usdCents,kind:'credits' as const,description:'Game currency for outfits and gear. No cash value.'})),
] as const;
export type ProductId=typeof PRODUCTS[number]['id'];
export type OrderStatus='quoted'|'verifying'|'fulfilled'|'needs_review';
export type PaymentAuthorization={id:string;blockhash:string;lastValidBlockHeight:string;contextSlot:string};
export type PaymentQuote={currency?:PaymentCurrency;pricing?:PriceSnapshot;id:string;wallet:string;cluster:'solana:devnet'|'solana:mainnet';mint:string;tokenProgram:string;decimals:number;amount:string;recipient:string;source:string;destination:string;reference:string;memo:string;createdAt:string;expiresAt:string;signature:string|null;detail:string|null;payment?:PaymentAuthorization};
export type Order=PaymentQuote&{sku:ProductId;status:OrderStatus;campaignTerms?:CampaignTerms;promotion?:PromotionSnapshot};
export type AccountState={wallet:string;credits?:number;creditStars?:Record<string,number>;entitlements:ProductId[];equipment:Record<string,string>;progress:Record<string,unknown>};
export type SignInChallenge={id:string;payload:{domain:string;address:string;statement:string;uri:string;version:'1';chainId:'solana:devnet'|'solana:mainnet';nonce:string;issuedAt:string;expirationTime:string}};
export function tokenAmount(amount:string,decimals:number){const n=BigInt(amount),scale=10n**BigInt(decimals);return `${n/scale}${n%scale?'.'+(n%scale).toString().padStart(decimals,'0').replace(/0+$/,''):''}`;}
