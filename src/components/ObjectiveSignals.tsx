import React,{useEffect} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withRepeat,withTiming,cancelAnimation} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import type {LevelDefinition} from '../game/level';

import {phoneObjective} from '../controls/objective';
import {gateSwitchIndex,mechanismHint} from '../controls/mechanisms';
// An entrance, not an exposed spawn timer. Amber announces an opening door.
export function SecurityEntrances({level,state,size,reduced}:{level:LevelDefinition;state:GameState;size:number;reduced:boolean}){
 const pulse=useSharedValue(.45);
 useEffect(()=>{pulse.value=reduced?.7:withRepeat(withTiming(1,{duration:1100}),-1,true);return()=>cancelAnimation(pulse);},[reduced,pulse]);
 const animated=useAnimatedStyle(()=>({opacity:pulse.value}));
 return <>{level.patrols.map((g,i)=>{
  if(g.reserveAfter===undefined||state.guards[i]?.spawned)return null;
  const opening=(level.combat?.revision??0)>=10?state.thefts>=(g.pickupWave??1):state.securityAlarm&&g.reserveAfter-state.alarmSeconds<=4;
  return <View key={i} pointerEvents="none" accessible accessibilityLabel={opening?'Security door opening':'Security entrance'} testID={`security-entrance-${i}`} style={[s.entrance,{left:g.route[0]!.x*size/12-14,top:g.route[0]!.y*size/12-17}]}>
   {opening&&<Animated.View style={[s.warning,animated]}/>}
   <View style={[s.door,opening&&{borderColor:'#F5C36A'}]}><View style={s.seam}/><View style={[s.lamp,{backgroundColor:opening?'#F5C36A':'#749A91'}]}/><View style={s.handle}/></View>
   <View style={[s.threshold,opening&&{backgroundColor:'#F5C36A'}]}/>
  </View>;
 })}</>;
}
export function PhoneObjectivePill({state,total,level}:{state:GameState;total:number;level:LevelDefinition}){
 const hint=mechanismHint(state,level);
 return <View pointerEvents="none" testID="phone-objective" accessibilityLiveRegion="polite" style={s.objective}>
  {hint?<Text style={[s.label,{fontSize:16}]}>⏻</Text>:<View style={s.phone}><View style={s.phoneLine}/></View>}<Text style={s.label}>{hint??phoneObjective(state,total)}</Text>
 </View>;
}
export function MechanismLabels({level,state,size}:{level:LevelDefinition;state:GameState;size:number}){
 const scale=size/12;
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
  {level.switches?.map((p,i)=>{const active=p.kind==='power'?state.power===1:(state.relayTimers[p.channel??0]??0)>0;return <View key={`switch-${i}`} testID={`switch-label-${i}`} style={[s.mechanismLabel,{left:Math.max(3,Math.min(size-76,p.x*scale-38)),top:p.y*scale-1.15*scale}]}><Text style={[s.mechanismText,{color:active?'#C8F5E0':'#FFE2A3'}]}>{active?'⏻ ON':'TAP ⏻'} · {String.fromCharCode(65+i)}</Text></View>;})}
  {level.gates?.map((g,i)=>{const link=gateSwitchIndex(level,i);if(link<0)return null;return <View key={`gate-${i}`} testID={`gate-label-${i}`} style={[s.mechanismLabel,{left:Math.max(3,Math.min(size-76,(g.box.x+g.box.w/2)*scale-38)),top:g.box.y*scale-18}]}><Text style={[s.mechanismText,{color:state.closedGates[i]?'#FFE2A3':'#C8F5E0'}]}>{state.closedGates[i]?'LOCKED':'OPEN'} · {String.fromCharCode(65+link)}</Text></View>;})}
 </View>;
}
const s=StyleSheet.create({mechanismLabel:{position:'absolute',width:76,paddingVertical:3,borderRadius:5,backgroundColor:'#0E1C23ED',borderWidth:1,borderColor:'#4A615F'},mechanismText:{fontSize:9,lineHeight:11,textAlign:'center',fontWeight:'800',letterSpacing:.6},entrance:{position:'absolute',width:28,height:34,alignItems:'center',justifyContent:'center'},warning:{position:'absolute',width:38,height:42,borderRadius:12,borderWidth:2,borderColor:'#F5C36A',backgroundColor:'#D789262A'},door:{width:24,height:28,backgroundColor:'#101D22',borderWidth:2,borderColor:'#698981',borderTopLeftRadius:7,borderTopRightRadius:7},seam:{position:'absolute',left:10,top:3,bottom:1,width:1,backgroundColor:'#84938F'},handle:{position:'absolute',right:4,top:14,width:3,height:4,backgroundColor:'#C2D9CB'},lamp:{position:'absolute',width:8,height:2,top:3,left:6,borderRadius:1},threshold:{height:3,width:28,backgroundColor:'#749A91',borderRadius:2},objective:{position:'absolute',bottom:8,alignSelf:'center',backgroundColor:'#161D23ED',borderWidth:1,borderColor:'#796C43',borderRadius:18,paddingHorizontal:12,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:8},phone:{width:10,height:16,borderWidth:1.5,borderColor:'#FFE096',borderRadius:3,justifyContent:'flex-end',paddingBottom:2,alignItems:'center'},phoneLine:{width:4,height:1,backgroundColor:'#FFE096'},label:{fontSize:11,fontWeight:'700',color:'#FFE6AA'}});
