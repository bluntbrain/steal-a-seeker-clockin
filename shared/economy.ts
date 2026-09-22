// Versioned purchase terms. Browser credits mirror these amounts but are not tokens.
export const CAMPAIGN_OFFER={version:'campaign-v2',price:100,rebate:25,missions:12,currency:'TEST SKR'} as const;
export type CampaignTerms={version:'campaign-v2';rebate:number;missions:number};
export const campaignTerms:CampaignTerms={version:CAMPAIGN_OFFER.version,rebate:CAMPAIGN_OFFER.rebate,missions:CAMPAIGN_OFFER.missions};
export type CampaignPerformance={mission:string;score:number;ticks:number;battery:number;spotted:boolean};
// Select one complete, real run per level. Never splice the best time from one
// attempt onto the best charge from another. Cosmetic spend never enters rank.
export function compareRun(a:CampaignPerformance,b:CampaignPerformance){return b.score-a.score||a.ticks-b.ticks||Number(a.spotted)-Number(b.spotted)||b.battery-a.battery;}
export function campaignStats(runs:CampaignPerformance[]){const best=new Map<string,CampaignPerformance>();for(const run of runs){const old=best.get(run.mission);if(!old||compareRun(run,old)<0)best.set(run.mission,run);}const selected=[...best.values()];return {cleared:selected.length,score:selected.reduce((n,r)=>n+r.score,0),ticks:selected.reduce((n,r)=>n+r.ticks,0),clean:selected.filter(r=>!r.spotted).length,battery:selected.reduce((n,r)=>n+r.battery,0)};}
export type CampaignStats=ReturnType<typeof campaignStats>;
export function compareCampaign(a:CampaignStats,b:CampaignStats){return b.cleared-a.cleared||b.score-a.score||a.ticks-b.ticks||b.clean-a.clean||b.battery-a.battery;}
export type CampaignSummary={creditAward?:{mission:string;credits:number;balance?:number};runs:CampaignPerformance[];rebate:number;state:'legacy'|'locked'|'ready'|'queued'|'pending'|'settled'|'review';returnId?:string;signature?:string};
export type CampaignRank=CampaignStats&{wallet:string;rank:number};
