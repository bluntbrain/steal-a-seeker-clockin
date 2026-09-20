import React,{useEffect,useRef,useState} from 'react';
import {Linking,Platform,Pressable,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CourierCardSurface} from '../league/CourierCard';
import {shareCard} from '../league/shareCard';
import {CARD_WIDTH,cardHeight,type CourierCardData} from '../league/card';
export const campaignShareText='I cleared all 12 heists in Steal a Seeker. Every phone secured. Your turn.';
export const campaignShareUrl='https://x.com/intent/post?text='+encodeURIComponent(campaignShareText)+'&url='+encodeURIComponent('https://stealaseeker.bluntbrain.com/');
export default function CompletionCard({data,reduced,registerShare}:{data:CourierCardData;reduced:boolean;registerShare:(fn:(()=>Promise<void>)|null)=>void}){
 const {height,width:screenWidth}=useWindowDimensions(),insets=useSafeAreaInsets(),card=useRef<View>(null),[ready,setReady]=useState(false),[notice,setNotice]=useState(''),[saved,setSaved]=useState(false);
 useEffect(()=>{
  registerShare(ready?async()=>{try{setNotice('');await shareCard(data,card,Platform.OS==='web');if(Platform.OS==='web'){setSaved(true);setNotice('Card saved. Open X and attach the image.');}else setNotice('Choose X or another app to share your card.');}catch{setNotice('Could not share. Please try again.');}}:null);
  return()=>registerShare(null);
 },[ready,data,registerShare]);
 // Reserve controls, safe areas, sync status and optional share feedback.
 const width=Math.max(150,Math.min(screenWidth-34,406,(height-insets.top-insets.bottom-190-(notice?65:0))*CARD_WIDTH/cardHeight(data)));
 return <View testID="campaign-celebration-content" style={{alignItems:'center',gap:4}}>
  <CourierCardSurface ref={card} data={data} width={width} onReady={setReady}/>
  {!!notice&&<Text accessibilityLiveRegion="polite" style={{fontSize:11,color:'#CFE6E4',textAlign:'center'}}>{notice}</Text>}
  {saved&&<Pressable accessibilityRole="button" accessibilityLabel="Open X with campaign completion post" onPress={()=>void Linking.openURL(campaignShareUrl)} style={{minHeight:36,justifyContent:'center'}}><Text style={{color:'#FFE3A0',fontWeight:'700'}}>Open X ↗</Text></Pressable>}
 </View>;
}
