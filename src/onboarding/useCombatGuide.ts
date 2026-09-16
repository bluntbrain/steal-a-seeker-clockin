import {useEffect,useRef,useState} from 'react';
import {readSave,writeSave} from '../progress/storage';
import type {GameState} from '../game/simulation';
import {guideDone} from './combat-guide';
import rules from '../../shared/rules-manifest.json';
const KEY='seeker.combat-tutorial.v2',CHECKPOINT=KEY+'.checkpoint';
type Checkpoint={rulesHash:string;stage:number;state:GameState};
export function useCombatGuide(state:GameState,eligible:boolean){
 const [enabled,setEnabled]=useState(false),[stage,setStage]=useState(0),[waiting,setWaiting]=useState(true),[retries,setRetries]=useState(0),[resume,setResume]=useState<Checkpoint|null>(null);const checkpoint=useRef<GameState|null>(null),lastSaved=useRef('');
 useEffect(()=>{let alive=true;void Promise.all([readSave(KEY),readSave(CHECKPOINT)]).then(([done,raw])=>{if(!alive)return;setEnabled(done!=='done');if(done==='done'||!raw)return;try{const c=JSON.parse(raw) as Checkpoint;if(c.rulesHash===rules.rulesHash&&Number.isInteger(c.stage)&&c.stage>=0&&c.stage<8&&c.state?.mission==='practice'&&c.state.combat?.version===2&&c.state.status==='playing'){setStage(c.stage);checkpoint.current=c.state;setResume(c);setRetries(1);}}catch{/* Invalid local training progress starts again; never enters ranked play. */}}).catch(()=>{if(alive)setEnabled(true);});return()=>{alive=false;};},[]);
 const active=eligible&&enabled&&state.mission==='practice'&&!!state.combat;
 useEffect(()=>{if(active&&!waiting&&guideDone(stage,state)){if(stage===7){setEnabled(false);void writeSave(KEY,'done').catch(()=>{});void writeSave(CHECKPOINT,'').catch(()=>{});}else{setStage(v=>v+1);setWaiting(true);checkpoint.current=null;}}},[active,waiting,stage,state]);
 // Persist only paused teaching checkpoints; a restored guide never submits a spliced replay.
 useEffect(()=>{if(!active||!waiting||!checkpoint.current)return;const saved=JSON.stringify({rulesHash:rules.rulesHash,stage,state:checkpoint.current});if(saved===lastSaved.current)return;lastSaved.current=saved;void writeSave(CHECKPOINT,saved).catch(()=>{});},[active,waiting,stage,state]);
 function dismiss(){setEnabled(false);setWaiting(false);setResume(null);void writeSave(KEY,'done').catch(()=>{});void writeSave(CHECKPOINT,'').catch(()=>{});}
 function replay(){setEnabled(true);setStage(0);setWaiting(true);setRetries(0);setResume(null);checkpoint.current=null;lastSaved.current='';void writeSave(KEY,'show').catch(()=>{});void writeSave(CHECKPOINT,'').catch(()=>{});}
 return {active,stage,waiting,retries,checkpoint,resume,consumeResume:()=>setResume(null),begin:()=>setWaiting(false),dismiss,replay,retry:()=>{setWaiting(true);setRetries(v=>v+1);}};
}
