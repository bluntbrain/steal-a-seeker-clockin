import {useCallback,useEffect,useRef,useState} from 'react';
import {readSave,writeSave} from './storage';
import {freshProgress,parseProgress,recordWin} from './model';
import type {GameState} from '../game/simulation';
const KEY='seeker.campaign.progress.v1';
export function useProgress(){
 const [progress,setProgress]=useState(freshProgress),[ready,setReady]=useState(false),[error,setError]=useState('');const latest=useRef(progress),writes=useRef(Promise.resolve()),loaded=useRef(false),active=useRef(true);
 const load=useCallback(async()=>{try{const saved=parseProgress(await readSave(KEY));if(active.current){latest.current=saved;setProgress(saved);loaded.current=true;setError('');}}catch{if(active.current)setError('Could not load progress. Save kept. Tap to retry loading.');}finally{if(active.current)setReady(true);}},[]);
 useEffect(()=>{active.current=true;void load();return()=>{active.current=false;};},[load]);
 const persist=useCallback((value:typeof progress)=>{writes.current=writes.current.then(()=>writeSave(KEY,JSON.stringify(value))).then(()=>{if(active.current)setError('');}).catch(()=>{if(active.current)setError('Progress is in memory. Saving failed. Tap to retry.');});return writes.current;},[]);
 const complete=useCallback((s:GameState)=>{if(!ready||!loaded.current)return;const next=recordWin(latest.current,s);if(next===latest.current)return;latest.current=next;setProgress(next);void persist(next);},[ready,persist]);
 const retrySave=useCallback(async()=>{if(!loaded.current)await load();else await persist(latest.current);},[load,persist]);
 return {progress,ready,error,complete,retrySave};
}
