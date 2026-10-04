import React,{useEffect} from 'react';
import {Asset} from 'expo-asset';
import {StyleSheet,Text,View} from 'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useSharedValue,withRepeat,withTiming} from 'react-native-reanimated';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
const courier=require('../../assets/loading-chase-v1/courier.webp');
const SIZE=120;
// Warm during the splash / mission map, without holding up play on decorative art.
let warmed:Promise<unknown>|undefined;
export function warmMissionChaseSprites(){return warmed??(warmed=Asset.loadAsync(courier).catch(()=>undefined));}
/** Presentation only. No timers gate simulation readiness, no per-frame React updates. */
export default function MissionChaseLoader({reduced=false,error='',onRetry,onExit}:{reduced?:boolean;error?:string;onRetry:()=>void;onExit:()=>void}){
 const time=useSharedValue(0),still=reduced||!!error;
 useEffect(()=>{cancelAnimation(time);time.value=0;if(!still)time.value=withRepeat(withTiming(1,{duration:1600,easing:Easing.linear}),-1,false);return()=>cancelAnimation(time);},[still,time]);
 const bob=useAnimatedStyle(()=>({transform:[{translateY:still?0:-Math.abs(Math.sin(time.value*8*Math.PI))*2}]}));
 const frame=useAnimatedStyle(()=>({transform:[{translateX:-(still?0:Math.floor(time.value*16)%4)*SIZE}]}));
 return <View testID="mission-loading" accessibilityViewIsModal style={s.screen}>
  <View style={s.content}>
   <Animated.View accessible accessibilityLabel="Courier running with the Seeker" style={[s.runner,bob]}>
    <Animated.Image accessible={false} source={courier} resizeMode="stretch" style={[s.sheet,frame]}/>
   </Animated.View>
   <Text accessibilityLiveRegion="polite" style={s.status}>{error||'Loading mission…'}</Text>
   {!!error&&<View style={s.actions}><Pressable accessibilityRole="button" accessibilityLabel="Retry loading mission" onPress={onRetry} style={s.retry}><Text style={s.retryText}>Retry loading</Text></Pressable><Pressable accessibilityRole="button" onPress={onExit} style={s.exit}><Text style={s.exitText}>Back to missions</Text></Pressable></View>}
  </View>
 </View>;
}
const s=StyleSheet.create({
 screen:{...StyleSheet.absoluteFillObject,zIndex:80,backgroundColor:'#0C1812',justifyContent:'center',alignItems:'center',padding:24},
 content:{width:'100%',alignItems:'center',gap:20},
 runner:{width:SIZE,height:SIZE,overflow:'hidden'},sheet:{width:SIZE*4,height:SIZE},
 status:{fontSize:14,lineHeight:21,color:'#A6C3B2',textAlign:'center'},
 actions:{alignItems:'center',gap:4},retry:{paddingVertical:13,paddingHorizontal:24,borderRadius:14,backgroundColor:'#CFE6D6'},retryText:{fontWeight:'800',color:'#15352A'},exit:{minHeight:44,justifyContent:'center',paddingHorizontal:20},exitText:{color:'#CFE6D6',fontSize:13,fontWeight:'700'},
});
