import React,{useEffect,useRef,useState} from 'react';
import {Modal,Pressable,ScrollView,Switch,Text,View} from 'react-native';
import type {PaidChallenge,PaidEntry} from '../../shared/paid';
import {tokenAmount} from '../../shared/commerce';
import {useAccount} from '../commerce/account-context';
import {getLevel} from '../game/level';
import {paidApi} from './api';
import {paidStore} from './store';
import {assertPaidRules,restorePaidState,type PaidPlay} from './recovery';
import {usePayment} from './usePayment';
import PaidReceipt from './PaidReceipt';
export default function PaidPanel({visible,onClose,onStart}:{visible:boolean;onClose:()=>void;onStart:(play:PaidPlay)=>void}){
 const identity=useAccount(),identityRef=useRef(identity);identityRef.current=identity;
 const pay=usePayment(),generation=useRef(0),locked=useRef(false);
 const [challenge,setChallenge]=useState<PaidChallenge>(),[entries,setEntries]=useState<PaidEntry[]>([]),[selected,setSelected]=useState<PaidEntry>(),[accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[token,setToken]=useState<string>();
 function apply(entry:PaidEntry){setSelected(entry);setEntries(old=>[entry,...old.filter(e=>e.id!==entry.id)]);}
 useEffect(()=>{
  const g=++generation.current;setToken(undefined);setEntries([]);setSelected(undefined);setAccepted(false);setMessage('');
  if(!visible)return;setChallenge(undefined);
  void(async()=>{try{const c=await paidApi.challenge();if(g!==generation.current)return;setChallenge(c);
   if(identity.wallet&&!identity.preview){try{const s=await identity.session(false),history=await paidApi.entries(s.token);if(g===generation.current){setToken(s.token);setEntries(history);setSelected(history[0]);}}catch{/* Explicit Restore can request sign-in; opening this screen does not. */}}
  }catch(e){if(g===generation.current)setMessage(e instanceof Error?e.message:'Challenge unavailable.');}})();
  return()=>{generation.current++;};
 },[visible,identity.wallet]);
 useEffect(()=>{if(!visible||!token||!selected||!['quoted','verifying_payment','ready','running','verifying_run','won','refunding'].includes(selected.status))return;const g=generation.current;let inflight=false;const timer=setInterval(()=>{if(inflight||locked.current)return;inflight=true;void paidApi.entry(token,selected.id).then(e=>{if(g===generation.current)apply(e);}).catch(()=>{if(g===generation.current)setMessage('Status could not refresh. Your entry remains on the server.');}).finally(()=>{inflight=false;});},5000);return()=>clearInterval(timer);},[visible,token,selected?.id,selected?.status]);
 type Active=()=>boolean;
 async function act(fn:(active:Active)=>Promise<void>){if(locked.current)return;const g=generation.current;locked.current=true;setBusy(true);setMessage('');try{await fn(()=>g===generation.current);}catch(e){if(g===generation.current)setMessage(e instanceof Error?e.message:'Could not finish. Restore this entry before paying again.');}finally{locked.current=false;setBusy(false);}}
 async function session(){if(identityRef.current.preview)throw new Error('Use Android and Phantom for paid devnet challenges.');const s=await identityRef.current.session();if(s.wallet!==identityRef.current.wallet)throw new Error('Wallet changed. Restore entries for the selected wallet.');return s;}
 async function restore(active:Active){const s=await session();if(!active())return;let history=await paidApi.entries(s.token);for(const e of history.filter(e=>['quoted','verifying_payment'].includes(e.status)).slice(0,2))await paidApi.reconcile(s.token,e.id);history=await paidApi.entries(s.token);if(active()){setToken(s.token);setEntries(history);setSelected(history.find(e=>e.id===selected?.id)??history[0]);const c=await paidApi.challenge();if(active())setChallenge(c);}}
 async function quote(active:Active){if(!accepted||!challenge)throw new Error('Read and accept the entry terms first.');const s=await session();if(!active())return;const entry=await paidApi.quote(s.token,crypto.randomUUID(),challenge.termsVersion);if(active()){setToken(s.token);apply(entry);setMessage('Quote ready. No tokens have been sent. Review the amount before opening Phantom.');}}
 async function approve(active:Active){if(!selected||!accepted)throw new Error('Accept the terms before approving this entry.');const s=await session();if(!active()||s.wallet!==selected.wallet)return;const entry=await paidApi.prepare(s.token,selected.id);if(!active())return;apply(entry);setToken(s.token);if(!['quoted','verifying_payment'].includes(entry.status))return;if(!entry.quote.payment)throw new Error('No payment authorization is available. Restore this entry.');
  setMessage('Approve in Phantom. Resuming uses the same transaction until its lifetime is reconciled.');
  const signature=await pay(entry.quote);
  // Save the callback even if the panel closed during Phantom's handoff.
  const result=await paidApi.attach(s.token,entry.id,signature);if(active())apply(result);
 }
 async function startOrRecover(active:Active){if(!selected)return;const s=await session();if(!active())return;let entry=await paidApi.entry(s.token,selected.id);if(!active())return;assertPaidRules(entry);apply(entry);setToken(s.token);
  if(entry.status==='ready'){const startKey=await paidStore.prepare(entry);if(!active())return;entry=await paidApi.start(s.token,entry.id,entry.manifest.rulesHash,startKey);if(!active())return;apply(entry);}
  if(entry.status!=='running')return;
  const saved=await paidStore.open(entry);if(!active())return;
  const state=restorePaidState(entry.manifest.mission,saved.replay);
  if(state.status!=='playing'){const checked=await paidApi.finish(s.token,entry,saved.replay);if(active())apply(checked);return;}
  if(Date.now()>=new Date(entry.run!.expiresAt).getTime())throw new Error('The original submission deadline has passed. Refresh to check its review status.');
  onStart({entry,replay:saved.replay});
 }
 async function cancel(active:Active){if(!selected)return;const s=await session();if(!active())return;const entry=await paidApi.cancel(s.token,selected.id);if(active()){setToken(s.token);apply(entry);}}
 const button=(label:string,fn:(active:Active)=>Promise<void>,disabled=false)=><Pressable accessibilityRole="button" disabled={busy||disabled} onPress={()=>void act(fn)} style={{padding:14,borderRadius:11,backgroundColor:'#cfe6e4',opacity:(busy||disabled)?0.45:1}}><Text style={{color:'#17392d',fontWeight:'700',textAlign:'center'}}>{label}</Text></Pressable>;
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#081210ed',padding:20,justifyContent:'center'}}><ScrollView style={{flexGrow:0,maxHeight:'94%',backgroundColor:'#142722',borderRadius:24}} contentContainerStyle={{padding:22,gap:16}}>
  <Text style={{color:'#a8ecd7',letterSpacing:2,fontSize:11}}>SEPARATE DEVNET CHALLENGE</Text><Text style={{color:'#edf2e8',fontSize:29,fontWeight:'800'}}>One entry. One escape.</Text>
  <Text style={{color:'#c5ddce',lineHeight:22}}>10 TEST SKR to enter. Escape to get 10 TEST SKR back. A verified capture or timeout returns zero. Network fees are excluded.</Text>
  <Text style={{color:'#abc6b5',fontSize:12,lineHeight:19}}>Campaign retries stay unlimited. This optional mode uses test tokens with no monetary value.</Text>
  {challenge&&<><Text style={{color:'#d8ebde',fontSize:18,fontWeight:'700'}}>{getLevel(challenge.manifest.mission).title} · {challenge.manifest.hardLimitSeconds/60} min</Text>{!challenge.enabled&&<Text style={{color:'#e1c99c',lineHeight:20}}>New entries are paused. You can still restore existing entries and check returns or request an unstarted refund.</Text>}
   {challenge.terms.map((term,i)=><Text key={term} style={{color:'#adc8b7',fontSize:12,lineHeight:20}}>{i+1}. {term}</Text>)}
   <View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Switch accessibilityLabel="I understand the paid devnet entry terms" value={accepted} onValueChange={setAccepted}/><Text style={{flex:1,color:'#d5e8da',fontSize:13}}>I understand the entry, deadline and refund terms.</Text></View>
   {button('Get 10 TEST SKR entry quote',quote,!accepted||!challenge.enabled||identity.preview)}
  </>}
  {button(identity.preview?'Entry history is available on Android':'Sign in / restore entries',restore,identity.preview)}
  {!!message&&<Text accessibilityLiveRegion="polite" style={{color:'#e2d9b8',fontSize:13,lineHeight:20}}>{message}</Text>}
  {selected&&<View style={{padding:16,backgroundColor:'#0c1e19',borderRadius:14,gap:12}}><Text style={{color:'#e1ede4',fontSize:18,fontWeight:'700'}}>Your entry · {selected.status.replaceAll('_',' ')}</Text><Text style={{color:'#c6dece'}}>{tokenAmount(selected.quote.amount,selected.quote.decimals)} TEST SKR</Text><Text selectable style={{color:'#8fa999',fontSize:10}}>Mint: {selected.quote.mint}</Text>
   {['quoted','verifying_payment'].includes(selected.status)&&button(selected.quote.payment?'Resume payment in Phantom':'Approve entry in Phantom',approve,!accepted||!challenge?.enabled)}
   {selected.status==='ready'&&<><Text style={{color:'#c1d8c9',fontSize:12}}>Start by {new Date(selected.readyUntil!).toLocaleString()}. The run timer has not started.</Text>{button('Start one paid attempt',startOrRecover,!challenge?.enabled)}{button('Cancel unstarted entry · refund 10 TEST SKR',cancel)}</>}
   {selected.status==='running'&&<><Text style={{color:'#c1d8c9',fontSize:12}}>Original submission deadline: {new Date(selected.run!.expiresAt).toLocaleString()}. Reopening keeps the same attempt.</Text>{button('Recover run / submit saved result',startOrRecover)}</>}
   <PaidReceipt entry={selected}/>
  </View>}
  {entries.length>1&&<><Text style={{color:'#dcece2',fontSize:18}}>Recent entries</Text>{entries.map(e=><Pressable key={e.id} disabled={busy} accessibilityRole="button" onPress={()=>{setSelected(e);setAccepted(false);}} style={{padding:12,borderWidth:1,borderColor:'#365747',borderRadius:10}}><Text style={{color:'#c8dfcf'}}>{e.status.replaceAll('_',' ')} · {e.id.slice(0,8)}</Text></Pressable>)}</>}
  <Pressable accessibilityRole="button" onPress={onClose} style={{padding:14}}><Text style={{color:'#bde8d2',textAlign:'center'}}>Back to game</Text></Pressable>
 </ScrollView></View></Modal>;
}
