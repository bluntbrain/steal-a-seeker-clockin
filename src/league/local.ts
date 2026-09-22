import {useSyncExternalStore} from 'react';
import {makeCombatContracts,contractPoints,type Contract} from '../../shared/contracts';
import {leagueRun,practiceTicket,type LeagueEntry,type LeagueBoard,type LeagueSummary} from '../../shared/league';
import type {RunResult,RunTicket} from '../../shared/ranked';
import {weekWindow} from '../../shared/weekly';
import rules from '../../shared/rules-manifest.json';
export const LOCAL_LEAGUE_KEY='seeker.local-league.combat.v2';
type Local={domain?:string;tickets:RunTicket[];results:Record<string,RunResult>;equipped?:boolean};
let state:Local|undefined;const listeners=new Set<()=>void>();
export function readLeague(){if(!state)state=JSON.parse(localStorage.getItem(LOCAL_LEAGUE_KEY)||'{"tickets":[],"results":{}}');return state!;}
export function updateLeague(fn:(s:Local)=>Local){state=fn(readLeague());localStorage.setItem(LOCAL_LEAGUE_KEY,JSON.stringify(state));listeners.forEach(f=>f());}
export function useLocalLeague(){return useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f);},readLeague,readLeague);}
function board(week:string,s:Local):LeagueBoard{const best=new Map<string,{contract:string;points:number;ticks:number}>();for(const t of s.tickets){const c=t.manifest.contract,r=s.results[t.id];if(!c||c.week!==week||r?.status!=='won'||t.practice)continue;const value={contract:c.id,points:contractPoints(r,c.level),ticks:r.ticks},old=best.get(c.id);if(!old||value.points>old.points||(value.points===old.points&&value.ticks<old.ticks))best.set(c.id,value);}
 const values=[...best.values()],personal:LeagueEntry|null=values.length?{wallet:'browser-playtest',rank:1,position:1,points:values.reduce((n,r)=>n+r.points,0),ticks:values.reduce((n,r)=>n+r.ticks,0),cleared:values.length,best:values}:null;
 return {week,endsAt:new Date(Date.parse(week)+604800000).toISOString(),participants:personal?1:0,personal,entries:personal?[personal]:[],nearby:personal?[personal]:[],rival:null,final:week<weekWindow().week};}
export function localSummary(s:Local):LeagueSummary{const window=weekWindow(),attempts:Record<string,number>={};for(const t of s.tickets)if(!t.practice&&t.manifest.contract?.week===window.week)attempts[t.manifest.contract.id]=(attempts[t.manifest.contract.id]??0)+1;
 const history=[...new Set(s.tickets.map(t=>t.manifest.contract?.week).filter((w):w is string=>!!w&&w<window.week))].sort().reverse().map(w=>board(w,s));const current=board(window.week,s);
 return {...window,authenticated:true,rulesHash:rules.rulesHash,contracts:makeCombatContracts(),attempts,board:current,history,recentRuns:s.tickets.slice().reverse().map(t=>leagueRun({...t,result:s.results[t.id]??null})).filter((r):r is NonNullable<typeof r>=>r!==null).slice(0,30),earned:current.personal?.cleared===3||history.some(b=>b.personal?.cleared===3),domain:s.domain??null,active:s.tickets.find(t=>t.status==='issued'&&!s.results[t.id])??null};}
export function startLocal(c:Contract,practice:boolean){const ticket=practiceTicket(c,rules.rulesHash,'browser-playtest');ticket.practice=practice;if(!practice)updateLeague(s=>{if(localSummary(s).active)throw Error('Close the previous ranked test first.');if((localSummary(s).attempts[c.id]??0)>=5)throw Error('All five chances used. New missions arrive next Monday.');return {...s,tickets:[...s.tickets,ticket]};});return ticket;}
export function finishLocal(ticket:RunTicket,result:RunResult){if(ticket.practice)return;updateLeague(s=>{if(!s.tickets.some(t=>t.id===ticket.id))throw Error('Local ticket not found.');return {...s,results:{...s.results,[ticket.id]:result},tickets:s.tickets.map(t=>t.id===ticket.id?{...t,status:'verified'}:t)};});}
export function abandonLocal(){updateLeague(s=>({...s,tickets:s.tickets.map(t=>t.status==='issued'?{...t,status:'abandoned'}:t)}));}
