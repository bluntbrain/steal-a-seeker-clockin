import {CAMPAIGN_IDS,getLevel,type MissionId} from '../game/level';
import type {GameState} from '../game/simulation';
export type Best={stars:number;seconds:number;score:number;battery:number;completions:number};
export type Progress={version:1;missions:Partial<Record<MissionId,Best>>};
export const freshProgress=():Progress=>({version:1,missions:{}});
export function starsFor(s:GameState){return s.status==='won'?1+Number(s.battery>=40)+Number(!s.spotted&&s.elapsed<=getLevel(s.mission).targetSeconds):0;}
export function recordWin(progress:Progress,s:GameState):Progress{
 if(s.status!=='won'||!CAMPAIGN_IDS.includes(s.mission))return progress;
 const old=progress.missions[s.mission];
 return {version:1,missions:{...progress.missions,[s.mission]:{stars:Math.max(old?.stars??0,starsFor(s)),seconds:Math.min(old?.seconds??Infinity,s.elapsed),score:Math.max(old?.score??0,s.score),battery:Math.max(old?.battery??0,s.battery),completions:(old?.completions??0)+1}}};
}
export function unlocked(progress:Progress,id:MissionId){const index=CAMPAIGN_IDS.indexOf(id);return index<=0||!!progress.missions[CAMPAIGN_IDS[index-1]!];}
export function parseProgress(raw:string|null):Progress{
 if(!raw)return freshProgress();
 const parsed:unknown=JSON.parse(raw);
 if(!parsed||typeof parsed!=='object'||!('version'in parsed)||parsed.version!==1||!('missions'in parsed)||!parsed.missions||typeof parsed.missions!=='object')throw new Error('Unsupported or damaged progress save.');
 const missions:Progress['missions']={};
 for(const [key,v]of Object.entries(parsed.missions)){
  if(!CAMPAIGN_IDS.includes(key as MissionId)||!v||typeof v!=='object')continue;
  const b=v as Best;if(!Number.isInteger(b.stars)||b.stars<1||b.stars>3||!Number.isFinite(b.seconds)||b.seconds<=0||b.seconds>3600||!Number.isSafeInteger(b.score)||b.score<0||b.score>100000||!Number.isFinite(b.battery)||b.battery<0||b.battery>100||!Number.isSafeInteger(b.completions)||b.completions<1)continue;
  missions[key as MissionId]={stars:b.stars,seconds:b.seconds,score:b.score,battery:b.battery,completions:b.completions};
 }
 return {version:1,missions};
}
