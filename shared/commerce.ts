export const PRODUCTS = [
 {id:'campaign',name:'Campaign pass',price:50,kind:'access',description:'All 12 missions and unlimited normal retries. One purchase per wallet.'},
 {id:'night-courier',name:'Night Courier',price:20,kind:'outfit',description:'Charcoal and mint courier outfit. Same gameplay stats.'},
 {id:'signal-runner',name:'Signal Runner',price:20,kind:'outfit',description:'Ivory courier with signal-orange trim. Same gameplay stats.'},
 {id:'escape-trail',name:'Escape trail',price:8,kind:'trail',description:'A mint trail during escape. Cosmetic only.'},
 {id:'profile-frame',name:'Profile frame',price:5,kind:'frame',description:'A frame for your player profile.'},
 {id:'rack-theme',name:'Rack theme',price:12,kind:'rack',description:'A new finish for your collection rack.'},
] as const;
export type ProductId=typeof PRODUCTS[number]['id'];
export type OrderStatus='quoted'|'verifying'|'fulfilled'|'needs_review';
export type PaymentAuthorization={id:string;blockhash:string;lastValidBlockHeight:string;contextSlot:string};
export type Order={id:string;wallet:string;sku:ProductId;status:OrderStatus;cluster:'solana:devnet';mint:string;tokenProgram:string;decimals:number;amount:string;recipient:string;source:string;destination:string;reference:string;memo:string;createdAt:string;expiresAt:string;signature:string|null;detail:string|null;payment?:PaymentAuthorization};
export type AccountState={wallet:string;entitlements:ProductId[];equipment:Record<string,string>;progress:Record<string,unknown>};
export type SignInChallenge={id:string;payload:{domain:string;address:string;statement:string;uri:string;version:'1';chainId:'solana:devnet';nonce:string;issuedAt:string;expirationTime:string}};
export function tokenAmount(amount:string,decimals:number){const n=BigInt(amount),scale=10n**BigInt(decimals);return `${n/scale}${n%scale?'.'+(n%scale).toString().padStart(decimals,'0').replace(/0+$/,''):''}`;}
