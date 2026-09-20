import React,{useEffect} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withRepeat,withTiming,cancelAnimation} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import type {LevelDefinition} from '../game/level';

import {phoneObjective} from '../controls/objective';
// An entrance, not an exposed spawn timer. Amber announces an opening door.
export function SecurityEntrances({level,state,size,reduced}:{level:LevelDefinition;state:GameState;size:number;reduced:boolean}){
 const pulse=useSharedValue(.45);
 useEffect(()=>{pulse.value=reduced?.7:withRepeat(withTiming(1,{duration:1100}),-1,true);return()=>cancelAnimation(pulse);},[reduced,pulse]);
 const animated=useAnimatedStyle(()=>({opacity:pulse.value}));
 return <>{level.patrols.map((g,i)=>{
  if(g.reserveAfter===undefined||state.guards[i]?.spawned)return null;
  const opening=state.securityAlarm&&g.reserveAfter-state.alarmSeconds<=4;
  return <View key={i} pointerEvents="none" accessible accessibilityLabel={opening?'Security door opening':'Security entrance'} testID={`security-entrance-${i}`} style={[s.entrance,{left:g.route[0]!.x*size/12-14,top:g.route[0]!.y*size/12-17}]}>
   {opening&&<Animated.View style={[s.warning,animated]}/>}
   <View style={[s.door,opening&&{borderColor:'#F5C36A'}]}><View style={s.seam}/><View style={[s.lamp,{backgroundColor:opening?'#F5C36A':'#749A91'}]}/><View style={s.handle}/></View>
   <View style={[s.threshold,opening&&{backgroundColor:'#F5C36A'}]}/>
  </View>;
 })}</>;
}
export function PhoneObjectivePill({state,total}:{state:GameState;total:number}){
 return <View pointerEvents="none" testID="phone-objective" accessibilityLiveRegion="polite" style={s.objective}>
  <View style={s.phone}><View style={s.phoneLine}/></View><Text style={s.label}>{phoneObjective(state,total)}</Text>
 </View>;
}
const s=StyleSheet.create({entrance:{position:'absolute',width:28,height:34,alignItems:'center',justifyContent:'center'},warning:{position:'absolute',width:38,height:42,borderRadius:12,borderWidth:2,borderColor:'#F5C36A',backgroundColor:'#D789262A'},door:{width:24,height:28,backgroundColor:'#101D22',borderWidth:2,borderColor:'#698981',borderTopLeftRadius:7,borderTopRightRadius:7},seam:{position:'absolute',left:10,top:3,bottom:1,width:1,backgroundColor:'#84938F'},handle:{position:'absolute',right:4,top:14,width:3,height:4,backgroundColor:'#C2D9CB'},lamp:{position:'absolute',width:8,height:2,top:3,left:6,borderRadius:1},threshold:{height:3,width:28,backgroundColor:'#749A91',borderRadius:2},objective:{position:'absolute',bottom:8,alignSelf:'center',backgroundColor:'#161D23ED',borderWidth:1,borderColor:'#796C43',borderRadius:18,paddingHorizontal:12,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:8},phone:{width:10,height:16,borderWidth:1.5,borderColor:'#FFE096',borderRadius:3,justifyContent:'flex-end',paddingBottom:2,alignItems:'center'},phoneLine:{width:4,height:1,backgroundColor:'#FFE096'},label:{fontSize:11,fontWeight:'700',color:'#FFE6AA'}});
