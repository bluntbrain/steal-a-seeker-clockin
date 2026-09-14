import {CAMPAIGN_OFFER,type CampaignPerformance} from '../../shared/economy';
import {CAMPAIGN_IDS} from '../game/level';
import {useSyncExternalStore} from 'react';
import {PRODUCTS,type ProductId} from '../../shared/commerce';
import type {PaidEntry} from '../../shared/paid';
import type {RunTicket} from '../../shared/ranked';
export type LocalResult={id:string;kind:'entry'|'daily';day:string;status:string;score:number;seconds:number;returned:number};
export type PlaytestState={version:1;trialUsed?:boolean;campaignRuns?:CampaignPerformance[];rebateClaimed?:boolean;offerVersion?:string;balance:number;owned:ProductId[];equipment:Record<string,string>;receipts:{id:string;label:string;amount:number}[];entry:PaidEntry|null;daily:RunTicket|null;results:LocalResult[]};
export const PLAYTEST_KEY='seeker.browser-playtest.v1',PLAYTEST_WALLET='browser-playtest';
export const freshPlaytest=():PlaytestState=>({version:1,balance:250,owned:[],equipment:{},receipts:[],entry:null,daily:null,results:[]});
export function purchase(s:PlaytestState,sku:ProductId):PlaytestState{const p=PRODUCTS.find(p=>p.id===sku);if(!p)throw new Error('Unknown item.');if(s.owned.includes(sku))return s;if(s.balance<p.price)throw new Error('Not enough playtest credits.');return {...s,...(sku==='campaign'?{offerVersion:'weekly-pass-v1'}:{}),balance:s.balance-p.price,owned:[...s.owned,sku],receipts:[{id:`buy:${sku}`,label:p.name,amount:-p.price},...s.receipts]};}
export function equip(s:PlaytestState,sku:ProductId):PlaytestState{const p=PRODUCTS.find(p=>p.id===sku);if(!p||!s.owned.includes(sku)||p.kind==='access')throw new Error('Buy this cosmetic first.');return {...s,equipment:{...s.equipment,[p.kind]:sku}};}
export function finish(s:PlaytestState,r:LocalResult):PlaytestState{if(s.results.some(old=>old.id===r.id))return s;const active=r.kind==='entry'?s.entry?.id:s.daily?.id;if(active!==r.id)throw new Error('This is not the active local run.');const returned=r.kind==='entry'&&r.status==='won'?10:0;return {...s,balance:s.balance+returned,entry:r.kind==='entry'?null:s.entry,daily:r.kind==='daily'?null:s.daily,results:[{...r,returned},...s.results].slice(0,100),receipts:r.kind==='entry'?[{id:`return:${r.id}`,label:`Entry ${r.status}`,amount:returned},...s.receipts]:s.receipts};}
let state:PlaytestState|undefined;const listeners=new Set<()=>void>();
export function readPlaytest(){if(!state){const raw=localStorage.getItem(PLAYTEST_KEY);const parsed=raw?JSON.parse(raw):freshPlaytest();if(parsed.version!==1||!Number.isSafeInteger(parsed.balance)||parsed.balance<0||!Array.isArray(parsed.owned)||!Array.isArray(parsed.results)||!Array.isArray(parsed.receipts)||!parsed.equipment)throw new Error('Browser playtest save could not be loaded. It has been kept.');state=parsed;}return state!;}
export function changePlaytest(fn:(s:PlaytestState)=>PlaytestState){const next=fn(readPlaytest());localStorage.setItem(PLAYTEST_KEY,JSON.stringify(next));state=next;listeners.forEach(l=>l());return next;}
export function usePlaytest(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},readPlaytest,readPlaytest);}

export function recordCampaign(s:PlaytestState,run:CampaignPerformance):PlaytestState{
 if(!s.owned.includes('campaign')||!CAMPAIGN_IDS.includes(run.mission as any))return s;
 const old=s.campaignRuns??[];
 // Only the best complete run per mission is needed for a local scorecard.
 const prior=old.find(r=>r.mission===run.mission);
 if(prior&&(prior.score>run.score||(prior.score===run.score&&prior.ticks<=run.ticks)))return s;
 return {...s,campaignRuns:[...old.filter(r=>r.mission!==run.mission),run]};
}
export function claimRebate(s:PlaytestState):PlaytestState{
 if(s.rebateClaimed)return s;
 if(!s.owned.includes('campaign')||s.offerVersion!==CAMPAIGN_OFFER.version||!CAMPAIGN_IDS.every(id=>s.campaignRuns?.some(r=>r.mission===id)))throw new Error('Complete all 12 missions with this campaign pass first.');
 return {...s,rebateClaimed:true,balance:s.balance+CAMPAIGN_OFFER.rebate,receipts:[{id:'campaign-rebate-v2',label:'12-mission completion rebate',amount:CAMPAIGN_OFFER.rebate},...s.receipts]};
}
