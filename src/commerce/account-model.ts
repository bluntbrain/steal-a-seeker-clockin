import {NETWORK_NAME} from '../wallet/config';
import {PRODUCTS,type AccountState} from '../../shared/commerce';
export const accountKey=(wallet:string)=>`seeker.account.${NETWORK_NAME}.${wallet}`;
export const sessionKey=(wallet:string)=>`seeker.commerce.${NETWORK_NAME}.${wallet}`;
export const progressKey=(wallet?:string)=>wallet?`seeker.campaign.${NETWORK_NAME}.${wallet}.v1`:'seeker.campaign.progress.v1';
// Only write this cache after an authenticated server response. It grants local
// offline campaign access; the server rechecks ownership for every online action.
export function readAccount(value:unknown,wallet:string):AccountState|undefined{
 if(!value||typeof value!=='object')return;
 const a=value as AccountState;
 if(a.wallet!==wallet||!Array.isArray(a.entitlements)||!a.entitlements.every(id=>PRODUCTS.some(p=>p.id===id))||!a.equipment||typeof a.equipment!=='object'||!a.progress||typeof a.progress!=='object')return;
 const equipment:Record<string,string>={};
 for(const p of PRODUCTS)if(a.entitlements.includes(p.id)&&a.equipment[p.kind]===p.id)equipment[p.kind]=p.id;
 // The authenticated server grants this outfit through league achievements, not the shop.
 if(a.equipment.outfit==='ghost-courier')equipment.outfit='ghost-courier';
 return {wallet,entitlements:[...new Set(a.entitlements)],equipment,progress:a.progress};
}
