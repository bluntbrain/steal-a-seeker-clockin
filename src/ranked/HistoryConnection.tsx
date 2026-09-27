import React,{useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {useAccount} from '../commerce/account-context';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import WalletConnectionError from '../wallet/WalletConnectionError';

export default function HistoryConnection({onSignIn}:{onSignIn:()=>Promise<void>}){
 const account=useAccount(),[busy,setBusy]=useState(false),[awaiting,setAwaiting]=useState(false),[error,setError]=useState<unknown>(null);
 const lock=useRef(false),mounted=useRef(true),signIn=useRef(onSignIn);signIn.current=onSignIn;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 // Wait for the provider's selected wallet to render before creating a session.
 // Keep this view mounted in History on connection, cancellation or error.
 useEffect(()=>{
  if(!awaiting||!account.wallet)return;
  setAwaiting(false);
  void signIn.current().catch(e=>{if(mounted.current)setError(e);}).finally(()=>{lock.current=false;if(mounted.current)setBusy(false);});
 },[awaiting,account.wallet]);
 async function connect(){
  if(lock.current)return;lock.current=true;setBusy(true);setError(null);
  try{if(!account.wallet)await account.connect();if(mounted.current)setAwaiting(true);}
  catch(e){lock.current=false;if(mounted.current){setError(e);setBusy(false);}}
 }
 return <View testID="history-wallet-connect" style={{gap:8,marginTop:8}}><WalletConnectionError error={error}/>
  <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void connect()} style={{minHeight:44,borderRadius:11,backgroundColor:'#CFE6E4',alignItems:'center',justifyContent:'center',padding:10}}><Text style={{color:'#193B36',fontWeight:'800'}}>{busy?'Connecting…':error?'Retry wallet connection':account.wallet?'Sign in to view runs':'Connect wallet'}</Text></Pressable>
 </View>;
}
