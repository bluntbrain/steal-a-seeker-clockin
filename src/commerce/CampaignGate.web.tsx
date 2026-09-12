import React,{useState,type ReactNode} from 'react';
import {changePlaytest,purchase,usePlaytest} from '../playtest/store';
import Paywall from './Paywall';
import {TrialContext} from './TrialContext';
export default function CampaignGate({children}:{children:ReactNode}){
 const state=usePlaytest(),[stage,setStage]=useState<'offer'|'review'|'cancelled'>('offer'),[error,setError]=useState(''),[trial,setTrial]=useState(false);
 if(state.owned.includes('campaign'))return <>{children}</>;
 if(trial)return <TrialContext.Provider value={{active:true,finish:()=>{setTrial(false);setStage('offer');}}}>{children}</TrialContext.Provider>;
 return <Paywall local stage={stage} message={error} trialAvailable={!state.trialUsed} onBack={()=>setStage('offer')} onCancel={()=>{setError('');setStage('cancelled');}} onTrial={()=>{try{changePlaytest(s=>{if(s.trialUsed)throw new Error('This trial has already been used.');return {...s,trialUsed:true};});setTrial(true);}catch(e){setError(String(e));}}} onBuy={()=>{if(stage==='offer'){setStage('review');return;}try{changePlaytest(s=>purchase(s,'campaign'));}catch(e){setError(String(e));}}}/>;
}
