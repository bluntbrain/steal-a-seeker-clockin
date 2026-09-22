import type {Contract} from './contracts';
import type {DailyManifest,RunTicket} from './ranked';
import {contractPoints} from './contracts';
export type LeagueEntry={wallet:string;rank:number;position:number;points:number;ticks:number;cleared:number;best:{contract:string;points:number;ticks:number}[]};
export type LeagueBoard={week:string;endsAt:string;participants:number;entries:LeagueEntry[];nearby:LeagueEntry[];personal:LeagueEntry|null;rival:LeagueEntry|null;final:boolean};
export type LeagueRun={id:string;week:string;mission:string;startedAt:string;status:RunTicket['status'];outcome:NonNullable<RunTicket['result']>['status'];points:number;ticks:number|null};
/** Only server-verified wins can expose scored points. Attempt history is separate from weekly bests. */
export function leagueRun(ticket:RunTicket,now=Date.now()):LeagueRun|null{
 const c=ticket.manifest.contract;if(!c||ticket.practice)return null;
 const r=ticket.status==='verified'?ticket.result:null;
 const status=ticket.status==='issued'&&Date.parse(ticket.expiresAt)<=now?'rejected':ticket.status;
 return {id:ticket.id,week:c.week,mission:c.name,startedAt:ticket.issuedAt,status,outcome:r?.status??'incomplete',points:r?.status==='won'?contractPoints(r,c.level):0,ticks:r?.ticks??null};
}
export type LeagueSummary={authenticated:boolean;week:string;endsAt:string;rulesHash:string;engineHash?:string;contracts:Contract[];attempts:Record<string,number>;board:LeagueBoard;history:LeagueBoard[];recentRuns?:LeagueRun[];earned:boolean;domain:string|null;active:RunTicket|null};
export function practiceTicket(contract:Contract,rulesHash:string,wallet:string):RunTicket{
 const now=new Date();const manifest:DailyManifest={day:contract.week,mission:contract.level.mission,rulesHash,levelHash:contract.level.id,seed:0,loadout:'standard',startsAt:contract.week+'T00:00:00.000Z',endsAt:new Date(Date.parse(contract.week)+7*86400000).toISOString(),hardLimitSeconds:contract.level.hardLimitSeconds,contract};
 return {id:crypto.randomUUID(),wallet,practice:true,status:'issued',manifest,issuedAt:now.toISOString(),expiresAt:new Date(now.getTime()+contract.level.hardLimitSeconds*1000).toISOString(),result:null,detail:'Unranked practice; no attempts used.'};
}
