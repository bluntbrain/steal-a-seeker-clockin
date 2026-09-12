import React,{useEffect,useRef,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import type {PaidEntry} from '../../shared/paid';
import type {Replay} from '../../shared/replay';
import {useAccount} from '../commerce/account-context';
import {paidApi} from './api';
import {paidStore} from './store';
export default function PaidSubmission({entry,replay}:{entry:PaidEntry;replay:Replay}){
 const account=useAccount(),ref=useRef(account);ref.current=account;
 const active=useRef(true),busy=useRef(false),[message,setMessage]=useState('Saving paid run…'),[result,setResult]=useState<PaidEntry>(),[token,setToken]=useState<string>();
 useEffect(()=>{active.current=true;void submit(false);return()=>{active.current=false;};},[entry.id]);
 const apply=(value:PaidEntry)=>{if(active.current){setResult(value);setMessage(value.detail??value.status);}};
 async function submit(interactive:boolean){if(busy.current)return;busy.current=true;try{await paidStore.checkpoint(entry,replay);const s=await ref.current.session(interactive);if(s.wallet!==entry.wallet)throw new Error('Return to the wallet that started this attempt.');if(!active.current)return;const value=await paidApi.finish(s.token,entry,replay);if(active.current){setToken(s.token);apply(value);}}catch(e){if(active.current)setMessage(e instanceof Error?e.message:'Submission failed. Retry when connected.');}finally{busy.current=false;}}
 useEffect(()=>{if(!token||!result||!['verifying_run','won','refunding'].includes(result.status))return;let alive=true,pending=false;const timer=setInterval(()=>{if(pending)return;pending=true;void paidApi.entry(token,entry.id).then(e=>{if(alive)apply(e);}).catch(()=>{if(alive)setMessage('Status refresh failed. Check the entry in the challenge screen.');}).finally(()=>{pending=false;});},4000);return()=>{alive=false;clearInterval(timer);};},[token,result?.status,entry.id]);
 return <View style={{gap:7,marginTop:10,alignItems:'center'}}><Text accessibilityLiveRegion="polite" style={{color:'#c4dfce',fontSize:11,lineHeight:17,textAlign:'center'}}>{message}</Text>{(!result||result.status==='running')&&<Pressable accessibilityRole="button" onPress={()=>void submit(true)} style={{padding:8}}><Text style={{color:'#bfead4',fontSize:11}}>Retry paid result submission</Text></Pressable>}<Text style={{color:'#99b7a4',fontSize:10,textAlign:'center'}}>View entry and return receipts in the challenge screen.</Text></View>;
}
