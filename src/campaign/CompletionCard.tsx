import React,{useEffect,useRef,useState} from 'react';
import {Animated,Linking,Platform,Pressable,Text,View,useWindowDimensions} from 'react-native';
import CourierCard from '../league/CourierCard';
import {shareCard} from '../league/shareCard';
import type {CourierCardData} from '../league/card';
export const campaignShareText='I cleared all 12 heists in Steal a Seeker. Every phone secured. Your turn.';
export const campaignShareUrl='https://x.com/intent/post?text='+encodeURIComponent(campaignShareText)+'&url='+encodeURIComponent('https://stealaseeker.bluntbrain.com/');
export default function CompletionCard({data,reduced,registerShare}:{data:CourierCardData;reduced:boolean;registerShare:(fn:(()=>Promise<void>)|null)=>void}){
 const {height}=useWindowDimensions(),card=useRef<View>(null),[ready,setReady]=useState(false),[notice,setNotice]=useState(''),[saved,setSaved]=useState(false),glow=useRef(new Animated.Value(.3)).current;
 useEffect(()=>{if(reduced)return;const animation=Animated.loop(Animated.sequence([Animated.timing(glow,{toValue:.9,duration:1600,useNativeDriver:true}),Animated.timing(glow,{toValue:.3,duration:1600,useNativeDriver:true})]));animation.start();return()=>animation.stop();},[glow,reduced]);
 useEffect(()=>{
  registerShare(ready?async()=>{try{setNotice('');await shareCard(data,card,Platform.OS==='web');if(Platform.OS==='web'){setSaved(true);setNotice('Card saved. Open X and attach the image.');}else setNotice('Choose X or another app to share your card.');}catch{setNotice('Could not share. Please try again.');}}:null);
  return()=>registerShare(null);
 },[ready,data,registerShare]);
 const width=Math.max(100,Math.min(180,(height-420)/1.5));
 return <View style={{alignItems:'center',gap:7}}>
  <View style={{padding:5}}><Animated.View pointerEvents="none" testID="campaign-card-glow" style={{position:'absolute',top:-1,left:-1,right:-1,bottom:-1,borderRadius:12,borderWidth:2,borderColor:'#F3D285',backgroundColor:'#DCC16B20',opacity:reduced?.7:glow}}/><CourierCard ref={card} data={data} width={width} onReady={setReady}/></View>
  {!!notice&&<Text accessibilityLiveRegion="polite" style={{fontSize:11,color:'#CFE6E4',textAlign:'center'}}>{notice}</Text>}
  {saved&&<Pressable accessibilityRole="button" accessibilityLabel="Open X with campaign completion post" onPress={()=>void Linking.openURL(campaignShareUrl)} style={{minHeight:36,justifyContent:'center'}}><Text style={{color:'#FFE3A0',fontWeight:'700'}}>Open X ↗</Text></Pressable>}
 </View>;
}
