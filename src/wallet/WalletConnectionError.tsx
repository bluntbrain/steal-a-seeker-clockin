import React,{useState} from 'react';
import {Linking,Text,View} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {errorKind,walletErrorMessage} from './diagnostics';

/** The same recovery message for pass, credits, skins and league sign-in. */
export default function WalletConnectionError({error}:{error:unknown}){
 const [linkFailed,setLinkFailed]=useState(false);
 if(!error)return null;
 return <View testID="wallet-connection-error" style={{gap:6}}>
  <Text accessibilityLiveRegion="polite" style={{color:'#E5C19D',fontSize:12,lineHeight:18}}>{walletErrorMessage(error)}</Text>
  {errorKind(error)==='wallet-unavailable'&&<Pressable accessibilityRole="link" accessibilityLabel="Get Phantom wallet" onPress={()=>{setLinkFailed(false);void Linking.openURL('https://phantom.com/download').catch(()=>setLinkFailed(true));}} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:'#CFE6E4',fontWeight:'700'}}>Get Phantom ↗</Text></Pressable>}
  {linkFailed&&<Text style={{color:'#E5C19D',fontSize:12}}>Open phantom.com/download in your browser, then return here.</Text>}
 </View>;
}
