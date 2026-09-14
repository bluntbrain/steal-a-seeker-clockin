import {api} from '../commerce/client';
import type {LeagueSummary} from '../../shared/league';
import type {RunTicket} from '../../shared/ranked';
export const leagueApi={summary:(token?:string)=>api<LeagueSummary>('/league',{token}),start:(token:string,contractId:string,rulesHash:string,requestKey:string)=>api<RunTicket>('/league/start',{token,body:{contractId,rulesHash,requestKey}}),identity:(token:string,domain:string)=>api<{domain:string}>('/league/identity',{token,body:{domain}}),equip:(token:string)=>api<{ok:true}>('/league/equip',{token,body:{}})};
