// Credits are non-transferable game currency. Only server receipts fund wallet balances.
export const CREDIT_PACKS=[
 {id:'credits-500',name:'Pocket stash',credits:500,usdCents:100},
 {id:'credits-1500',name:'Courier stash',credits:1500,usdCents:250},
 {id:'credits-3500',name:'Vault stash',credits:3500,usdCents:500},
] as const;
export const STORE_ITEMS=[
 {id:'night-courier',name:'Night Courier',price:300,kind:'outfit',description:'Charcoal hood and dark backpack.'},
 {id:'signal-runner',name:'Frost Runner',price:400,kind:'outfit',description:'Snowflake hood. Mint winter trim.'},
 {id:'circuit-scout',name:'Circuit Scout',price:500,kind:'outfit',description:'Mint circuit stripes on charcoal.'},
 {id:'archive-keeper',name:'Archive Keeper',price:600,kind:'outfit',description:'Cream jacket and tan satchel straps.'},
 {id:'solana-toly',name:'Toly',price:3000,kind:'outfit',description:'Premium character skin. Same gameplay stats.'},
 {id:'solana-mert',name:'Mert',price:3000,kind:'outfit',description:'Premium character skin. Same gameplay stats.'},
 {id:'solana-chase',name:'Chase',price:3000,kind:'outfit',description:'Premium character skin. Same gameplay stats.'},
 {id:'solana-lily',name:'Lily',price:3000,kind:'outfit',description:'Premium character skin. Same gameplay stats.'},
 {id:'solana-vibhu',name:'Vibhu',price:3000,kind:'outfit',description:'Premium character skin. Same gameplay stats.'},
 {id:'solana-akshay',name:'Akshay Rajan',price:3000,kind:'outfit',description:'Premium character skin. Same gameplay stats.'},
 {id:'solana-beeman',name:'Beeman',price:3000,kind:'outfit',description:'Premium character skin. Same gameplay stats.'},
 {id:'escape-trail',name:'Escape trail',price:300,kind:'trail',description:'Mint light follows you while carrying the phone. No speed boost.'},
 {id:'profile-frame',name:'Courier frame',price:150,kind:'frame',description:'A mint finish for your profile.'},
 {id:'rack-theme',name:'Vault finish',price:250,kind:'rack',description:'A mint-lit finish for your collection.'},
] as const;
export type StoreItemId=typeof STORE_ITEMS[number]['id'];
export const RETIRED_ITEMS:readonly string[]=['escape-trail','profile-frame','rack-theme'];
export const isStoreItemForSale=(id:string)=>STORE_ITEMS.some(i=>i.id===id)&&!RETIRED_ITEMS.includes(id);
export type CreditPackId=typeof CREDIT_PACKS[number]['id'];
// The 300-credit starter outfit takes five perfect clears or six basic clears.
// Replay upgrades earn only the extra stars; existing balances are never reset.
export const CAMPAIGN_CLEAR_CREDITS=50;
export const CAMPAIGN_STAR_BONUS=5;
export function creditReward(stars:number){return stars>=1&&stars<=3&&Number.isInteger(stars)?CAMPAIGN_CLEAR_CREDITS+(stars-1)*CAMPAIGN_STAR_BONUS:0;}
export type LocalInventory={version:1;balance:number;stars:Record<string,number>;owned:StoreItemId[];equipment:Record<string,string>};
export const emptyInventory=():LocalInventory=>({version:1,balance:0,stars:{},owned:[],equipment:{}});
export function earnCredits(s:LocalInventory,mission:string,stars:number):LocalInventory{const old=s.stars[mission]??0,delta=creditReward(stars)-creditReward(old);return delta>0?{...s,balance:s.balance+delta,stars:{...s.stars,[mission]:stars}}:s;}
export function redeemCredits(s:LocalInventory,id:StoreItemId,priceOverride?:number):LocalInventory{const item=STORE_ITEMS.find(i=>i.id===id);if(!item)throw Error('Unknown item.');if(s.owned.includes(id))return s;if(!isStoreItemForSale(id))throw Error('This item is no longer for sale.');const price=priceOverride??item.price;if(!Number.isSafeInteger(price)||price<=0)throw Error('Invalid store price.');if(s.balance<price)throw Error('Not enough credits.');return {...s,balance:s.balance-price,owned:[...s.owned,id],equipment:{...s.equipment,[item.kind]:id}};}
