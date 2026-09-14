import React,{useEffect,useState,type ReactNode} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import WalletPanel from '../wallet/WalletPanel';
import {useAccount} from './account-context';
import Paywall from './Paywall';
import {TrialContext} from './TrialContext';
import {readSave,writeSave} from '../progress/storage';
export default function CampaignGate({children}:{children:ReactNode}){
 const {preview,account,loading,notice}=useAccount(),[open,setOpen]=useState(false),[stage,setStage]=useState<'offer'|'cancelled'>('offer'),[trial,setTrial]=useState(false),[used,setUsed]=useState(true),[error,setError]=useState('');
 useEffect(()=>{void readSave('seeker.trial.used.v1').then(raw=>setUsed(raw==='used')).catch(()=>setError('Could not restore trial status.'));},[]);
 if(process.env.EXPO_PUBLIC_JUDGE_PREVIEW==='1')return <>{children}</>;
 if(preview||account?.entitlements.includes('campaign'))return <>{children}</>;
 if(trial)return <TrialContext.Provider value={{active:true,finish:()=>{setTrial(false);setStage('offer');}}}>{children}</TrialContext.Provider>;
 return <SafeAreaView style={{flex:1,backgroundColor:'#090D11'}}><WalletPanel checkout visible={open} onClose={()=>{setOpen(false);setStage('cancelled');}}/><Paywall local={false} stage={stage} busy={loading} trialAvailable={!used} message={error||notice} onBuy={()=>setOpen(true)} onCancel={()=>setStage('cancelled')} onBack={()=>setStage('offer')} onTrial={()=>{void writeSave('seeker.trial.used.v1','used').then(()=>{setUsed(true);setTrial(true);}).catch(()=>setError('Could not save trial access. Try again.'));}}/></SafeAreaView>;
}
