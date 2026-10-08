import {createOutbox} from './outbox';
import {NETWORK_NAME} from '../wallet/config';
import {api} from '../commerce/client';
import type {CampaignSummary,CampaignBoard,CampaignPlayer} from '../../shared/economy';
import type {Replay} from '../../shared/replay';
import type {MissionId} from '../game/level';
import {readSave,writeSave} from '../progress/storage';
import rules from '../../shared/rules-manifest.json';
import {campaignLevelKey} from '../../shared/campaign-levels';
import {BUNDLED_LEVELS,isPublishedLevel,type PublishedLevel} from './levels';
export type CampaignTarget={mission:MissionId}|{level:number;rulesHash?:string};
type Pending={mission?:MissionId;level?:number;rulesHash:string;replay:Replay};
export const pendingKey=(item:Pending)=>item.level!==undefined?campaignLevelKey(item.level):item.mission!;
const key=(wallet:string)=>`seeker.campaign.outbox.${NETWORK_NAME}.${wallet}`;
const outbox=createOutbox<Pending,CampaignSummary>({
 read:async wallet=>{const raw=await readSave(key(wallet));return raw?JSON.parse(raw):[];},
 write:(wallet,items)=>writeSave(key(wallet),JSON.stringify(items)),
 send:(token,item)=>api<CampaignSummary>('/campaign/runs',{token,body:item}),
});
const pending=(target:CampaignTarget,replay:Replay):Pending=>({...target,rulesHash:'level' in target?(target.rulesHash??rules.rulesHash):rules.rulesHash,replay});
export const campaignApi={summary:(token:string)=>api<CampaignSummary>('/campaign',{token}),board:(token?:string)=>api<CampaignBoard>('/campaign/leaderboard',token?{token}:{}),claim:(token:string)=>api<CampaignSummary>('/campaign/claim',{token,body:{}}),
 players:(query:string)=>api<{players:CampaignPlayer[]}>(`/campaign/players?query=${encodeURIComponent(query.trim().slice(0,64))}`).then(r=>Array.isArray(r?.players)?r.players:[])};

// the friend picked for the head-to-head card lives on this device only
const FRIEND_KEY='seeker.compete.friend.v1';
export type Friend={wallet:string;name:string|null};
export async function readFriend():Promise<Friend|null>{try{const v=JSON.parse((await readSave(FRIEND_KEY))||'null');return v&&typeof v.wallet==='string'?{wallet:v.wallet,name:typeof v.name==='string'?v.name:null}:null;}catch{return null;}}
export const writeFriend=(friend:Friend|null)=>writeSave(FRIEND_KEY,friend?JSON.stringify(friend):'');
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
const contiguousTop=(list:readonly PublishedLevel[])=>{let top=12;for(const l of list){if(l.number===top+1)top=l.number;else if(l.number>top+1)break;}return top;};
let cacheRead=false,hadCache=false,loading:Promise<void>|null=null;
// a first install has no saved levels, so the map shows a loader while they download; later launches never wait
type LevelDownload={active:boolean;progress:number};
let download:LevelDownload={active:false,progress:0};const downloadListeners=new Set<()=>void>();
const setDownload=(next:LevelDownload)=>{download=next;for(const l of downloadListeners)l();};
export const levelDownload={subscribe:(l:()=>void)=>{downloadListeners.add(l);return()=>{downloadListeners.delete(l);};},get:()=>download};
type Page={latest:number;levels:unknown[]};
/** cached levels first, then any newer pages. concurrent callers share one run, so two screens never download twice */
export function loadPublishedLevels(){return loading??=loadOnce().finally(()=>{loading=null;});}
async function loadOnce(){
 if(!cacheRead){cacheRead=true;try{const raw=await readSave(LEVELS_KEY);const cached=raw?JSON.parse(raw):[];if(Array.isArray(cached)&&cached.length){hadCache=true;setPublished(merge(cached));}}catch{/* the bundle stays */}}
 const before=published.length,showLoader=!hadCache;
 if(showLoader)setDownload({active:true,progress:0});
 try{
  // the first page says how many levels exist; the rest download together, which takes one page time instead of nine
  const top=contiguousTop(published),first=await api<Page>(`/campaign/levels?from=${top+1}`);
  const latest=Number(first.latest),size=Array.isArray(first.levels)?first.levels.length:0;let found=size?first.levels:[];
  if(size&&Number.isFinite(latest)&&top+size<latest){
   const starts:number[]=[];for(let from=top+1+size;from<=latest;from+=size)starts.push(from);
   let done=1;const total=starts.length+1;if(showLoader)setDownload({active:true,progress:done/total});
   const pages=await Promise.allSettled(starts.map(from=>api<Page>(`/campaign/levels?from=${from}`).then(page=>{done++;if(showLoader)setDownload({active:true,progress:done/total});return page.levels;})));
   for(const page of pages)if(page.status==='fulfilled'&&Array.isArray(page.value))found=found.concat(page.value);
  }
  // one update for every downloaded level, so the map changes once instead of once per page
  if(found.length)setPublished(merge(found));
 }catch{/* offline: bundled, cached and already downloaded levels remain */}
 finally{if(showLoader)setDownload({active:false,progress:1});}
 // pages that arrived are kept even when another page failed, so the next launch only fetches the gap.
 // the cache can hold hundreds of levels, so it is rewritten only when this run added some
 if(published.length>before)try{await writeSave(LEVELS_KEY,JSON.stringify(published.filter(l=>l.number>bundledTop)));hadCache=true;}catch{/* retried next launch */}
}

// Import only server-verified guest replays. Never trust the device balance,
// or spend a newly connected wallet's credits to restore guest cosmetics.
export async function importGuestInventory(wallet:string,token:string){
 await outbox.flush('guest',token);await outbox.flush(wallet,token);
}
