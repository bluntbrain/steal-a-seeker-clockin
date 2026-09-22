import {createOutbox} from './outbox';
import {NETWORK_NAME} from '../wallet/config';
import {api} from '../commerce/client';
import type {CampaignSummary,CampaignRank} from '../../shared/economy';
import type {Replay} from '../../shared/replay';
import type {MissionId} from '../game/level';
import {readSave,writeSave} from '../progress/storage';
import rules from '../../shared/rules-manifest.json';
type Pending={mission:MissionId;rulesHash:string;replay:Replay};
const key=(wallet:string)=>`seeker.campaign.outbox.${NETWORK_NAME}.${wallet}`;
const outbox=createOutbox<Pending,CampaignSummary>({
 read:async wallet=>{const raw=await readSave(key(wallet));return raw?JSON.parse(raw):[];},
 write:(wallet,items)=>writeSave(key(wallet),JSON.stringify(items)),
 send:(token,item)=>api<CampaignSummary>('/campaign/runs',{token,body:item}),
});
const pending=(mission:MissionId,replay:Replay):Pending=>({mission,rulesHash:rules.rulesHash,replay});
export const campaignApi={summary:(token:string)=>api<CampaignSummary>('/campaign',{token}),board:()=>api<CampaignRank[]>('/campaign/leaderboard'),claim:(token:string)=>api<CampaignSummary>('/campaign/claim',{token,body:{}})};
export async function enqueue(wallet:string,mission:MissionId,replay:Replay){await outbox.enqueue(wallet,pending(mission,replay));}
export async function submitCampaignRun(wallet:string,token:string,mission:MissionId,replay:Replay){return outbox.submit(wallet,token,pending(mission,replay));}
export async function syncCampaign(wallet:string,token:string,onAward?:(mission:string,credits:number|null)=>void){await outbox.flush(wallet,token,(item,receipt)=>onAward?.(item.mission,receipt.creditAward?.credits??null));return campaignApi.summary(token);}

// Import only server-verified guest replays. Never trust the device balance,
// or spend a newly connected wallet's credits to restore guest cosmetics.
export async function importGuestInventory(wallet:string,token:string){
 await outbox.flush('guest',token);await outbox.flush(wallet,token);
}
