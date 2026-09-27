import React,{useEffect,useRef,useState} from 'react';
import WalletConnectionError from '../wallet/WalletConnectionError';
import {Text,View} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useLoggedWallet} from '../wallet/useLoggedWallet';
import CommerceSection from './CommerceSection';
import CreditPackCards from './CreditPackCards';
import {CREDIT_PACKS,type CreditPackId} from '../../shared/store';
import type {CreditCheckoutProps} from './credit-checkout-types';
export default function CreditCheckout({selected,onSelect,onClose}:CreditCheckoutProps){
 const wallet=useLoggedWallet(),[busy,setBusy]=useState(false),[error,setError]=useState<unknown>(null),lock=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 if(wallet.account)return <CommerceSection sku={selected} onComplete={onClose} renderSelection={(locked,sku)=>CREDIT_PACKS.some(p=>p.id===sku)?<CreditPackCards selected={sku as CreditPackId} onSelect={onSelect} locked={locked}/>:<Text style={{color:'#D7E8DD'}}>Checking your earlier Game Pass purchase.</Text>}/>;
 async function connect(){if(lock.current)return;lock.current=true;setBusy(true);setError(null);try{await wallet.connect();}catch(e){if(mounted.current)setError(e);}finally{lock.current=false;if(mounted.current)setBusy(false);}}
 return <View style={{gap:16}}><CreditPackCards selected={selected} onSelect={onSelect} locked={busy}/><Text style={{color:'#A5BFAF',fontSize:12,textAlign:'center'}}>Connect to see live SKR / SOL prices.</Text><WalletConnectionError error={error}/><Pressable disabled={busy} accessibilityRole="button" onPress={()=>void connect()} style={{backgroundColor:'#CFE6E4',borderRadius:17,minHeight:54,alignItems:'center',justifyContent:'center'}}><Text style={{fontWeight:'800',color:'#17382B'}}>{busy?'Opening wallet…':error?'Retry wallet connection':'Connect wallet'}</Text></Pressable></View>;
}
