import React,{useEffect,useRef,useState} from 'react';
import {Linking,Pressable,Text,View} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {useMobileWallet} from '@wallet-ui/react-native-kit';
import {getBase58Decoder} from '@solana/kit';
import {PRODUCTS,tokenAmount,type Order,type ProductId} from '../../shared/commerce';
import {commerceApi} from './client';
import {useAccount} from './account-context';
import {paymentTransaction} from './payment';
import {transactionLink} from '../wallet/config';
const pendingKey=(wallet:string)=>`seeker.order.devnet.${wallet}`;
export default function CommerceSection(){
 const wallet=useMobileWallet(),identity=useAccount(),{account,session,update}=identity,[order,setOrder]=useState<Order>(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const current=useRef(wallet.account?.address);current.current=wallet.account?.address;const alive=useRef(true),busyLock=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{setOrder(undefined);setMessage('');},[wallet.account?.address]);
 async function action(run:()=>Promise<void>){if(busyLock.current)return;busyLock.current=true;setBusy(true);setMessage('');try{await run();}catch(e){if(alive.current)setMessage(e instanceof Error?e.message:'Could not finish. Restore purchases before paying again.');}finally{busyLock.current=false;if(alive.current)setBusy(false);}}
 async function restore(){const s=await session();const pending=(await commerceApi.orders(s.token)).filter(o=>o.status==='quoted'||o.status==='verifying');for(const o of pending.slice(0,5)){await commerceApi.reconcile(s.token,o.id);}const state=await commerceApi.me(s.token);if(current.current===s.wallet){await update(state);const saved=await SecureStore.getItemAsync(pendingKey(s.wallet));if(saved)setOrder(await commerceApi.order(s.token,saved));setMessage('Purchases restored for this wallet.');}}
 async function quote(sku:ProductId){const s=await session();const prior=await SecureStore.getItemAsync(pendingKey(s.wallet));if(prior){const previous=await commerceApi.reconcile(s.token,prior);if(previous.status==='verifying'||previous.status==='needs_review'){setOrder(previous);throw new Error('An earlier payment is still being checked. Do not pay again.');}}
  const next=await commerceApi.quote(s.token,sku,crypto.randomUUID());await SecureStore.setItemAsync(pendingKey(s.wallet),next.id);if(current.current===s.wallet){setOrder(next);setMessage('Review the quote below. Nothing has been charged.');}}
 async function pay(){
  if(!order||order.status==='fulfilled'||order.status==='needs_review')return;
  const s=await session();if(s.wallet!==order.wallet||current.current!==s.wallet)throw new Error('Wallet changed. Restore purchases for the selected wallet.');
  const prepared=await commerceApi.prepare(s.token,order.id);if(current.current!==s.wallet||!alive.current)return;setOrder(prepared);
  if(prepared.status==='fulfilled'){await update(await commerceApi.me(s.token));setMessage('This payment was already completed. Purchases restored.');return;}
  if(!prepared.payment)throw new Error(prepared.detail||'Quote expired. Request a new quote.');
  setMessage('Approve the TEST SKR payment in Phantom. Resuming this approval reuses the same transaction.');
  const signed=await wallet.signAndSendTransactions(paymentTransaction(prepared),BigInt(prepared.payment.contextSlot)),signature=getBase58Decoder().decode(signed);
  const next=await commerceApi.attach(s.token,prepared.id,signature);if(current.current!==s.wallet||!alive.current)return;setOrder(next);setMessage(next.status==='fulfilled'?'Purchase verified.':next.detail||'Payment submitted. Restore purchases to check finality.');await update(await commerceApi.me(s.token));
 }

 const button=(label:string,onPress:()=>void)=> <Pressable disabled={busy} accessibilityRole="button" onPress={onPress} style={{padding:13,borderRadius:10,backgroundColor:'#bde9d6',opacity:busy?.5:1}}><Text style={{color:'#17382b',fontWeight:'700',textAlign:'center'}}>{label}</Text></Pressable>;
 return <View style={{gap:12,borderTopWidth:1,borderTopColor:'#3b5b50',paddingTop:20}}><Text style={{color:'#e6eee3',fontSize:22,fontWeight:'700'}}>Test shop</Text><Text style={{color:'#adc8ba',fontSize:13,lineHeight:20}}>TEST SKR has no monetary value. Purchases are tied to this wallet. Campaign access includes 12 missions. Cosmetics change your look and never change speed, charge or guard detection.</Text>
  {button(busy?'Working…':'Sign in / restore purchases',()=>action(restore))}
  {PRODUCTS.map(p=><View key={p.id} style={{gap:7,paddingVertical:8}}><Text style={{color:'#d8eade',fontSize:15}}>{p.name} · {p.price} TEST SKR</Text><Text style={{color:'#9cb8ab',fontSize:12,lineHeight:18}}>{p.description}</Text>{account?.entitlements.includes(p.id)?<View style={{gap:7}}><Text style={{color:'#9ee7c9'}}>Owned{account.equipment[p.kind]===p.id?' · Equipped':''}</Text>{p.kind!=='access'&&account.equipment[p.kind]!==p.id&&button('Equip',()=>action(async()=>{const s=await session();await update(await commerceApi.equip(s.token,p.id));setMessage(`${p.name} equipped.`);}))}</View>:button('Get quote',()=>action(()=>quote(p.id)))}</View>)}
  {order&&<View style={{gap:10,padding:14,backgroundColor:'#0c1e19',borderRadius:12}}><Text style={{color:'#dbf1e3',fontWeight:'700'}}>Order · {order.status}</Text><Text style={{color:'#b2d1bf'}}>{PRODUCTS.find(p=>p.id===order.sku)?.name} · {tokenAmount(order.amount,order.decimals)} TEST SKR</Text><Text selectable style={{color:'#94ac9f',fontSize:10}}>Mint: {order.mint}</Text>{order.campaignTerms&&<Text style={{color:'#C4F7DC',fontSize:12}}>Complete all {order.campaignTerms.missions} missions with verified replays to claim {order.campaignTerms.rebate} TEST SKR once. Rebate funds are reserved before wallet approval. Unlimited retries; no level entry fees.</Text>}<Text style={{color:'#b2d1bf',fontSize:12}}>Phantom shows the exact network fee before approval. Token amount excludes devnet SOL fees.</Text>{(order.status==='quoted'||order.status==='verifying')&&button(order.payment?'Resume payment in Phantom':'Approve payment in Phantom',()=>action(pay))}{order.signature&&button('View devnet receipt',()=>{void Linking.openURL(transactionLink(order.signature!));})}</View>}
  {!!message&&<Text accessibilityLiveRegion="polite" style={{color:'#d5e7db',fontSize:13,lineHeight:20}}>{message}</Text>}
 </View>;
}
