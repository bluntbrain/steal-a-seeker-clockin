import React,{createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useAccount} from './account-context';
import {commerceApi,ApiError,type StoreCatalog} from './client';
import {AppState} from 'react-native';
import {readSave,writeSave} from '../progress/storage';
import {NETWORK_NAME} from '../wallet/config';
import {emptyInventory,earnCredits,redeemCredits,STORE_ITEMS,type LocalInventory,type StoreItemId} from '../../shared/store';
import {CAMPAIGN_IDS} from '../game/level';
import CreditStore from './CreditStore';
import WalletPanel from '../wallet/WalletPanel';
import type {ProductId} from '../../shared/commerce';
import {changePlaytest} from '../playtest/store';
type StoreItem=Omit<typeof STORE_ITEMS[number],'price'>&{price:number};
type EquipmentSlot='outfit'|'trail'|'frame'|'rack';
export type Economy={items:StoreItem[];catalog:StoreCatalog|null;syncGhost:()=>Promise<void>;unequip:(slot:EquipmentSlot)=>Promise<void>;tab:'map'|'leaderboard'|'rack';setTab:(tab:'map'|'leaderboard'|'rack')=>void;balance:number;ready:boolean;local:boolean;owned:readonly string[];equipment:Record<string,string>;notice:string;openCredits:()=>void;openPass:()=>void;redeem:(sku:StoreItemId)=>Promise<void>;equip:(sku:StoreItemId)=>Promise<void>;earn:(mission:string,stars:number)=>Promise<number>};
const Context=createContext<Economy|undefined>(undefined);
export function useEconomy(){const c=useContext(Context);if(!c)throw Error('EconomyProvider missing');return c;}
export default function EconomyProvider({children}:{children:ReactNode}){
 const [tab,setTab]=useState<'map'|'leaderboard'|'rack'>('map');
 const account=useAccount(),local=account.preview||!account.wallet,key=`seeker.inventory.${NETWORK_NAME}.${account.preview?'browser':'guest'}.v3`;
 const [saved,setSaved]=useState<LocalInventory>(emptyInventory),[ready,setReady]=useState(false),[notice,setNotice]=useState(''),[creditsOpen,setCreditsOpen]=useState(false),[checkout,setCheckout]=useState<ProductId|null>(null);
 const [catalog,setCatalog]=useState<StoreCatalog|null>(null);
 const refreshCatalog=useCallback(async()=>{if(account.preview)return;try{setCatalog(await commerceApi.catalog());}catch{/* Checkout and redemption still require backend validation. */}},[account.preview]);
 useEffect(()=>{void refreshCatalog();const sub=AppState.addEventListener('change',state=>{if(state==='active')void refreshCatalog();});return()=>sub.remove();},[refreshCatalog,tab,creditsOpen]);
 const items:StoreItem[]=STORE_ITEMS.map(item=>{const price=catalog?.creditStore?.find(i=>i.id===item.id)?.price;return {...item,price:price!==undefined&&Number.isSafeInteger(price)&&price>0?price:item.price};});
 const current=useRef(saved),writes=useRef(Promise.resolve()),generation=useRef(0);
 useEffect(()=>{const g=++generation.current;setReady(false);void readSave(key).then(raw=>{if(g!==generation.current)return;const v:LocalInventory=raw?JSON.parse(raw):emptyInventory();if(v.version!==1||!Number.isSafeInteger(v.balance)||v.balance<0||!Array.isArray(v.owned)||!v.stars||!v.equipment)throw Error('Credit save needs attention.');current.current=v;setSaved(v);setReady(true);}).catch(()=>{if(g===generation.current)setNotice('Could not restore credits. Your save is kept.');});return()=>{generation.current++;};},[key]);
 const mutate=useCallback(async(fn:(s:LocalInventory)=>LocalInventory)=>{const g=generation.current;let delta=0;const task=writes.current.catch(()=>{}).then(async()=>{if(g!==generation.current)throw Error('Account changed.');const before=current.current,next=fn(before);delta=next.balance-before.balance;await writeSave(key,JSON.stringify(next));if(g===generation.current){current.current=next;setSaved(next);}});writes.current=task;await task;return delta;},[key]);
 const owned=local?[...new Set([...saved.owned,...(account.account?.entitlements??[])])]:account.account?.entitlements??[];
 const equipment=local?{...account.account?.equipment,...saved.equipment}:account.account?.equipment??{};
 async function redeem(sku:StoreItemId){if(!ready)throw Error('Restoring credits…');const price=items.find(i=>i.id===sku)!.price;if(local){await mutate(s=>redeemCredits(s,sku,price));}else{const session=await account.session();try{await account.update(await commerceApi.redeem(session.token,sku,price));}catch(error){if(error instanceof ApiError&&error.status===409)await refreshCatalog();throw error;}}}
 async function equip(sku:StoreItemId){const item=STORE_ITEMS.find(i=>i.id===sku)!;if(!owned.includes(sku))throw Error('Unlock this item first.');if(local)await mutate(s=>({...s,equipment:{...s.equipment,[item.kind]:sku}}));else{const session=await account.session();await account.update(await commerceApi.equip(session.token,sku));}}
 async function unequip(slot:EquipmentSlot){if(local)await mutate(s=>({...s,equipment:{...s.equipment,[slot]:''}}));else{const session=await account.session();await account.update(await commerceApi.unequip(session.token,slot));}}
 async function earn(mission:string,stars:number){if(!local||!ready||!CAMPAIGN_IDS.includes(mission as any))return 0;return mutate(s=>earnCredits(s,mission,stars));}
 // The native wallet can change while checkout is open. The checkout itself
 // reconciles the wallet-bound order; a browser purchase is explicitly a demo.
 const value:Economy={items,catalog,syncGhost:async()=>{if(account.preview)await mutate(s=>({...s,equipment:{...s.equipment,outfit:'ghost-courier'}}));},tab,setTab,balance:local?saved.balance:account.account?.credits??0,ready:local?ready:!!account.account,local,owned,equipment,notice,redeem,equip,unequip,earn,openCredits:()=>setCreditsOpen(true),openPass:()=>setCheckout('campaign')};
 return <Context.Provider value={value}>{children}<CreditStore visible={creditsOpen} onClose={()=>setCreditsOpen(false)} onBuy={sku=>setCheckout(sku)}/>{checkout&&<WalletPanel key={checkout} visible checkout sku={checkout} fullScreen onClose={()=>setCheckout(null)} onDemoComplete={async credits=>{if(!account.preview)throw Error('Demo top-ups are unavailable in the Android app.');if(credits)await mutate(s=>({...s,balance:s.balance+credits}));else changePlaytest(s=>({...s,owned:[...new Set([...s.owned,'campaign' as const])]}));}}/>}</Context.Provider>;
}
