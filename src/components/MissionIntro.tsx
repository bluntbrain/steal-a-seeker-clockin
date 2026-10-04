import React from 'react';
import {Modal,StyleSheet,Text,View} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useSettings} from '../settings/SettingsProvider';
import MissionDemo from './MissionDemo';
import MechanicDemo from './MechanicDemo';
import type {MissionLesson} from '../onboarding/mission-lessons';

/** One visual lesson, one start action. Back never starts a run. */
export default function MissionIntro({lesson,onPlay,onBack,busy=false,error}:{lesson:MissionLesson;onPlay:()=>void;onBack:()=>void;busy?:boolean;error?:string}){
 const {settings}=useSettings();
 return <Modal visible statusBarTranslucent navigationBarTranslucent animationType={settings.reducedEffects?'none':'fade'} onRequestClose={()=>{if(!busy)onBack();}}>
  <SafeAreaProvider style={s.screen}><SafeAreaView edges={['top','bottom','left','right']} style={s.safe}>
   <View style={s.shell}>
    <View style={s.visual} accessible accessibilityRole="image" accessibilityLabel={`${lesson.title}. ${lesson.tip??lesson.body}`}>
     {lesson.demo?<MechanicDemo key={lesson.id} kind={lesson.demo} edition={lesson.edition} reduced={settings.reducedEffects} busy={busy}/>:<MissionDemo key={lesson.id} edition={lesson.edition} reduced={settings.reducedEffects} busy={busy}/>}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to missions" disabled={busy} onPress={onBack} style={s.back}><Text style={s.backText}>‹</Text></Pressable>
    <View testID="mission-intro-footer" style={s.footer}>
     {!!error&&<Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
     <Pressable testID="mission-intro-start" accessibilityRole="button" accessibilityLabel="Play mission" accessibilityState={{busy,disabled:busy}} hapticCue="start" spinner disabled={busy} onPress={onPlay} style={[s.play,busy&&{opacity:.6}]}><Text style={s.playText}>{busy?'Starting…':'PLAY  →'}</Text></Pressable>
    </View>
   </View>
  </SafeAreaView></SafeAreaProvider>
 </Modal>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#0B1513'},safe:{flex:1,alignItems:'center'},shell:{flex:1,width:'100%',maxWidth:560,minHeight:0},visual:{flex:1,minHeight:0,overflow:'hidden'},back:{position:'absolute',top:12,left:16,width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#0B211DCC'},backText:{fontSize:32,lineHeight:36,color:'#D4F2E2'},footer:{paddingHorizontal:22,paddingTop:12,paddingBottom:14,backgroundColor:'#0B1513',gap:8},play:{minHeight:58,borderRadius:20,paddingHorizontal:12,paddingVertical:16,backgroundColor:'#C1EFDA',alignItems:'center',justifyContent:'center'},playText:{color:'#163C29',fontSize:17,fontWeight:'900',letterSpacing:1,textAlign:'center'},error:{color:'#FFD0B1',fontSize:12,lineHeight:17,textAlign:'center'}});
