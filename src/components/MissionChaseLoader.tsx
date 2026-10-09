import React,{useEffect,useRef} from 'react';
import {Asset} from 'expo-asset';
import {Image,StyleSheet,Text,View} from 'react-native';
import Animated,{cancelAnimation,Easing,runOnJS,useAnimatedStyle,useSharedValue,withSequence,withTiming} from 'react-native-reanimated';
import type {BossId} from '../../shared/campaign-levels';
import {BOSS_NAMES} from '../../shared/campaign-levels';
import {BOSS_POSTERS} from './bossMotionAssets';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
const poster=require('../../assets/mission-loading-poster-v1/poster.webp');
let warmed:Promise<unknown>|undefined;
export function warmMissionLoader(){return warmed??(warmed=Asset.loadAsync(poster).catch(()=>undefined));}
/** Estimated frontend progress stays below full until the scene actually reports ready. */
// the hint needs about two seconds to read, so the loader never finishes sooner than this
const MIN_SHOWN_MS=2000;
export default function MissionChaseLoader({boss,hint,progress=0,reduced=false,error='',onRetry,onExit,onComplete}:{boss?:BossId;hint?:string;progress?:number;reduced?:boolean;error?:string;onRetry:()=>void;onExit:()=>void;onComplete?:()=>void}){
 const ready=Number.isFinite(progress)&&progress>=1,failed=!!error;
 const fill=useSharedValue(.04),started=useRef(Date.now()),completed=useRef(false),complete=useRef(onComplete);complete.current=onComplete;
 const finish=()=>{if(!completed.current){completed.current=true;complete.current?.();}};
 useEffect(()=>{
  cancelAnimation(fill);
  if(failed)return;
  if(ready){
   const left=MIN_SHOWN_MS-(Date.now()-started.current);
   if(reduced){fill.value=1;if(left<=0){finish();return;}const timer=setTimeout(finish,left);return()=>clearTimeout(timer);}
   // Cached assets still get one continuous fill that ends after the minimum; slow loads finish promptly.
   const duration=Math.max(320,left);
   fill.value=withTiming(1,{duration,easing:Easing.inOut(Easing.quad)},done=>{if(done)runOnJS(finish)();});
  }else if(reduced){fill.value=.35;}
  else{
   fill.value=withSequence(
    withTiming(.62,{duration:2400,easing:Easing.out(Easing.quad)}),
    withTiming(.86,{duration:6500,easing:Easing.linear}),
    withTiming(.94,{duration:15000,easing:Easing.out(Easing.quad)}),
   );
  }
  return()=>cancelAnimation(fill);
 },[ready,reduced,failed,fill]);
 const fillStyle=useAnimatedStyle(()=>({width:`${fill.value*100}%`}));
 return <View testID="mission-loading" accessibilityViewIsModal style={s.screen}>
  <Image testID="mission-loading-poster" accessible={false} source={boss?BOSS_POSTERS[boss]:poster} resizeMode="cover" fadeDuration={0} style={[StyleSheet.absoluteFill,{width:"100%",height:"100%"}]}/>
  <View style={s.center}>
   <View style={s.panel}>
    <Text accessibilityLiveRegion="polite" style={s.status}>{error||(boss?`Loading ${BOSS_NAMES[boss]}’s mission…`:'Loading mission…')}</Text>
    {!error&&!!hint&&<Text testID="mission-loading-hint" style={s.hint}>{hint}</Text>}
    {!error&&<View testID="mission-loading-progress" accessibilityRole="progressbar" accessibilityLabel="Loading mission" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ready?100:undefined} style={s.track}>
     <Animated.View style={[s.fill,fillStyle]}><View style={s.highlight}/></Animated.View>
    </View>}
    {!!error&&<View style={s.actions}><Pressable accessibilityRole="button" accessibilityLabel="Retry loading mission" onPress={onRetry} style={s.retry}><Text style={s.retryText}>Retry loading</Text></Pressable><Pressable accessibilityRole="button" onPress={onExit} style={s.exit}><Text style={s.exitText}>Back to missions</Text></Pressable></View>}
   </View>
  </View>
 </View>;
}
const s=StyleSheet.create({
 screen:{...StyleSheet.absoluteFillObject,zIndex:80,backgroundColor:'#0C1812',overflow:'hidden'},
 center:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center',paddingHorizontal:32},
 panel:{width:'100%',maxWidth:290,paddingHorizontal:14,paddingVertical:18,borderRadius:20,backgroundColor:'#0C1812E8',gap:18},
 status:{fontSize:16,lineHeight:23,fontWeight:'700',letterSpacing:.3,color:'#F0E9D9',textAlign:'center'},
 hint:{fontSize:15,lineHeight:21,fontWeight:'600',color:'#A8E3CC',textAlign:'center',marginTop:-6},
 track:{height:12,borderRadius:6,overflow:'hidden',backgroundColor:'#203E33',borderWidth:1,borderColor:'#608E7D'},
 fill:{height:'100%',borderRadius:5,backgroundColor:'#A8E3CC',overflow:'hidden'},
 highlight:{position:'absolute',top:1,left:3,right:3,height:2,borderRadius:1,backgroundColor:'#EDF8DB'},
 actions:{alignItems:'center',gap:4},retry:{paddingVertical:13,paddingHorizontal:24,borderRadius:14,backgroundColor:'#CFE6D6'},retryText:{fontWeight:'800',color:'#15352A'},exit:{minHeight:44,justifyContent:'center',paddingHorizontal:20},exitText:{color:'#CFE6D6',fontSize:13,fontWeight:'700'},
});
