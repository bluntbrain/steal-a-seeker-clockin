import {createOutbox} from './outbox';
import {NETWORK_NAME} from '../wallet/config';
import {api} from '../commerce/client';
import type {CampaignSummary,CampaignRank} from '../../shared/economy';
import type {Replay} from '../../shared/replay';
import type {MissionId} from '../game/level';
import {readSave,writeSave} from '../progress/storage';
import rules from '../../shared/rules-manifest.json';
import {campaignLevelKey} from '../../shared/campaign-levels';
import {BUNDLED_LEVELS,isPublishedLevel,type PublishedLevel} from './levels';
export type CampaignTarget={mission:MissionId}|{level:number};
type Pending={mission?:MissionId;level?:number;rulesHash:string;replay:Replay};
export const pendingKey=(item:Pending)=>item.level!==undefined?campaignLevelKey(item.level):item.mission!;
const key=(wallet:string)=>`seeker.campaign.outbox.${NETWORK_NAME}.${wallet}`;
const outbox=createOutbox<Pending,CampaignSummary>({
 read:async wallet=>{const raw=await readSave(key(wallet));return raw?JSON.parse(raw):[];},
 write:(wallet,items)=>writeSave(key(wallet),JSON.stringify(items)),
 send:(token,item)=>api<CampaignSummary>('/campaign/runs',{token,body:item}),
});
const pending=(target:CampaignTarget,replay:Replay):Pending=>({...target,rulesHash:rules.rulesHash,replay});
export const campaignApi={summary:(token:string)=>api<CampaignSummary>('/campaign',{token}),board:()=>api<CampaignRank[]>('/campaign/leaderboard'),claim:(token:string)=>api<CampaignSummary>('/campaign/claim',{token,body:{}})};
export async function enqueue(wallet:string,target:CampaignTarget,replay:Replay){await outbox.enqueue(wallet,pending(target,replay));}
export async function submitCampaignRun(wallet:string,token:string,target:CampaignTarget,replay:Replay){return outbox.submit(wallet,token,pending(target,replay));}
export async function syncCampaign(wallet:string,token:string,onAward?:(mission:string,credits:number|null)=>void){await outbox.flush(wallet,token,(item,receipt)=>onAward?.(pendingKey(item),receipt.creditAward?.credits??null));return campaignApi.summary(token);}

// published levels: the bundle ships the first batch, the cache holds later batches, the api adds new ones
const LEVELS_KEY=`seeker.campaign.levels.${NETWORK_NAME}`;
let published:PublishedLevel[]=BUNDLED_LEVELS;const listeners=new Set<()=>void>();
const bundledTop=BUNDLED_LEVELS[BUNDLED_LEVELS.length-1]?.number??12;
const merge=(extra:unknown[])=>{const byNumber=new Map(published.map(l=>[l.number,l] as const));for(const l of extra)if(isPublishedLevel(l)&&!byNumber.has(l.number))byNumber.set(l.number,l);return [...byNumber.values()].sort((a,b)=>a.number-b.number);};
const setPublished=(next:PublishedLevel[])=>{if(next.length===published.length)return;published=next;for(const l of listeners)l();};
export const publishedLevels={subscribe:(l:()=>void)=>{listeners.add(l);return()=>{listeners.delete(l);};},get:()=>published};
let cacheRead=false;
export async function loadPublishedLevels(){
 if(!cacheRead){cacheRead=true;try{const raw=await readSave(LEVELS_KEY);if(raw)setPublished(merge(JSON.parse(raw)));}catch{/* the bundle stays */}}
 try{
  let latest=Infinity,top=published[published.length-1]?.number??12;
  while(top<latest){
   const page=await api<{latest:number;levels:unknown[]}>(`/campaign/levels?from=${top+1}`);
   latest=Number(page.latest);if(!Array.isArray(page.levels)||!page.levels.length)break;
   setPublished(merge(page.levels));const next=published[published.length-1]?.number??12;if(next===top)break;top=next;
  }
  if(top>bundledTop)await writeSave(LEVELS_KEY,JSON.stringify(published.filter(l=>l.number>bundledTop)));
 }catch{/* offline: bundled and cached levels remain */}
}

// Import only server-verified guest replays. Never trust the device balance,
// or spend a newly connected wallet's credits to restore guest cosmetics.
export async function importGuestInventory(wallet:string,token:string){
 await outbox.flush('guest',token);await outbox.flush(wallet,token);
}
