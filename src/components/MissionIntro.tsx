import React,{useState} from 'react';
import {Modal,StyleSheet,Text,View} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useSettings} from '../settings/SettingsProvider';
import MissionDemo from './MissionDemo';
import MechanicDemo from './MechanicDemo';
import type {MissionLesson} from '../onboarding/mission-lessons';

/** Play stays pinned inside the safe area from the first frame; the looping demo never gates it. */
export default function MissionIntro({lesson,onPlay,onBack,busy=false,error}:{lesson:MissionLesson;onPlay:()=>void;onBack:()=>void;busy?:boolean;error?:string}){
 const {settings}=useSettings();
 const [footerHeight,setFooterHeight]=useState(98);
 return <Modal visible statusBarTranslucent navigationBarTranslucent animationType={settings.reducedEffects?'none':'fade'} onRequestClose={()=>{if(!busy)onBack();}}>
  <SafeAreaProvider style={s.screen}><SafeAreaView edges={['top','bottom','left','right']} style={s.safe}>
   <View style={s.shell}>
    <View style={[s.visual,{bottom:footerHeight}]} accessible accessibilityRole="image" accessibilityLabel={`${lesson.title}. ${lesson.tip??lesson.body}`}>
     {lesson.demo?<MechanicDemo key={lesson.id} kind={lesson.demo} edition={lesson.edition} reduced={settings.reducedEffects} busy={busy}/>:<MissionDemo key={lesson.id} edition={lesson.edition} reduced={settings.reducedEffects} busy={busy}/>}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to missions" disabled={busy} onPress={onBack} style={s.back}><Text style={s.backText}>‹</Text></Pressable>
    <View testID="mission-intro-footer" onLayout={event=>setFooterHeight(event.nativeEvent.layout.height)} style={s.footer}>
     {!!error&&<Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
     <Pressable testID="mission-intro-start" accessibilityRole="button" accessibilityLabel="Play mission" accessibilityState={{busy,disabled:busy}} hapticCue="start" spinner disabled={busy} onPress={onPlay} style={[s.play,busy&&{opacity:.6}]}><Text style={s.playText}>{busy?'Starting…':'PLAY  →'}</Text></Pressable>
    </View>
   </View>
  </SafeAreaView></SafeAreaProvider>
 </Modal>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#0B1513',overflow:'hidden'},safe:{flex:1,minHeight:0,alignItems:'center'},shell:{flex:1,width:'100%',maxWidth:560,minHeight:0,overflow:'hidden'},visual:{position:'absolute',top:0,left:0,right:0,overflow:'hidden'},back:{position:'absolute',top:12,left:16,width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#0B211DCC'},backText:{fontSize:32,lineHeight:36,color:'#D4F2E2'},footer:{position:'absolute',bottom:0,left:0,right:0,zIndex:2,paddingHorizontal:22,paddingTop:16,paddingBottom:24,backgroundColor:'#0B1513',gap:8},play:{minHeight:58,borderRadius:20,paddingHorizontal:12,paddingVertical:16,backgroundColor:'#C1EFDA',alignItems:'center',justifyContent:'center'},playText:{color:'#163C29',fontSize:17,fontWeight:'900',letterSpacing:1,textAlign:'center'},error:{color:'#FFD0B1',fontSize:12,lineHeight:17,textAlign:'center'}});
