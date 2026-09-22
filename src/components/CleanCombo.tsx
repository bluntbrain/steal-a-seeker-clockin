import React,{useEffect,useRef,useState} from 'react';
import {Text,StyleSheet} from 'react-native';
import Animated,{useSharedValue,useAnimatedStyle,withSequence,withTiming,cancelAnimation} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {updateCleanCombo,comboLabel,type CleanCombo as Chain} from '../feedback/clean-combo';
import {useGameAudio} from '../audio/useGameAudio';

export default function CleanCombo({state,run,active,sound,volume,reduced}:{state:GameState;run:string;active:boolean;sound:boolean;volume:number;reduced:boolean}){
 const chain=useRef<Chain|undefined>(undefined),[notice,setNotice]=useState<{count:number;tick:number}|null>(null);
 const player=useGameAudio(require('../../assets/audio-combos/clean-chain.wav'));
 const pulse=useSharedValue(1),opacity=useSharedValue(0),generation=useRef(0);
 const kills=state.combat?.kills??0,damage=state.combat?.damageTaken??0,tick=state.ticks;
 const running=active&&!!state.combat&&state.status==='playing';
 useEffect(()=>{
  const old=chain.current,next=updateCleanCombo(old,{run,tick,kills,damage,active:running});chain.current=next;
  if(!running||next.count<2){setNotice(null);return;}
  if(next.lastKill===tick&&old&&kills>old.previous.kills)setNotice({count:next.count,tick});
 },[run,tick,kills,damage,running]);
 useEffect(()=>{
  const id=++generation.current;player.pause();cancelAnimation(pulse);cancelAnimation(opacity);
  if(!notice||!running){opacity.value=0;return;}
  pulse.value=reduced?1:1.12;
  if(!reduced)pulse.value=withTiming(1,{duration:180});
  opacity.value=1;opacity.value=withSequence(withTiming(1,{duration:700}),withTiming(0,{duration:350}));
  if(sound){player.volume=volume*.34;void player.seekTo(0).then(()=>{if(generation.current===id)player.play();}).catch(()=>{});}
  return()=>{generation.current++;player.pause();};
 },[notice,running,sound,volume,reduced,player,pulse,opacity]);
 const style=useAnimatedStyle(()=>({opacity:opacity.value,transform:[{scale:pulse.value}]}));
 if(!notice||!running)return null;
 return <Animated.View pointerEvents="none" testID="clean-combo" style={[styles.toast,style]}>
  <Text accessibilityLiveRegion="polite" style={styles.label}>{comboLabel(notice.count)}</Text>
 </Animated.View>;
}
const styles=StyleSheet.create({toast:{position:'absolute',top:12,alignSelf:'center',paddingHorizontal:14,paddingVertical:7,borderRadius:16,backgroundColor:'#112D29ED',borderWidth:1,borderColor:'#80CDB4'},label:{fontSize:12,fontWeight:'900',letterSpacing:1,color:'#D1FFE8'}});
