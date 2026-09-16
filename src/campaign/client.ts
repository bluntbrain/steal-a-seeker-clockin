import {NETWORK_NAME} from '../wallet/config';
import {api} from '../commerce/client';
import type {CampaignSummary,CampaignRank} from '../../shared/economy';
import type {Replay} from '../../shared/replay';
import type {MissionId} from '../game/level';
import {readSave,writeSave} from '../progress/storage';
import rules from '../../shared/rules-manifest.json';
type Pending={mission:MissionId;rulesHash:string;replay:Replay};
const key=(wallet:string)=>`seeker.campaign.outbox.${NETWORK_NAME}.${wallet}`;
// Serialize local writes: a successful old upload must not erase a newer win.
let writes=Promise.resolve();
async function mutate(wallet:string,fn:(items:Pending[])=>Pending[]){const next=writes.catch(()=>{}).then(async()=>{const raw=await readSave(key(wallet));await writeSave(key(wallet),JSON.stringify(fn(raw?JSON.parse(raw):[])));});writes=next;await next;}
export const campaignApi={summary:(token:string)=>api<CampaignSummary>('/campaign',{token}),board:()=>api<CampaignRank[]>('/campaign/leaderboard'),claim:(token:string)=>api<CampaignSummary>('/campaign/claim',{token,body:{}})};
export async function enqueue(wallet:string,mission:MissionId,replay:Replay){await mutate(wallet,items=>[...items.filter(i=>i.mission!==mission),{mission,rulesHash:rules.rulesHash,replay}]);}
export async function syncCampaign(wallet:string,token:string){await writes.catch(()=>{});const raw=await readSave(key(wallet)),items:Pending[]=raw?JSON.parse(raw):[];for(const item of items){await api<CampaignSummary>('/campaign/runs',{token,body:item});await mutate(wallet,current=>current.filter(i=>JSON.stringify(i)!==JSON.stringify(item)));}return campaignApi.summary(token);}

// Import only server-verified guest replays. Never trust the device balance,
// or spend a newly connected wallet's credits to restore guest cosmetics.
export async function importGuestInventory(wallet:string,token:string){
 await syncCampaign('guest',token);await syncCampaign(wallet,token);
}
