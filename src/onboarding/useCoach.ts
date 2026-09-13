import {useEffect,useState} from 'react';
import {readSave,writeSave} from '../progress/storage';
import type {GameState} from '../game/simulation';
import {coachText} from './coach';
const key='seeker.coach.v1';
export function useCoach(state:GameState,eligible:boolean){
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{let live=true;void readSave(key).then(v=>{if(live)setEnabled(v!=='done');}).catch(()=>{});return()=>{live=false;};},[]);
 function dismiss(){setEnabled(false);void writeSave(key,'done').catch(()=>{});}
 function replay(){setEnabled(true);void writeSave(key,'show').catch(()=>{});}
 useEffect(()=>{if(eligible&&enabled&&state.mission==='practice'&&state.status==='won')dismiss();},[eligible,enabled,state.mission,state.status]);
 return {text:eligible&&enabled?coachText(state):'',dismiss,replay};
}
