import React,{useEffect,useRef} from 'react';
import {Asset} from 'expo-asset';
import {Animated,Easing,Image,StyleSheet,Text,View} from 'react-native';
import type {BossId} from '../../shared/campaign-levels';
import {BOSS_NAMES} from '../../shared/campaign-levels';
import {BOSS_POSTERS} from './bossMotionAssets';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
const poster=require('../../assets/mission-loading-poster-v1/poster.webp');
let warmed:Promise<unknown>|undefined;
export function warmMissionLoader(){return warmed??(warmed=Asset.loadAsync(poster).catch(()=>undefined));}
/** Static artwork with progress reported by the scene, never a timed fake percentage. */
export default function MissionChaseLoader({boss,progress=0,reduced=false,error='',onRetry,onExit}:{boss?:BossId;progress?:number;reduced?:boolean;error?:string;onRetry:()=>void;onExit:()=>void}){
 const value=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 const fill=useRef(new Animated.Value(value)).current;
 useEffect(()=>{
  if(reduced||error){fill.setValue(value);return;}
  const animation=Animated.timing(fill,{toValue:value,duration:180,easing:Easing.out(Easing.cubic),useNativeDriver:false});
  animation.start();return()=>animation.stop();
 },[value,reduced,error,fill]);
 return <View testID="mission-loading" accessibilityViewIsModal style={s.screen}>
  <Image testID="mission-loading-poster" accessible={false} source={boss?BOSS_POSTERS[boss]:poster} resizeMode="cover" fadeDuration={0} style={[StyleSheet.absoluteFill,{width:"100%",height:"100%"}]}/>
  <View style={s.center}>
   <View style={s.panel}>
    <Text accessibilityLiveRegion="polite" style={s.status}>{error||(boss?`Loading ${BOSS_NAMES[boss]}’s mission…`:'Loading mission…')}</Text>
    {!error&&<View testID="mission-loading-progress" accessibilityRole="progressbar" accessibilityLabel="Loading mission" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value*100)} style={s.track}>
     <Animated.View style={[s.fill,{width:fill.interpolate({inputRange:[0,1],outputRange:['0%','100%']})}]}><View style={s.highlight}/></Animated.View>
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
 track:{height:12,borderRadius:6,overflow:'hidden',backgroundColor:'#203E33',borderWidth:1,borderColor:'#608E7D'},
 fill:{height:'100%',borderRadius:5,backgroundColor:'#A8E3CC',overflow:'hidden'},
 highlight:{position:'absolute',top:1,left:3,right:3,height:2,borderRadius:1,backgroundColor:'#EDF8DB'},
 actions:{alignItems:'center',gap:4},retry:{paddingVertical:13,paddingHorizontal:24,borderRadius:14,backgroundColor:'#CFE6D6'},retryText:{fontWeight:'800',color:'#15352A'},exit:{minHeight:44,justifyContent:'center',paddingHorizontal:20},exitText:{color:'#CFE6D6',fontSize:13,fontWeight:'700'},
});
