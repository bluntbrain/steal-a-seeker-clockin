import React,{useEffect,useRef} from 'react';
import {Animated,Easing,Modal,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useSettings} from '../settings/SettingsProvider';
import PhoneArt from './PhoneArt';
import CourierArt from './CourierArt';
import type {MissionLesson} from '../onboarding/mission-lessons';
/** Presentation only: callers issue the mission/run only after Play or Skip. */
export default function MissionIntro({lesson,onPlay,onBack,busy=false,error}:{lesson:MissionLesson;onPlay:()=>void;onBack:()=>void;busy?:boolean;error?:string}){
 const {settings}=useSettings(),{height,fontScale}=useWindowDimensions(),motion=useRef(new Animated.Value(0)).current;
 useEffect(()=>{motion.setValue(0);if(settings.reducedEffects)return;const animation=Animated.loop(Animated.sequence([Animated.timing(motion,{toValue:1,duration:1600,easing:Easing.inOut(Easing.quad),useNativeDriver:true}),Animated.timing(motion,{toValue:0,duration:1600,easing:Easing.inOut(Easing.quad),useNativeDriver:true})]));animation.start();return()=>animation.stop();},[motion,lesson.id,settings.reducedEffects]);
 const short=height<720,artHeight=short?180:260;
 const body=<View style={[s.content,{gap:short?14:20}]}>
  <View style={s.top}><Pressable accessibilityRole="button" accessibilityLabel="Back from mission tip" disabled={busy} onPress={onBack} style={s.smallButton}><Text style={s.smallText}>‹ Back</Text></Pressable><Text style={s.kicker}>{lesson.kicker}</Text><Pressable accessibilityRole="button" accessibilityLabel="Skip tip and start mission" disabled={busy} onPress={onPlay} style={s.smallButton}><Text style={s.smallText}>Skip ›</Text></Pressable></View>
  <View style={{flex:1,minHeight:8}}/>
  <View accessibilityLabel={lesson.collection?'Different collectible Seeker phone designs':'Courier and the mission Seeker phone'} style={[s.art,{height:artHeight}]}>
   <View style={s.halo}/><View style={s.track}/>
   {lesson.collection?<><View style={{position:'absolute',left:25,bottom:20,transform:[{rotate:'-16deg'}],opacity:.6}}><PhoneArt index={0} height={artHeight*.6}/></View><View style={{position:'absolute',right:25,bottom:20,transform:[{rotate:'16deg'}],opacity:.6}}><PhoneArt index={11} height={artHeight*.6}/></View></>:<View style={{position:'absolute',left:25,bottom:5}}><CourierArt height={artHeight*.82}/></View>}
   <Animated.View style={{marginLeft:lesson.collection?0:90,transform:[{translateY:motion.interpolate({inputRange:[0,1],outputRange:[0,-14]})},{rotate:motion.interpolate({inputRange:[0,1],outputRange:['-5deg','5deg']})}]}}><PhoneArt index={lesson.edition} height={artHeight*.75}/></Animated.View>
   <View style={s.edition}><Text style={s.editionText}>{lesson.collection?'12 DESIGNS TO COLLECT':'SEEKER // '+String(lesson.edition+1).padStart(2,'0')}</Text></View>
  </View>
  <View style={{gap:12}}><Text accessibilityRole="header" style={[s.title,{fontSize:short?28:34,lineHeight:short?32:38}]}>{lesson.title}</Text><Text style={s.body}>{lesson.body}</Text></View>
  <View style={s.cue}><Animated.View style={[s.dot,{opacity:motion.interpolate({inputRange:[0,1],outputRange:[.45,1]})}]}/><Text style={s.cueText}>{lesson.cue}</Text></View>
  <View style={{flex:1,minHeight:8}}/>
  <Text style={s.footer}>{lesson.footer}</Text>
  {!!error&&<Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
  <Pressable accessibilityRole="button" accessibilityLabel="Start mission after tip" hapticCue="start" disabled={busy} onPress={onPlay} style={[s.play,busy&&{opacity:.6}]}><Text style={s.playText}>{busy?'Starting…':'LET’S GO  →'}</Text></Pressable>
 </View>;
 return <Modal visible animationType={settings.reducedEffects?'none':'fade'} onRequestClose={()=>{if(!busy)onBack();}}><SafeAreaView style={s.screen}><View style={s.shell}>{height<590||fontScale>1.2?<ScrollView contentContainerStyle={{flexGrow:1}}>{body}</ScrollView>:body}</View></SafeAreaView></Modal>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#0B1513',alignItems:'center'},shell:{flex:1,width:'100%',maxWidth:460},content:{flex:1,padding:22},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:5},smallButton:{minHeight:44,minWidth:44,justifyContent:'center'},smallText:{fontSize:12,color:'#B7D0C4'},kicker:{flex:1,textAlign:'center',fontSize:9,fontWeight:'800',letterSpacing:1,color:'#9DBDAC'},art:{alignItems:'center',justifyContent:'center',overflow:'hidden'},halo:{position:'absolute',width:210,height:210,borderRadius:105,borderWidth:1,borderColor:'#355C4C',backgroundColor:'#14291F'},track:{position:'absolute',bottom:12,width:'90%',height:30,borderRadius:100,backgroundColor:'#254437'},edition:{position:'absolute',bottom:0,backgroundColor:'#233E31',borderRadius:20,paddingHorizontal:12,paddingVertical:6},editionText:{fontSize:9,letterSpacing:1.5,color:'#B4DCC6',fontWeight:'800'},title:{color:'#ECF5E5',fontWeight:'900',letterSpacing:-.8,textAlign:'center'},body:{color:'#B3CCBE',fontSize:14,lineHeight:22,textAlign:'center'},cue:{flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center',padding:13,borderWidth:1,borderColor:'#365144',borderRadius:14},dot:{width:7,height:7,borderRadius:4,backgroundColor:'#B7EFCD'},cueText:{flexShrink:1,fontSize:10,lineHeight:16,color:'#D3EFDD',fontWeight:'800',letterSpacing:.6,textAlign:'center'},footer:{fontSize:11,lineHeight:17,textAlign:'center',color:'#8DAD9D'},play:{minHeight:54,borderRadius:17,backgroundColor:'#C8EDDC',alignItems:'center',justifyContent:'center'},playText:{color:'#183D2C',fontSize:15,fontWeight:'900',letterSpacing:1},error:{color:'#FFD0B1',fontSize:12,textAlign:'center'}});
