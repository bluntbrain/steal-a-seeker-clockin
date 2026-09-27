import React,{useEffect,useState} from 'react';
import {Modal,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useSettings} from '../settings/SettingsProvider';
import MissionDemo from './MissionDemo';
import MechanicDemo from './MechanicDemo';
import type {MissionLesson} from '../onboarding/mission-lessons';

/** Only Play/Skip starts a run. Replaying the demo has no game side effects. */
export default function MissionIntro({lesson,onPlay,onBack,busy=false,error}:{lesson:MissionLesson;onPlay:()=>void;onBack:()=>void;busy?:boolean;error?:string}){
 const {settings}=useSettings(),{height}=useWindowDimensions();
 const [alternate,setAlternate]=useState(false);
 useEffect(()=>setAlternate(false),[lesson.id]);
 const mechanic=lesson.demo?(alternate?undefined:lesson.demo):alternate?'drone':undefined;
 const compact=height<740;
 return <Modal visible statusBarTranslucent navigationBarTranslucent animationType={settings.reducedEffects?'none':'fade'} onRequestClose={()=>{if(!busy)onBack();}}>
  {/* A Modal owns a separate native window: measure its insets, not the screen behind it. */}
  <SafeAreaProvider style={s.screen}><SafeAreaView edges={['top','bottom','left','right']} style={s.safe}>
   <View style={s.shell}>
    <View style={s.top}><Pressable accessibilityRole="button" accessibilityLabel="Back from mission tip" disabled={busy} onPress={onBack} style={s.smallButton}><Text style={s.smallText}>‹ Back</Text></Pressable><Text style={s.kicker}>{lesson.kicker}</Text><Pressable accessibilityRole="button" accessibilityLabel="Skip tip and start mission" disabled={busy} hapticCue="start" onPress={onPlay} style={s.smallButton}><Text style={s.smallText}>Skip ›</Text></Pressable></View>
    <ScrollView testID="mission-intro-scroll" style={s.scroll} contentContainerStyle={[s.content,compact&&{gap:14,paddingTop:6}]} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
     <View style={{gap:7}}><Text accessibilityRole="header" style={[s.title,compact&&{fontSize:25,lineHeight:29}]}>{mechanic==='drone'?'Stop the scout drone':mechanic?lesson.title:'Watch. Then make your move.'}</Text><Text style={s.subtitle}>{mechanic==='drone'?'It does not shoot. It tells the guards where you are.':mechanic?'Watch the threat. Learn how to get past it.':'Tap the floor to move. Tap an enemy to shoot.'}</Text></View>
     {mechanic?<MechanicDemo key={lesson.id+mechanic} kind={mechanic} edition={lesson.edition} reduced={settings.reducedEffects} busy={busy}/>:<MissionDemo key={lesson.id} edition={lesson.edition} reduced={settings.reducedEffects} busy={busy}/>}
     <Pressable accessibilityRole="button" accessibilityLabel={mechanic?'Show basic controls':lesson.demo?'Show this mission mechanic':'Learn about scout drones'} disabled={busy} onPress={()=>setAlternate(v=>!v)} style={{minHeight:44,justifyContent:'center',alignItems:'center'}}><Text style={{color:'#BEE7D1',fontSize:12,fontWeight:'700',textDecorationLine:'underline'}}>{mechanic?'Replay basic controls':lesson.demo?'Watch this mission’s mechanic':'Meet the scout drone →'}</Text></Pressable>
     <View style={s.tip}><Text style={s.tipLabel}>THIS MISSION · {lesson.title}</Text><Text style={s.tipBody}>{lesson.tip??lesson.body}</Text></View>
     <Text style={s.collection}>{lesson.footer}</Text>
    </ScrollView>
    {/* Keep the CTA outside scrolling content: long tips and font scaling cannot bury it. */}
    <View testID="mission-intro-footer" style={s.footer}>
     {!!error&&<Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
     <Pressable testID="mission-intro-start" accessibilityRole="button" accessibilityLabel="Start mission after tip" accessibilityState={{busy,disabled:busy}} hapticCue="start" disabled={busy} onPress={onPlay} style={[s.play,busy&&{opacity:.6}]}><Text style={s.playText}>{busy?'Starting…':lesson.playLabel??'PLAY MISSION  →'}</Text></Pressable>
    </View>
   </View>
  </SafeAreaView></SafeAreaProvider>
 </Modal>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#0B1513'},safe:{flex:1,alignItems:'center'},shell:{flex:1,width:'100%',maxWidth:460,minHeight:0},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,paddingHorizontal:20,paddingVertical:4,flexShrink:0},smallButton:{minHeight:44,minWidth:44,justifyContent:'center'},smallText:{fontSize:13,color:'#BED7CB'},kicker:{flex:1,textAlign:'center',fontSize:10,fontWeight:'800',letterSpacing:1,color:'#B3DCC8'},scroll:{flex:1,minHeight:0},content:{paddingHorizontal:20,paddingTop:14,paddingBottom:18,gap:18},title:{fontSize:29,lineHeight:33,color:'#EEF5E9',fontWeight:'900',letterSpacing:-.6,textAlign:'center'},subtitle:{fontSize:13,lineHeight:20,textAlign:'center',color:'#BED2C8'},tip:{borderWidth:1,borderColor:'#2C4B3F',borderRadius:15,padding:13,gap:6,backgroundColor:'#11201B'},tipLabel:{fontSize:10,lineHeight:15,fontWeight:'800',letterSpacing:.5,color:'#C4EDDA'},tipBody:{fontSize:12,lineHeight:18,color:'#B1CDBE'},collection:{fontSize:11,lineHeight:17,textAlign:'center',color:'#89AD9A'},footer:{flexShrink:0,paddingHorizontal:20,paddingTop:10,paddingBottom:12,borderTopWidth:1,borderColor:'#20372D',backgroundColor:'#0B1513',gap:8},play:{minHeight:56,borderRadius:17,paddingHorizontal:12,paddingVertical:14,backgroundColor:'#C1EFDA',alignItems:'center',justifyContent:'center'},playText:{color:'#163C29',fontSize:15,fontWeight:'900',letterSpacing:.8,textAlign:'center'},error:{color:'#FFD0B1',fontSize:12,lineHeight:17,textAlign:'center'}});
