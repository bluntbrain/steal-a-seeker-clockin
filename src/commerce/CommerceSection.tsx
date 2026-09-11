import React,{useEffect,useRef,useState} from 'react';
import {Linking,Pressable,Text,View} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {useMobileWallet} from '@wallet-ui/react-native-kit';
import {address,AccountRole,type Instruction} from '@solana/kit';
import {getTransferCheckedInstruction} from '@solana-program/token';
import {getAddMemoInstruction} from '@solana-program/memo';
import {fromUint8Array} from 'js-base64';
import {PRODUCTS,tokenAmount,type AccountState,type Order,type ProductId} from '../../shared/commerce';
import {commerceApi,type Session,ApiError} from './client';
import {transactionLink} from '../wallet/config';
const storeKey=(wallet:string)=>`seeker.commerce.devnet.${wallet}`;
const pendingKey=(wallet:string)=>`seeker.order.devnet.${wallet}`;
export default function CommerceSection(){
 const wallet=useMobileWallet(),[account,setAccount]=useState<AccountState>(),[order,setOrder]=useState<Order>(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const current=useRef(wallet.account?.address);current.current=wallet.account?.address;const alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{setAccount(undefined);setOrder(undefined);setMessage('');},[wallet.account?.address]);
 async function session():Promise<Session>{
  const selected=wallet.account;if(!selected)throw new Error('Connect your wallet first.');
  const saved=await SecureStore.getItemAsync(storeKey(selected.address));if(saved){try{const s=JSON.parse(saved) as Session;if(s.wallet===selected.address&&new Date(s.expiresAt).getTime()>Date.now()){await commerceApi.me(s.token);return s;}}catch(e){if(e instanceof ApiError&&e.status!==401)throw e;}await SecureStore.deleteItemAsync(storeKey(selected.address));}
  setMessage('Sign in with your wallet. This does not make a payment.');const challenge=await commerceApi.challenge(selected.address),signed=await wallet.signIn(challenge.payload);
  if(signed.account.address!==selected.address||current.current!==selected.address)throw new Error('Wallet changed. Start sign-in again.');
  const result=await commerceApi.signIn({id:challenge.id,wallet:selected.address,signedMessage:fromUint8Array(signed.signedMessage),signature:fromUint8Array(signed.signature)});
  const s={token:result.token,wallet:selected.address,expiresAt:result.expiresAt};await SecureStore.setItemAsync(storeKey(s.wallet),JSON.stringify(s));return s;
 }
 async function action(run:()=>Promise<void>){if(busy)return;setBusy(true);setMessage('');try{await run();}catch(e){if(alive.current)setMessage(e instanceof Error?e.message:'Could not finish. Restore purchases before paying again.');}finally{if(alive.current)setBusy(false);}}
 async function restore(){const s=await session();const pending=(await commerceApi.orders(s.token)).filter(o=>o.status==='quoted'||o.status==='verifying');for(const o of pending.slice(0,5)){await commerceApi.reconcile(s.token,o.id);}const state=await commerceApi.me(s.token);if(current.current===s.wallet){setAccount(state);const saved=await SecureStore.getItemAsync(pendingKey(s.wallet));if(saved)setOrder(await commerceApi.order(s.token,saved));setMessage('Purchases restored for this wallet.');}}
 async function quote(sku:ProductId){const s=await session();const prior=await SecureStore.getItemAsync(pendingKey(s.wallet));if(prior){const previous=await commerceApi.reconcile(s.token,prior);if(previous.status==='verifying'||previous.status==='needs_review'){setOrder(previous);throw new Error('An earlier payment is still being checked. Do not pay again.');}}
  const next=await commerceApi.quote(s.token,sku,crypto.randomUUID());await SecureStore.setItemAsync(pendingKey(s.wallet),next.id);if(current.current===s.wallet){setOrder(next);setMessage('Review the quote below. Nothing has been charged.');}}
 async function pay(){if(!order||order.status!=='quoted')return;const s=await session();if(s.wallet!==order.wallet)throw new Error('This order belongs to a different wallet.');if(new Date(order.expiresAt).getTime()<=Date.now())throw new Error('Quote expired. Restore purchases, then request a new quote.');
  // Reference is appended to TransferChecked, as specified by Solana Pay; memo accounts require signatures.
  const transfer=getTransferCheckedInstruction({source:address(order.source),mint:address(order.mint),destination:address(order.destination),authority:address(order.wallet),amount:BigInt(order.amount),decimals:order.decimals},{programAddress:address(order.tokenProgram)});
  const payment:Instruction={...transfer,accounts:[...transfer.accounts,{address:address(order.reference),role:AccountRole.READONLY}]};
  setMessage('Approve the TEST SKR payment in Phantom. Network fees are paid in devnet SOL.');
  const signature=await wallet.sendTransactions([payment,getAddMemoInstruction({memo:order.memo})]);
  // The durable order reference lets the server recover even if this callback or request is lost.
  const next=await commerceApi.attach(s.token,order.id,signature);if(current.current!==s.wallet)return;setOrder(next);setMessage(next.status==='fulfilled'?'Purchase verified.':next.detail||'Payment submitted. Restore purchases to check finality.');setAccount(await commerceApi.me(s.token));
 }
 const button=(label:string,onPress:()=>void)=> <Pressable disabled={busy} accessibilityRole="button" onPress={onPress} style={{padding:13,borderRadius:10,backgroundColor:'#bde9d6',opacity:busy?.5:1}}><Text style={{color:'#17382b',fontWeight:'700',textAlign:'center'}}>{label}</Text></Pressable>;
 return <View style={{gap:12,borderTopWidth:1,borderTopColor:'#3b5b50',paddingTop:20}}><Text style={{color:'#e6eee3',fontSize:22,fontWeight:'700'}}>Test shop</Text><Text style={{color:'#adc8ba',fontSize:13,lineHeight:20}}>TEST SKR has no monetary value. Purchases are tied to this wallet. Game content and cosmetic rendering are still being built.</Text>
  {button(busy?'Working…':'Sign in / restore purchases',()=>action(restore))}
  {PRODUCTS.map(p=><View key={p.id} style={{gap:7,paddingVertical:8}}><Text style={{color:'#d8eade',fontSize:15}}>{p.name} · {p.price} TEST SKR</Text><Text style={{color:'#9cb8ab',fontSize:12,lineHeight:18}}>{p.description}</Text>{account?.entitlements.includes(p.id)?<Text style={{color:'#9ee7c9'}}>Owned{account.equipment[p.kind]===p.id?' · Equipped':''}</Text>:button('Get quote',()=>action(()=>quote(p.id)))}</View>)}
  {order&&<View style={{gap:10,padding:14,backgroundColor:'#0c1e19',borderRadius:12}}><Text style={{color:'#dbf1e3',fontWeight:'700'}}>Order · {order.status}</Text><Text style={{color:'#b2d1bf'}}>{PRODUCTS.find(p=>p.id===order.sku)?.name} · {tokenAmount(order.amount,order.decimals)} TEST SKR</Text><Text selectable style={{color:'#94ac9f',fontSize:10}}>Mint: {order.mint}</Text><Text style={{color:'#b2d1bf',fontSize:12}}>Phantom shows the exact network fee before approval. Token amount excludes devnet SOL fees.</Text>{order.status==='quoted'&&button('Approve payment in Phantom',()=>action(pay))}{order.signature&&button('View devnet receipt',()=>{void Linking.openURL(transactionLink(order.signature!));})}</View>}
  {!!message&&<Text accessibilityLiveRegion="polite" style={{color:'#d5e7db',fontSize:13,lineHeight:20}}>{message}</Text>}
 </View>;
}
