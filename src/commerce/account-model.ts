import {PRODUCTS,type AccountState} from '../../shared/commerce';
export const accountKey=(wallet:string)=>`seeker.account.devnet.${wallet}`;
export const sessionKey=(wallet:string)=>`seeker.commerce.devnet.${wallet}`;
export const progressKey=(wallet?:string)=>wallet?`seeker.campaign.devnet.${wallet}.v1`:'seeker.campaign.progress.v1';
// Only write this cache after an authenticated server response. It grants local
// offline campaign access; the server rechecks ownership for every online action.
export function readAccount(value:unknown,wallet:string):AccountState|undefined{
 if(!value||typeof value!=='object')return;
 const a=value as AccountState;
 if(a.wallet!==wallet||!Array.isArray(a.entitlements)||!a.entitlements.every(id=>PRODUCTS.some(p=>p.id===id))||!a.equipment||typeof a.equipment!=='object'||!a.progress||typeof a.progress!=='object')return;
 const equipment:Record<string,string>={};
 for(const p of PRODUCTS)if(a.entitlements.includes(p.id)&&a.equipment[p.kind]===p.id)equipment[p.kind]=p.id;
 return {wallet,entitlements:[...new Set(a.entitlements)],equipment,progress:a.progress};
}
