import React,{useEffect,useRef} from 'react';
import {Animated,StyleSheet,View,useWindowDimensions} from 'react-native';
export default function CampaignConfetti({reduced}:{reduced:boolean}){
 const {width,height}=useWindowDimensions(),fall=useRef(new Animated.Value(0)).current;
 useEffect(()=>{fall.setValue(0);if(reduced)return;const animation=Animated.timing(fall,{toValue:1,duration:3400,useNativeDriver:true});animation.start();return()=>animation.stop();},[fall,reduced]);
 if(reduced)return null;
 return <View pointerEvents="none" testID="campaign-confetti" style={[StyleSheet.absoluteFill,{overflow:'hidden',zIndex:40}]}>{Array.from({length:28},(_,i)=><Animated.View key={i} style={{position:'absolute',left:width*((i*37%97)/100),top:-40-(i%5)*28,width:i%3===0?5:8,height:i%3===0?12:5,borderRadius:2,backgroundColor:['#CFE6E4','#F3D285','#7CBAA3','#F6F6F5'][i%4],opacity:fall.interpolate({inputRange:[0,.05,.8,1],outputRange:[0,1,1,0]}),transform:[{translateY:fall.interpolate({inputRange:[0,1],outputRange:[0,height+220]})},{translateX:fall.interpolate({inputRange:[0,.5,1],outputRange:[0,(i%2?1:-1)*28,(i%2?1:-1)*62]})},{rotate:fall.interpolate({inputRange:[0,1],outputRange:['0deg',`${i%2?440:-360}deg`]})}]}}/>)}</View>;
}
