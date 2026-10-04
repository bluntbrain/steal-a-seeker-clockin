import {useCallback,useEffect,useRef,useState} from 'react';
import {readSave,writeSave} from '../progress/storage';
import type {GameState} from '../game/simulation';
import type {MissionId} from '../game/level';
import {GUIDE_STEPS,guideDone} from './combat-guide';
import rules from '../../shared/rules-manifest.json';
const KEY='seeker.combat-tutorial.knife-v3',CHECKPOINT=KEY+'.checkpoint';
type Checkpoint={rulesHash:string;stage:number;state:GameState};
const copy=(state:GameState):GameState=>JSON.parse(JSON.stringify(state));
export function useCombatGuide(state:GameState,eligible:boolean){
 const [enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[stage,setStage]=useState(0),[waiting,setWaiting]=useState(true),[retries,setRetries]=useState(0),[resume,setResume]=useState<Checkpoint|null>(null);
 const checkpoint=useRef<GameState|null>(null),writes=useRef(Promise.resolve());
 // Keep checkpoint/clear writes in order when the player taps or leaves quickly.
 function save(key:string,value:string){writes.current=writes.current.then(()=>writeSave(key,value)).catch(()=>{});}
 useEffect(()=>{
  let alive=true;
  void Promise.all([readSave(KEY),readSave(CHECKPOINT)]).then(([done,raw])=>{
   if(!alive)return;setEnabled(done!=='done');
   if(done==='done'||!raw)return;
   try{
    const c=JSON.parse(raw) as Checkpoint;
    if(c.rulesHash===rules.rulesHash&&Number.isInteger(c.stage)&&c.stage>=0&&c.stage<GUIDE_STEPS.length&&c.state?.mission==='practice'&&c.state.combat?.version===2&&c.state.status==='playing'&&Number.isFinite(c.state.x)&&Number.isFinite(c.state.y)&&Array.isArray(c.state.guards)&&(c.state.ticks===0||c.state.guards.every(g=>!!g&&g.brain!==undefined))){
     setStage(c.stage);checkpoint.current=copy(c.state);setResume(c);setRetries(c.state.ticks>0?1:0);
    }
   }catch{/* A corrupt local teaching save starts fresh. It never enters ranked play. */}
  }).catch(()=>{if(alive)setEnabled(true);}).finally(()=>{if(alive)setReady(true);});
  return()=>{alive=false;};
 },[]);
 const active=ready&&eligible&&enabled&&state.mission==='practice'&&!!state.combat;
 useEffect(()=>{
  if(!active||waiting||!guideDone(stage,state))return;
  if(stage===GUIDE_STEPS.length-1){setEnabled(false);setWaiting(false);checkpoint.current=null;save(KEY,'done');save(CHECKPOINT,'');}
  else{checkpoint.current=null;setStage(v=>v+1);setWaiting(true);}
 },[active,waiting,stage,state]);
 // Capture and persist in the same effect. The old hook tried to save before
 // GameScreen populated the ref, then paused forever without another render.
 useEffect(()=>{
  if(!active||!waiting||checkpoint.current)return;
  checkpoint.current=copy(state);
  save(CHECKPOINT,JSON.stringify({rulesHash:rules.rulesHash,stage,state:checkpoint.current}));
 },[active,waiting,stage,state]);
 function dismiss(){setEnabled(false);setWaiting(false);setResume(null);checkpoint.current=null;save(KEY,'done');save(CHECKPOINT,'');}
 function replay(){setEnabled(true);setStage(0);setWaiting(true);setRetries(0);setResume(null);checkpoint.current=null;save(KEY,'show');save(CHECKPOINT,'');}
 const start=useCallback((mission:MissionId)=>{
  if(!eligible||!enabled||mission!=='practice')return null;
  setWaiting(true);setResume(null);
  // The mission menu must restore the level AND the matching lesson together.
  // Restored training replays stay local; normal campaign runs remain verifiable.
  if(checkpoint.current){const saved=copy(checkpoint.current);if(saved.ticks>0)setRetries(v=>v+1);return saved;}
  setStage(0);return null;
 },[eligible,enabled]);
 return {active,ready,stage,waiting,retries,checkpoint,resume,start,consumeResume:()=>setResume(null),begin:()=>setWaiting(false),dismiss,replay,retry:()=>{setWaiting(true);setRetries(v=>v+1);}};
}
