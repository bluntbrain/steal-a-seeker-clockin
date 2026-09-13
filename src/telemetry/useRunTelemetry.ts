import {useEffect,useRef} from 'react';
import {getLevel} from '../game/level';
import type {GameState} from '../game/simulation';
import {recordRun,usePlaytestLog} from './store';
import type {PlaytestRun} from './model';
type Capture={id:string;at:string;state:GameState;fps:number;p95:number;ended:boolean};
export function useRunTelemetry(state:GameState,paused:boolean,mode:PlaytestRun['mode'],stats:{fps:number;p95:number}){
 const {log}=usePlaytestLog(),capture=useRef<Capture|null>(null),modeRef=useRef(mode);modeRef.current=mode;
 function finish(c:Capture,outcome:PlaytestRun['outcome']){if(c.ended)return;c.ended=true;const s=c.state;recordRun({id:c.id,at:c.at,mission:s.mission,mode:modeRef.current,outcome,seconds:Number(s.elapsed.toFixed(2)),score:s.score,dashes:s.dashes,decoysUsed:Math.max(0,(getLevel(s.mission).decoys??0)-s.decoysLeft),pickedUp:s.securityAlarm,spotted:s.spotted,cell:{x:Math.floor(s.x),y:Math.floor(s.y)},fps:Math.round(c.fps),p95:Number(c.p95.toFixed(1))});}
 useEffect(()=>{
  if(!log.enabled){capture.current=null;return;}
  let c=capture.current;
  if(c&&(c.state.mission!==state.mission||state.elapsed<c.state.elapsed)){finish(c,'abandoned');capture.current=null;c=null;}
  if(!c&&!paused&&state.elapsed>0){c={id:`${Date.now()}-${Math.random().toString(36).slice(2,10)}`,at:new Date().toISOString(),state,fps:stats.fps,p95:stats.p95,ended:false};capture.current=c;}
  if(!c)return;c.state=state;if(stats.fps>0){c.fps=stats.fps;c.p95=stats.p95;}
  if(state.status!=='playing')finish(c,state.status);
 },[state,paused,log.enabled,stats]);
 useEffect(()=>()=>{if(capture.current)finish(capture.current,'abandoned');},[]);
}
