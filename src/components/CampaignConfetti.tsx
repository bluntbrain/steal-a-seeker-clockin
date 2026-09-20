import React,{useEffect,useRef} from 'react';
import {Animated,Easing,StyleSheet,View,useWindowDimensions} from 'react-native';
const COLORS=['#BFEBDD','#EEE7D5','#75B8A8','#E9CF8B','#AAC6D5'];
/** Lightweight paper pieces, not baked-in artwork. No touches or game state. */
export default function CampaignConfetti({reduced}:{reduced:boolean}){
 const {width,height}=useWindowDimensions(),pieces=useRef(Array.from({length:48},()=>new Animated.Value(0))).current;
 useEffect(()=>{
  pieces.forEach(p=>p.setValue(0));if(reduced)return;
  const animations=pieces.map((p,i)=>Animated.sequence([Animated.delay((i%8)*55),Animated.timing(p,{toValue:1,duration:2800+(i*173%1600),easing:Easing.linear,useNativeDriver:true})]));
  animations.forEach(a=>a.start());return()=>animations.forEach(a=>a.stop());
 },[pieces,reduced]);
 if(reduced)return null;
 return <View pointerEvents="none" testID="campaign-confetti" style={[StyleSheet.absoluteFill,{overflow:'hidden',zIndex:40}]}>{pieces.map((fall,i)=>{
  const start=width*(i%2?.88:.12),end=width*((i*37%101)/100),peak=height*(.07+(i%7)*.037);
  return <Animated.View key={i} style={{position:'absolute',left:start,top:0,width:i%4===0?3:5+(i%3),height:i%4===0?19:7+(i%5),borderRadius:i%5===0?5:1,backgroundColor:COLORS[i%COLORS.length],opacity:fall.interpolate({inputRange:[0,.02,.8,1],outputRange:[0,1,1,0]}),transform:[{translateY:fall.interpolate({inputRange:[0,.17,.32,.5,.75,1],outputRange:[height*.72,peak+height*.12,peak,peak+height*.10,height*.66,height+30]})},{translateX:fall.interpolate({inputRange:[0,.3,.65,1],outputRange:[0,(end-start)*.55,end-start+(i%2?18:-18),end-start]})},{rotate:fall.interpolate({inputRange:[0,1],outputRange:[`${i*31}deg`,`${i*31+(i%2?720:-640)}deg`]})},{scaleX:fall.interpolate({inputRange:[0,.2,.4,.6,.8,1],outputRange:[1,.2,1,.15,1,.3]})}]}}/>;
 })}</View>;
}
