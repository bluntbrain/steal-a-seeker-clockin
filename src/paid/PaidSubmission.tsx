import React,{useEffect,useRef,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import type {PaidEntry} from '../../shared/paid';
import {SubmissionStatus} from '../components/ResultSheet';
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
 return <SubmissionStatus state={result?.status==='review'?'error':!result?(message.startsWith('Saving')?'pending':'error'):['verifying_run','won','refunding'].includes(result.status)?'pending':'saved'} message={message}>{(!result||result.status==='running')&&<Pressable accessibilityRole="button" onPress={()=>void submit(true)} style={{padding:8}}><Text style={{color:'#bfead4',fontSize:11,textAlign:'center'}}>Retry paid result submission</Text></Pressable>}</SubmissionStatus>;
}
