import {useMemo} from 'react';
import {usePlaytest,PLAYTEST_WALLET} from '../playtest/store';
import {weekWindow} from '../../shared/weekly';
import type {WeeklyLeaderboard} from '../../shared/ranked';
export function useWeeklyBoard(week:string,_active=true){
 const state=usePlaytest();
 const board=useMemo<WeeklyLeaderboard>(()=>{const window=weekWindow(new Date(week)),best=new Map<string,typeof state.results[number]>();
  for(const r of state.results){if(r.kind!=='daily'||r.status!=='won'||r.day<week||r.day>=window.endsAt.slice(0,10))continue;const old=best.get(r.day);if(!old||r.score>old.score||(r.score===old.score&&r.seconds<old.seconds))best.set(r.day,r);}
  const values=[...best.values()],ticks=values.reduce((n,r)=>n+Math.round(r.seconds*30),0),personal=values.length?{wallet:PLAYTEST_WALLET,rank:1,score:values.reduce((n,r)=>n+r.score,0),ticks,seconds:ticks/30,days:values.length,frame:null}:null;
  return {...window,entries:personal?[personal]:[],personal,rival:null,participants:personal?1:0};
 },[state.results,week]);
 return {board,error:'',loading:false,refresh:async()=>{},local:true};
}
