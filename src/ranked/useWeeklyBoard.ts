import {useCallback,useEffect,useRef,useState} from 'react';
import {useAccount} from '../commerce/account-context';
import type {WeeklyLeaderboard} from '../../shared/ranked';
import {rankedApi} from './api';
export function useWeeklyBoard(week:string,active=true){
 const identity=useAccount(),[board,setBoard]=useState<WeeklyLeaderboard>(),[error,setError]=useState(''),[loading,setLoading]=useState(true),generation=useRef(0),identityRef=useRef(identity);identityRef.current=identity;
 const refresh=useCallback(async()=>{const g=++generation.current;setLoading(true);setError('');try{
  const publicBoard=await rankedApi.weekly();if(g!==generation.current)return;setBoard(publicBoard);
  // Passive reads never send the player into their wallet.
  if(identityRef.current.wallet&&!identityRef.current.preview){try{const session=await identityRef.current.session(false);const personal=await rankedApi.weekly(session.token);if(g===generation.current)setBoard(personal);}catch{/* Public standings remain readable without signing in. */}}
 }catch{if(g===generation.current)setError('Standings couldn’t load. Try again.');}finally{if(g===generation.current)setLoading(false);}},[identity.wallet,week]);
 useEffect(()=>{setBoard(undefined);if(active)void refresh();return()=>{generation.current++;};},[refresh,active]);
 return {board,error,loading,refresh,local:false};
}
