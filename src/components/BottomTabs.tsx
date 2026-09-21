import {useHaptics} from '../feedback/useHaptics';
import React from 'react';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
export type HomeTab='map'|'leaderboard'|'rack';
export const NAV_ICONS={map:require('../../assets/navigation/missions.png'),leaderboard:require('../../assets/navigation/leaderboard.png'),rack:require('../../assets/navigation/hideout.png')};
const tabs:{id:HomeTab;label:string}[]=[{id:'map',label:'Missions'},{id:'leaderboard',label:'Leaderboard'},{id:'rack',label:'Hideout'}];
export default function BottomTabs({selected,onChange,compact=false}:{selected:HomeTab;onChange:(tab:HomeTab)=>void;compact?:boolean}){
 const haptic=useHaptics();
 return <View accessibilityRole="tablist" style={[s.bar,compact&&{height:60,marginTop:6,paddingTop:3}]} testID="home-bottom-tabs">{tabs.map(tab=>{const active=tab.id===selected;return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{selected:active}} aria-selected={active} onPress={()=>{if(!active)haptic('select');onChange(tab.id);}} style={[s.tab,compact&&{minHeight:50}]} testID={`tab-${tab.id}`}><View style={[s.iconWrap,active&&s.active]}><Image source={NAV_ICONS[tab.id]} style={[s.icon,{tintColor:active?'#142E2D':'#849899'}]}/></View><Text style={[s.label,active&&s.activeLabel]}>{tab.label}</Text></Pressable>;})}</View>;
}
const s=StyleSheet.create({bar:{height:70,flexShrink:0,flexDirection:'row',borderTopWidth:1,borderColor:'#263437',paddingTop:7,marginTop:8},tab:{flex:1,alignItems:'center',justifyContent:'center',gap:4,minHeight:56},iconWrap:{width:54,height:30,borderRadius:16,alignItems:'center',justifyContent:'center'},active:{backgroundColor:'#CFE6E4'},icon:{height:21,width:21},label:{fontSize:11,lineHeight:15,color:'#849899',fontWeight:'500'},activeLabel:{color:'#E8F7F1',fontWeight:'800'}});
