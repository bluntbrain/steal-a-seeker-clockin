import React,{useState,type ReactNode} from 'react';
import {ActivityIndicator,Pressable,ScrollView,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import WalletPanel from '../wallet/WalletPanel';
import {useAccount} from './account-context';
export default function CampaignGate({children}:{children:ReactNode}){
 const {preview,account,loading,wallet,notice}=useAccount(),[open,setOpen]=useState(false);
 if(preview||account?.entitlements.includes('campaign'))return <>{children}</>;
 return <SafeAreaView style={{flex:1,backgroundColor:'#0c1416'}}><WalletPanel visible={open} onClose={()=>setOpen(false)}/><ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:30,gap:22}}>
  <Text style={{color:'#b8e9d9',letterSpacing:3,fontSize:11,fontWeight:'700'}}>STEAL A SEEKER</Text>
  <View style={{height:180,borderWidth:1,borderColor:'#507569',borderRadius:24,backgroundColor:'#203832',alignItems:'center',justifyContent:'center'}}><View style={{width:69,height:119,borderRadius:13,borderWidth:5,borderColor:'#e6eee3',backgroundColor:'#95cfbc',transform:[{rotate:'-12deg'}],alignItems:'center',justifyContent:'center'}}><Text style={{color:'#19362b',fontSize:32}}>◈</Text></View></View>
  <Text style={{color:'#ecf1e5',fontSize:37,fontWeight:'800',letterSpacing:-1}}>One phone. Twelve ways to get caught.</Text>
  <Text style={{color:'#b9cbc0',fontSize:16,lineHeight:25}}>Sneak past patrols, switch off scanners and carry the Seeker to the exit. Buy the campaign once and retry each mission as often as you like.</Text>
  <View style={{gap:8,padding:18,borderColor:'#476357',borderWidth:1,borderRadius:15}}><Text style={{color:'#dcf0e5',fontWeight:'700',fontSize:20}}>Campaign pass · 50 TEST SKR</Text><Text style={{color:'#acc6b7',lineHeight:21}}>12 missions · personal bests · unlimited normal retries</Text><Text style={{color:'#acc6b7',lineHeight:20,fontSize:12}}>Devnet test build. TEST SKR has no monetary value. Phantom also needs devnet SOL for network fees.</Text></View>
  {loading?<ActivityIndicator color="#b8e9d9" accessibilityLabel="Restoring campaign access"/>:<Pressable accessibilityRole="button" onPress={()=>setOpen(true)} style={{padding:18,borderRadius:12,backgroundColor:'#cfe6e4'}}><Text style={{color:'#19352d',fontWeight:'800',textAlign:'center'}}>{wallet?'BUY / RESTORE CAMPAIGN':'CONNECT WALLET'}</Text></Pressable>}
  {!!notice&&<Text style={{color:'#b8c8bc',fontSize:13,lineHeight:20}}>{notice}</Text>}
  <Text style={{color:'#82998b',fontSize:12,lineHeight:20}}>Access follows your wallet. Restore a verified purchase on another device. Approved purchases also work offline on this device.</Text>
 </ScrollView></SafeAreaView>;
}
