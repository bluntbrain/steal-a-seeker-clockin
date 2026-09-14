import {api} from '../commerce/client';
import type {DailyManifest,Leaderboard,RunTicket,WeeklyLeaderboard} from '../../shared/ranked';
import type {Replay} from '../../shared/replay';
export const rankedApi={
 weekly:(token?:string)=>api<WeeklyLeaderboard>('/weekly/leaderboard',{token}),
 daily:()=>api<DailyManifest>('/daily'),
 leaderboard:(day:string,token?:string)=>api<Leaderboard>(`/daily/${encodeURIComponent(day)}/leaderboard`,{token}),
 current:(token:string)=>api<RunTicket|null>('/runs/current',{token}),
 start:(token:string,manifest:DailyManifest,requestKey:string)=>api<RunTicket>('/runs',{token,body:{day:manifest.day,rulesHash:manifest.rulesHash,requestKey}}),
 run:(token:string,id:string)=>api<RunTicket>(`/runs/${id}`,{token}),
 abandon:(token:string,id:string)=>api<RunTicket>(`/runs/${id}/abandon`,{token,body:{}}),
 finish:(token:string,id:string,rulesHash:string,replay:Replay)=>api<RunTicket>(`/runs/${id}/finish`,{token,body:{rulesHash,replay}}),
};
