import {useCallback,useEffect,useRef,useState} from 'react';
import {readSave,writeSave} from './storage';
import {freshProgress,parseProgress,recordWin,mergeBests} from './model';
import {useAccount} from '../commerce/account-context';
import {progressKey} from '../commerce/account-model';
import {commerceApi} from '../commerce/client';
import type {GameState} from '../game/simulation';
export function useProgress(){
 const account=useAccount(),KEY=progressKey(account.wallet),accountRef=useRef(account);accountRef.current=account;
 const [syncStatus,setSyncStatus]=useState(''),[syncRequest,setSyncRequest]=useState(0);
 const [progress,setProgress]=useState(freshProgress),[ready,setReady]=useState(false),[error,setError]=useState('');const latest=useRef(progress),writes=useRef(Promise.resolve()),loaded=useRef(false),active=useRef(true);
 const load=useCallback(async()=>{try{let saved=parseProgress(await readSave(KEY));if(account.wallet){const guest=parseProgress(await readSave(progressKey()));saved=mergeBests(saved,guest);await writeSave(KEY,JSON.stringify(saved));}if(active.current){latest.current=saved;setProgress(saved);loaded.current=true;setError('');}}catch{if(active.current)setError('Could not load progress. Save kept. Tap to retry loading.');}finally{if(active.current)setReady(true);}},[KEY]);
 useEffect(()=>{active.current=true;void load();return()=>{active.current=false;};},[load]);
 const persist=useCallback((value:typeof progress)=>{writes.current=writes.current.then(()=>writeSave(KEY,JSON.stringify(value))).then(()=>{if(active.current)setError('');}).catch(()=>{if(active.current)setError('Progress is in memory. Saving failed. Tap to retry.');});return writes.current;},[KEY]);
 useEffect(()=>{
  if(!ready||!loaded.current||!account.account?.progress.version)return;
  try{const merged=mergeBests(latest.current,parseProgress(JSON.stringify(account.account.progress)));if(merged!==latest.current){latest.current=merged;setProgress(merged);void persist(merged);}}
  catch{setSyncStatus('Could not read the cloud save. Local progress is kept.');}
 },[ready,account.account?.progress,persist]);
 useEffect(()=>{
  if(!ready||!loaded.current||account.preview||!account.wallet||!account.account)return;
  let cancelled=false;
  const timer=setTimeout(()=>{void(async()=>{
   try{const a=accountRef.current,s=await a.session(false);if(cancelled||s.wallet!==a.wallet)return;
    const result=await commerceApi.syncProgress(s.token,latest.current);if(cancelled)return;
    await a.update(result);if(!cancelled)setSyncStatus('Progress synced to this wallet.');
   }catch(e){if(!cancelled)setSyncStatus(e instanceof Error?`Saved on this device. ${e.message}`:'Saved on this device. Cloud sync will retry.');}
  })();},800);
  return()=>{cancelled=true;clearTimeout(timer);};
 },[ready,progress,account.wallet,account.preview,account.account?.entitlements.includes('campaign'),syncRequest]);
 const retrySync=useCallback(async()=>{try{await accountRef.current.session(true);if(active.current)setSyncRequest(n=>n+1);}catch(e){if(active.current)setSyncStatus(e instanceof Error?e.message:'Could not sync. Local progress is kept.');}},[]);
 const complete=useCallback((s:GameState)=>{if(!ready||!loaded.current)return;const next=recordWin(latest.current,s);if(next===latest.current)return;latest.current=next;setProgress(next);void persist(next);},[ready,persist]);
 const retrySave=useCallback(async()=>{if(!loaded.current)await load();else await persist(latest.current);},[load,persist]);
 return {progress,ready,error,syncStatus,complete,retrySave,retrySync};
}
