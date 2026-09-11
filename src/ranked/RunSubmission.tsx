import React,{useEffect,useRef,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import type {Replay} from '../../shared/replay';
import type {RunTicket} from '../../shared/ranked';
import {useAccount} from '../commerce/account-context';
import {rankedApi} from './api';
import {savePending,clearPending} from './pending';
export default function RunSubmission({ticket,replay,onResolved}:{ticket:RunTicket;replay:Replay;onResolved:()=>void}){
 const identity=useAccount(),ref=useRef(identity);ref.current=identity;const active=useRef(true),busy=useRef(false),[message,setMessage]=useState('Saving your recorded run…'),[result,setResult]=useState<RunTicket>(),[token,setToken]=useState<string>();
 useEffect(()=>{active.current=true;void submit(false);return()=>{active.current=false;};},[ticket.id]);
 async function apply(run:RunTicket){if(!active.current)return;setResult(run);setMessage(run.detail??run.status);if(!['issued','verifying'].includes(run.status)){onResolved();await clearPending(ticket.wallet,ticket.id);}}
 async function submit(interactive:boolean){if(busy.current)return;busy.current=true;try{await savePending(ticket,replay);const s=await ref.current.session(interactive);if(s.wallet!==ticket.wallet)throw new Error('Switch to the wallet that started this run.');if(!active.current)return;const run=await rankedApi.finish(s.token,ticket.id,ticket.manifest.rulesHash,replay);setToken(s.token);await apply(run);}catch(e){if(active.current)setMessage(e instanceof Error?e.message:'Result is saved. Retry submission when connected.');}finally{busy.current=false;}}
 useEffect(()=>{if(!token||result?.status!=='verifying')return;let cancelled=false,inflight=false,checks=0;const interval=setInterval(()=>{if(inflight||checks>=30)return;inflight=true;checks++;void rankedApi.run(token,ticket.id).then(async run=>{if(!cancelled)await apply(run);}).catch(()=>{if(!cancelled)setMessage('The saved result is waiting for a connection. Retry to check it.');}).finally(()=>{inflight=false;});},2000);return()=>{cancelled=true;clearInterval(interval);};},[token,result?.status,ticket.id]);
 return <View style={{gap:7,marginTop:10,alignItems:'center'}}><Text accessibilityLiveRegion="polite" style={{color:result?.status==='verified'?'#aee4c7':'#b2cbbd',fontSize:11,lineHeight:17,textAlign:'center'}}>{message}</Text>{result?.status==='verified'&&result.result&&<Text style={{color:'#d3eadb',fontSize:12}}>Server result: {result.result.score.toLocaleString()} points</Text>}{(!result||result.status==='verifying')&&<Pressable accessibilityRole="button" onPress={()=>void submit(true)} style={{padding:8}}><Text style={{color:'#bfead4',fontSize:11}}>Submit / check result</Text></Pressable>}</View>;
}
