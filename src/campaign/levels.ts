// campaign entries: the twelve authored missions are levels 1 to 12; published levels follow from the bundle or the api.
// pure module so node tests can import it; fetching and caching live in client.ts
import {CAMPAIGN_IDS,type LevelDefinition,type MissionId} from '../game/level';
import {combatLevel} from '../game/combat-levels';
import {districtFor} from '../game/environment';
import {campaignLevelKey,FIRST_PUBLISHED_LEVEL,type BossId,type CampaignZone} from '../../shared/campaign-levels';
import engine from '../../shared/weekly-engine.json';
import type {Progress} from '../progress/model';
import bundled from './published-levels.json';
export type PublishedLevel={number:number;title:string;zone:CampaignZone;boss:BossId|null;definition:LevelDefinition;rulesHash:string;engineHash:string};
export type CampaignEntry={number:number;key:string;mission:MissionId;title:string;zone:CampaignZone;boss:BossId|null;definition:LevelDefinition;playable:boolean};
export const BUNDLED_LEVELS=bundled.levels as PublishedLevel[];
const authored:CampaignEntry[]=CAMPAIGN_IDS.map((id,i)=>{const definition=combatLevel(id);return {number:i+1,key:id,mission:id,title:definition.title,zone:districtFor(i+1),boss:null,definition,playable:true};});
/** a level is playable only when this build runs the engine it was published under, like weekly contracts */
const runnable=(l:PublishedLevel)=>l.engineHash===engine.engineHash&&l.definition.combat?.version===2;
export const isPublishedLevel=(v:unknown):v is PublishedLevel=>{const l=v as PublishedLevel;return !!l&&Number.isInteger(l.number)&&l.number>=FIRST_PUBLISHED_LEVEL&&typeof l.title==='string'&&typeof l.engineHash==='string'&&!!l.definition&&Array.isArray(l.definition.patrols)&&Array.isArray(l.definition.blockers)&&typeof l.definition.mission==='string';};
export function campaignEntries(published:readonly PublishedLevel[]):CampaignEntry[]{
 const sorted=[...published].filter(isPublishedLevel).sort((a,b)=>a.number-b.number),out=[...authored];
 // the map stops at the first gap so a missing batch never shows an unreachable node
 for(const l of sorted){if(l.number!==out.length+1)continue;out.push({number:l.number,key:campaignLevelKey(l.number),mission:l.definition.mission,title:l.title,zone:l.zone,boss:l.boss,definition:l.definition,playable:runnable(l)});}
 return out;
}
export const authoredEntry=(mission:MissionId):CampaignEntry=>authored[CAMPAIGN_IDS.indexOf(mission)]??authored[0]!;
export const entryUnlocked=(progress:Progress,entries:readonly CampaignEntry[],index:number)=>index<=0||!!progress.missions[entries[index-1]!.key];
/** unlocked by progress and runnable by this build; only open entries may start a run */
export const entryOpen=(progress:Progress,entries:readonly CampaignEntry[],index:number)=>entryUnlocked(progress,entries,index)&&entries[index]!.playable;
export const nextEntry=(entries:readonly CampaignEntry[],key:string)=>{const i=entries.findIndex(e=>e.key===key);return i<0?undefined:entries[i+1];};
export const firstOpenEntry=(progress:Progress,entries:readonly CampaignEntry[])=>entries.find(e=>!progress.missions[e.key])??entries[entries.length-1]!;
export const padLevel=(n:number)=>String(n).padStart(2,'0');
