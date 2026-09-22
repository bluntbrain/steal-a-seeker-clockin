import React,{useEffect,useRef,useState} from 'react';
import {AppState,Text,View} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useAccount} from '../commerce/account-context';
import {ApiError,commerceApi} from '../commerce/client';
import {walletFailure} from '../wallet/diagnostics';
import {enqueue,submitCampaignRun} from './client';
import type {GameState} from '../game/simulation';
import type {Replay} from '../../shared/replay';
export default function CampaignSubmission({state,replay,quiet=false,onReward,retrySignal=0}:{state:GameState;replay:Replay;quiet?:boolean;onReward?:(amount:number|null,message?:string)=>void;retrySignal?:number}){
 const account=useAccount(),latest=useRef({account,onReward});latest.current={account,onReward};
 const lastRetry=useRef(retrySignal);
 const [message,setMessage]=useState('Verifying your mission…'),[retry,setRetry]=useState(0),[failed,setFailed]=useState(false);
 useEffect(()=>{
  if(state.status!=='won')return;
  const interactive=retrySignal!==lastRetry.current;lastRetry.current=retrySignal;
  const wallet=account.wallet??'guest';let alive=true,running=false,confirmed=false,attempts=0,timer:ReturnType<typeof setTimeout>|undefined;
  const valid=()=>alive&&(latest.current.account.wallet??'guest')===wallet;
  async function run(){
   if(!valid()||running||confirmed)return;running=true;attempts++;setFailed(false);
   let saved=false;
   try{
    await enqueue(wallet,state.mission,replay);saved=true;
    // Guest credits are awarded locally by EconomyProvider. Keep the replay for import.
    if(wallet==='guest')return;
    const session=await latest.current.account.session(interactive&&attempts===1);
    if(!valid())return;
    const receipt=await submitCampaignRun(wallet,session.token,state.mission,replay);
    if(!valid())return;
    const award=receipt.creditAward;
    confirmed=true;
    // Verification is complete. Account refresh/disk-cache failures cannot undo it.
    if(award?.balance!==undefined&&latest.current.account.account){
     try{await latest.current.account.update({...latest.current.account.account,credits:award.balance});}catch(error){walletFailure('campaign.balance.cache',error);}
    }
    if(!valid())return;
    setMessage('Mission verified. Credits saved.');
    latest.current.onReward?.(award?.credits??0,award?undefined:'Mission verified. Your credits are saved.');
    void commerceApi.me(session.token).then(a=>{if(valid())return latest.current.account.update(a);}).catch(error=>walletFailure('campaign.balance.refresh',error));
   }catch(error){
    walletFailure('campaign.reward.sync',error);
    if(!valid())return;
    const auth=error instanceof ApiError&&error.status===401||error instanceof Error&&/Sign in|Connect your wallet/.test(error.message);
    const permanent=error instanceof ApiError&&error.status>=400&&error.status<500&&error.status!==429;
    const text=!saved?'Could not save this run. Retry before leaving.':auth?'Run saved. Tap Sync with wallet to sign in.':permanent?(error as Error).message:'Run saved on this device. We’ll retry when the connection returns.';
    setMessage(text);setFailed(!saved);latest.current.onReward?.(null,text);
    if(!auth&&!permanent&&attempts<3)timer=setTimeout(()=>void run(),attempts*5000);
   }finally{running=false;}
  }
  void run();
  const subscription=AppState.addEventListener('change',s=>{if(s==='active'&&!confirmed){clearTimeout(timer);void run();}});
  return()=>{alive=false;clearTimeout(timer);subscription.remove();};
 },[account.wallet,state.status,state.mission,replay,retry,retrySignal]);
 return quiet&&!failed?null:<View style={{gap:4}}><Text style={{color:'#C7EADB',fontSize:10}}>{message}</Text>{failed&&<Pressable accessibilityRole="button" accessibilityLabel="Retry campaign replay save" onPress={()=>setRetry(n=>n+1)}><Text style={{color:'#E7FCD8',fontSize:11}}>Retry replay save</Text></Pressable>}</View>;
}
