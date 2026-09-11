import type {MissionId} from '../src/game/level';
export type DailyManifest={day:string;mission:MissionId;rulesHash:string;levelHash:string;seed:0;loadout:'standard';startsAt:string;endsAt:string;hardLimitSeconds:number};
export type RunResult={status:'won'|'caught'|'timeout'|'incomplete';score:number;ticks:number;seconds:number;battery:number;delivered:number;spotted:boolean};
export type RunTicket={id:string;wallet:string;status:'issued'|'verifying'|'verified'|'rejected'|'error'|'abandoned';manifest:DailyManifest;issuedAt:string;expiresAt:string;result:RunResult|null;detail:string|null};
export type LeaderboardEntry={wallet:string;rank:number;score:number;ticks:number;seconds:number;frame:string|null};
export type Leaderboard={day:string;entries:LeaderboardEntry[];personal:LeaderboardEntry|null};
