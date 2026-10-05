import React,{useEffect,useState} from 'react';
import {AppState,StyleSheet,Text,View} from 'react-native';
import Animated,{cancelAnimation,Easing,runOnJS,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {BOSS_NAMES,type BossId} from '../../shared/campaign-levels';
import {BOSS_MOTION} from './bossMotionAssets';
import {bossEntryPose,BOSS_TAGLINES} from './boss-motion';
import {BOSS_CLEAR_CREDITS,CAMPAIGN_STAR_BONUS} from '../../shared/store';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
const SIZE=240;
/** Brief face reveal. Simulation stays gated until this component completes. */
export default function BossEntrance({boss,reduced=false,onDone}:{boss:BossId;reduced?:boolean;onDone:()=>void}){
 const t=useSharedValue(0),[ready,setReady]=useState(false),[active,setActive]=useState(AppState.currentState==='active');
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>setActive(s==='active'));return()=>sub.remove();},[]);
 useEffect(()=>{if(!active||!ready)return;const end=reduced?.3:2.6;t.value=withTiming(end,{duration:Math.max(0,end-t.value)*1000,easing:Easing.linear},done=>{if(done)runOnJS(onDone)();});return()=>cancelAnimation(t);},[active,ready,reduced,onDone,t]);
 // Failure must never trap a player behind an ornamental entrance.
 useEffect(()=>{if(ready||!active)return;const timer=setTimeout(onDone,3000);return()=>clearTimeout(timer);},[ready,active,onDone]);
 const move=useAnimatedStyle(()=>{const p=bossEntryPose(t.value,reduced);return {transform:[{translateX:p.x},{translateY:p.y},{scale:p.scale}]};});
 const face=useAnimatedStyle(()=>{const p=bossEntryPose(t.value,reduced);return {opacity:p.face,transform:[{translateX:-(p.frame%4)*SIZE},{translateY:-SIZE}]};});
 const overhead=useAnimatedStyle(()=>({opacity:bossEntryPose(t.value,reduced).top}));
 const ring=useAnimatedStyle(()=>({opacity:bossEntryPose(t.value,reduced).ring,transform:[{scale:1+Math.max(0,t.value-.62)*3}]}));
 const fade=useAnimatedStyle(()=>({opacity:reduced?1:Math.min(1,(2.6-t.value)/.18)}));
 return <Animated.View testID="boss-entrance" accessibilityViewIsModal accessibilityLabel={`${BOSS_NAMES[boss]} enters the mission`} style={[s.screen,fade]}>
  <View style={s.floor}><Animated.View style={[s.ring,ring]}/><Animated.View style={[s.actor,move]}>
   <Animated.Image source={BOSS_MOTION[boss]} onLoad={()=>setReady(true)} onError={onDone} style={[s.sheet,face]} resizeMode="stretch"/>
   <Animated.Image source={BOSS_MOTION[boss]} style={[s.sheet,overhead]} resizeMode="stretch"/>
  </Animated.View></View>
  <Text style={s.name}>{BOSS_NAMES[boss].toUpperCase()}</Text>
  <Text style={s.tagline}>{BOSS_TAGLINES[boss]}</Text>
  <Text style={s.stakes}>{BOSS_CLEAR_CREDITS} clear credits · +{CAMPAIGN_STAR_BONUS} per extra star</Text>
  <Pressable accessibilityRole="button" accessibilityLabel="Skip boss entrance" onPress={onDone} style={s.skip}><Text style={s.skipText}>Skip ›</Text></Pressable>
 </Animated.View>;
}
const s=StyleSheet.create({screen:{...StyleSheet.absoluteFillObject,zIndex:79,backgroundColor:'#142823D9',alignItems:'center',justifyContent:'center'},floor:{width:SIZE,height:SIZE,alignItems:'center',justifyContent:'center'},actor:{width:SIZE,height:SIZE,overflow:'hidden'},sheet:{position:'absolute',width:SIZE*4,height:SIZE*2,left:0,top:0},ring:{position:'absolute',width:120,height:48,borderRadius:60,borderWidth:3,borderColor:'#C3F1D6',top:190},name:{color:'#CDEBD9',fontWeight:'900',fontSize:22,letterSpacing:5,marginTop:26},tagline:{color:'#D5E6DE',fontSize:14,lineHeight:21,textAlign:'center',marginTop:12,paddingHorizontal:28,maxWidth:380},stakes:{color:'#E7C986',fontSize:12,textAlign:'center',marginTop:8,paddingHorizontal:24},skip:{position:'absolute',bottom:32,right:24,padding:14,borderRadius:18,backgroundColor:'#25453B'},skipText:{color:'#CDEBD9'}});
