// Credits are non-transferable game currency. Only server receipts fund wallet balances.
export const CREDIT_PACKS=[
 {id:'credits-500',name:'Pocket stash',credits:500,usdCents:100},
 {id:'credits-1500',name:'Courier stash',credits:1500,usdCents:250},
 {id:'credits-3500',name:'Vault stash',credits:3500,usdCents:500},
] as const;
export const STORE_ITEMS=[
 {id:'night-courier',name:'Night Courier',price:300,kind:'outfit',description:'Charcoal hood. Mint seams.'},
 {id:'signal-runner',name:'Signal Runner',price:400,kind:'outfit',description:'Ivory hood. Signal-orange trim.'},
 {id:'escape-trail',name:'Escape trail',price:200,kind:'trail',description:'A mint trail behind your courier.'},
 {id:'profile-frame',name:'Courier frame',price:150,kind:'frame',description:'A mint finish for your profile.'},
 {id:'rack-theme',name:'Vault finish',price:250,kind:'rack',description:'A mint-lit finish for your collection.'},
] as const;
export type StoreItemId=typeof STORE_ITEMS[number]['id'];
export type CreditPackId=typeof CREDIT_PACKS[number]['id'];
export function creditReward(stars:number){return stars>=1&&stars<=3&&Number.isInteger(stars)?100+(stars-1)*25:0;}
export type LocalInventory={version:1;balance:number;stars:Record<string,number>;owned:StoreItemId[];equipment:Record<string,string>};
export const emptyInventory=():LocalInventory=>({version:1,balance:0,stars:{},owned:[],equipment:{}});
export function earnCredits(s:LocalInventory,mission:string,stars:number):LocalInventory{const old=s.stars[mission]??0,delta=creditReward(stars)-creditReward(old);return delta>0?{...s,balance:s.balance+delta,stars:{...s.stars,[mission]:stars}}:s;}
export function redeemCredits(s:LocalInventory,id:StoreItemId):LocalInventory{const item=STORE_ITEMS.find(i=>i.id===id);if(!item)throw Error('Unknown item.');if(s.owned.includes(id))return s;if(s.balance<item.price)throw Error('Not enough credits.');return {...s,balance:s.balance-item.price,owned:[...s.owned,id],equipment:{...s.equipment,[item.kind]:id}};}
