import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import React,{useState} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {Canvas,Path} from '@shopify/react-native-skia';
import {phoneEdition} from '../game/collection';
import {courierSpeedBonus} from '../game/courier-speed';
import type {CampaignEntry} from '../campaign/levels';
import {BOSS_NAMES} from '../../shared/campaign-levels';
import MissionPreview from './MissionPreview';

function StatIcon({kind}:{kind:'guards'|'clock'|'phone'|'reserve'}){
 const paths={guards:'M5 8 H21 V23 H5 Z M13 8 V3 M9 13 V16 M17 13 V16 M9 20 H17 M2 12 V19 M24 12 V19',clock:'M13 6 A9 9 0 1 0 13.01 6 M13 6 V2 M9 2 H17 M13 10 V16 L17 18 M21 5 L24 8',phone:'M8 2 H20 V25 H8 Z M11 5 H17 M12 21 H16',reserve:'M13 3 L23 8 V17 L13 24 L3 17 V8 Z M13 8 V18 M8 13 H18'};
 return <Canvas pointerEvents="none" style={{width:28,height:28}}><Path path={paths[kind]} color={kind==='phone'?'#CBB9EC':'#BBDDD1'} style="stroke" strokeWidth={1.7} strokeCap="round" strokeJoin="round"/></Canvas>;
}
export default function MissionBriefing({entry,available,onBack,onPlay}:{entry:CampaignEntry;available:boolean;onBack:()=>void;onPlay:()=>void}){
 const level=entry.definition,published=entry.number>12,edition=phoneEdition(entry.mission),[area,setArea]=useState({width:0,height:0});
 const initial=level.patrols.filter(p=>p.reserveAfter===undefined).length,reserves=level.patrols.length-initial;
 const size=Math.max(1,Math.min(area.width-2,(area.height-2)*level.width/level.height));
 const target=`${String(Math.floor(level.targetSeconds/60)).padStart(2,'0')}:${String(level.targetSeconds%60).padStart(2,'0')}`;
 const speedBonus=courierSpeedBonus(level);
 return <View testID="campaign-briefing" style={s.screen}>
  <View style={s.heading}><Pressable accessibilityRole="button" accessibilityLabel="Back to district map" onPress={onBack} style={s.back}><Text style={s.backArrow}>‹</Text></Pressable><View style={s.headingText}><Text style={s.eyebrow}>LEVEL {String(entry.number).padStart(2,'0')}{entry.boss?' · BOSS':''}</Text><Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.75} style={s.title}>{level.title.toUpperCase()}</Text></View></View>
  <View style={s.scene} onLayout={event=>{const {width,height}=event.nativeEvent.layout;setArea(old=>old.width===width&&old.height===height?old:{width,height});}}>
   {area.width>0&&area.height>0&&<View testID="mission-preview" style={s.preview}><MissionPreview key={entry.key} mission={entry.mission} definition={level} size={size}/></View>}
  </View>
  <View style={s.details}>
   <View style={s.stats}><View style={s.stat}><StatIcon kind="guards"/><View><Text style={s.value}>{initial}</Text><Text style={s.label}>Patrol guards</Text></View></View><View style={s.stat}><StatIcon kind="clock"/><View><Text style={s.value}>{target}</Text><Text style={s.label}>Target time</Text></View></View></View>
   <View style={s.stats}><View style={s.stat}><StatIcon kind="reserve"/><View><Text style={s.value}>{reserves}</Text><Text style={s.label}>Alarm reinforcements</Text></View></View><View style={s.stat}><StatIcon kind="phone"/><View style={{flex:1}}><Text style={[s.value,{fontSize:12}]} numberOfLines={1}>{entry.boss?BOSS_NAMES[entry.boss]:published?`Level ${entry.number}`:edition.name}</Text><Text style={s.label}>{level.targets?.length??1} phone{(level.targets?.length??1)>1?'s':''} · reach the exit</Text></View></View></View>
   <Text testID="courier-speed-bonus" style={[s.footnote,{color:'#C8EDDF',fontWeight:'700'}]}>{published?(speedBonus?`Courier speed +${speedBonus}%`:'Courier speed · Standard'):speedBonus?`Courier speed +${speedBonus}% · Levels ${speedBonus===8?'5–8':'9–12'}`:'Courier speed · Standard for levels 1–4'}</Text>
   <Pressable accessibilityRole="button" accessibilityLabel={`Start ${level.title}`} disabled={!available} hapticCue="start" spinner onPress={onPlay} style={({pressed})=>[s.play,!available&&s.locked,pressed&&{opacity:.8}]}><Text style={[s.playText,!available&&{color:'#96A7A1'}]}>{!entry.playable?'UPDATE REQUIRED':available?'PLAY  →':'LOCKED'}</Text></Pressable>
   <Text numberOfLines={2} style={s.footnote}>{!entry.playable?'This level needs a newer version of the game.':available?(level.switches?.length?'Tap the power switch to open the locked gate. Then take the Seeker and escape.':level.briefing):'Clear the previous level to unlock this heist.'}</Text>
  </View>
 </View>;
}
const s=StyleSheet.create({screen:{flex:1,minHeight:0,gap:8},heading:{height:49,flexShrink:0,flexDirection:'row',alignItems:'center',gap:11},back:{width:40,height:44,justifyContent:'center',alignItems:'center'},backArrow:{fontSize:39,lineHeight:42,color:'#C8E4DA'},headingText:{flex:1,borderLeftWidth:1,borderColor:'#34433E',paddingLeft:12,gap:3},eyebrow:{fontSize:9,lineHeight:12,color:'#B7DACE',letterSpacing:2,fontWeight:'700'},title:{fontSize:19,lineHeight:23,color:'#EFF7F1',fontWeight:'800',letterSpacing:1.4},scene:{flex:1,minHeight:0,alignItems:'center',justifyContent:'center',backgroundColor:'#0A0D10',borderWidth:1,borderColor:'#34413F',borderRadius:12,overflow:'hidden'},preview:{overflow:'hidden',borderRadius:8},details:{flexShrink:0,borderWidth:1,borderColor:'#34413F',borderRadius:13,padding:12,gap:10,backgroundColor:'#0D1215'},stats:{flexDirection:'row',gap:10},stat:{flex:1,flexDirection:'row',gap:10,alignItems:'center'},value:{color:'#E5EFE9',fontSize:17,lineHeight:21,fontWeight:'800',letterSpacing:.6},label:{color:'#ADC1B8',fontSize:9,lineHeight:13},play:{height:46,borderRadius:24,backgroundColor:'#C8EDDF',alignItems:'center',justifyContent:'center'},playText:{fontSize:17,fontWeight:'800',letterSpacing:3,color:'#16372D'},locked:{backgroundColor:'#24332E'},footnote:{fontSize:10,lineHeight:14,color:'#A9BEB3',textAlign:'center'}});
