import React from 'react';
import {Modal,Pressable,ScrollView,Text,View} from 'react-native';
import {useAccount} from '../commerce/account-context';
import {PRODUCTS} from '../../shared/commerce';
import {CAMPAIGN_IDS,getLevel} from '../game/level';
import type {Progress} from '../progress/model';
export default function Hideout({visible,onClose,onShop,onSync,onDaily,onSettings,progress,syncStatus}:{visible:boolean;onClose:()=>void;onShop:()=>void;onSync:()=>void;onDaily:()=>void;onSettings:()=>void;progress:Progress;syncStatus:string}){
 const {account,wallet,preview}=useAccount(),equipment=account?.equipment??{},framed=equipment.frame==='profile-frame',themed=equipment.rack==='rack-theme',completed=Object.keys(progress.missions).length;
 const button=(text:string,onPress:()=>void)=><Pressable accessibilityRole="button" onPress={onPress} style={{padding:15,borderRadius:12,backgroundColor:'#cfe6e4'}}><Text style={{color:'#19362c',fontWeight:'700',textAlign:'center'}}>{text}</Text></Pressable>;
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#081210ed',padding:20,justifyContent:'center'}}><ScrollView style={{flexGrow:0,maxHeight:'92%',borderRadius:24,backgroundColor:'#152724'}} contentContainerStyle={{padding:22,gap:18}}>
  <Text style={{color:'#a8ecd7',fontSize:11,letterSpacing:2}}>YOUR HIDEOUT</Text><Text style={{color:'#edf2e8',fontSize:29,fontWeight:'800'}}>The getaway starts here.</Text>
  <View style={{padding:18,borderRadius:18,borderWidth:framed?3:1,borderColor:framed?'#c8eedb':'#3e6054',backgroundColor:framed?'#274d41':'#11211c',gap:10}}><Text style={{color:'#e2f2e8',fontSize:20,fontWeight:'700'}}>◈  Courier</Text><Text selectable style={{color:'#a9c8b8',fontSize:11}}>{wallet??'Browser playtest profile'}</Text><Text style={{color:'#d1e4d8'}}>{completed} / 12 missions · {Object.values(progress.missions).reduce((n,b)=>n+(b?.stars??0),0)} stars</Text>{framed&&<Text style={{color:'#c8eedb',fontSize:11}}>ESCAPE CREW · PROFILE FRAME</Text>}</View>
  <View style={{gap:6}}><Text style={{color:'#dcece2',fontSize:17,fontWeight:'700'}}>Wardrobe</Text><Text style={{color:'#adc8b8',lineHeight:20}}>{PRODUCTS.find(p=>p.id===equipment.outfit)?.name??'Original Courier'} · {equipment.trail?'Escape trail':'No escape trail'}</Text><Text style={{color:'#adc8b8',fontSize:12}}>Outfits and trails are visible in the 3D game. All couriers use the same game rules.</Text></View>
  {button('Shop / equip owned items',onShop)}{button('Daily challenge / leaderboard',onDaily)}{button('Settings / controls',onSettings)}
  <Text style={{color:'#dcece2',fontSize:20,fontWeight:'700'}}>Recovered Seekers</Text><Text style={{color:'#adc8b8',fontSize:12,lineHeight:20}}>One collectible for each completed mission. These are fictional game items, not physical phone rewards.</Text>
  <View style={{backgroundColor:themed?'#324d4b':'#101c19',borderColor:themed?'#c5dfe0':'#3a5248',borderWidth:themed?3:1,padding:12,borderRadius:15,flexDirection:'row',flexWrap:'wrap',gap:9}}>
   {CAMPAIGN_IDS.map(id=>{const won=!!progress.missions[id],l=getLevel(id);return <View key={id} accessibilityLabel={`${l.title}: ${won?'recovered':'not recovered'}`} style={{width:'30%',minHeight:105,padding:9,borderBottomWidth:4,borderColor:themed?'#a8d9d0':'#3a5248',alignItems:'center',justifyContent:'center',gap:9}}><View style={{width:23,height:40,borderWidth:2,borderRadius:4,borderColor:won?'#eceddf':'#46574f',backgroundColor:won?'#a8dcc8':'#1f2d27'}}/><Text style={{color:won?'#d8eadd':'#72877b',textAlign:'center',fontSize:9}}>{l.number}. {l.title}</Text></View>;})}
  </View>
  {!!syncStatus&&<Text style={{color:'#acc9b7',fontSize:12,lineHeight:19}}>{syncStatus}</Text>}{!preview&&button('Sync progress',onSync)}{preview&&<Text style={{color:'#849d8e',fontSize:12}}>Gameplay preview. Use Android to restore purchases and sync your wallet.</Text>}
  {button('Back to game',onClose)}
 </ScrollView></View></Modal>;
}
