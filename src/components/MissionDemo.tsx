import {TapHand} from './TutorialHand';
import React,{useEffect,useState} from 'react';
import {AppState,Image,StyleSheet,Text,View} from 'react-native';
import Animated,{cancelAnimation,Easing,runOnJS,useAnimatedReaction,useAnimatedStyle,useDerivedValue,useSharedValue,withRepeat,withSequence,withTiming} from 'react-native-reanimated';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {DEMO_COVER,DEMO_DURATION,DEMO_STEPS,demoFrame} from '../onboarding/mission-demo';
import PhoneArt from './PhoneArt';
import {ENEMY_ART_SCALE,GUARD_SPRITES} from './enemy-presentation';

/** Offline native-view demo: no second Skia/Filament surface or simulation loop. */
export default function MissionDemo({edition,reduced=false,busy=false}:{edition:number;reduced?:boolean;busy?:boolean}){
 const [width,setWidth]=useState(320),[step,setStep]=useState(0),[paused,setPaused]=useState(false),[revision,setRevision]=useState(0);
 const [foreground,setForeground]=useState(AppState.currentState==='active'||AppState.currentState==null);
 const time=useSharedValue(reduced?DEMO_STEPS[0].still:0),pose=useDerivedValue(()=>demoFrame(time.value));
 const scale=width/320;
 useEffect(()=>{const listener=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>listener.remove();},[]);
 useAnimatedReaction(()=>pose.value.step,(next,previous)=>{if(next!==previous)runOnJS(setStep)(next);});
 useEffect(()=>{
  cancelAnimation(time);
  if(reduced){time.value=DEMO_STEPS[demoFrame(time.value).step]!.still;return;}
  if(paused||busy||!foreground)return;
  // Resume the unfinished pass, then loop. Only step boundaries cross to JS.
  time.value=withSequence(
   withTiming(DEMO_DURATION,{duration:Math.max(0,(DEMO_DURATION-time.value)*1000),easing:Easing.linear}),
   withRepeat(withSequence(withTiming(0,{duration:0}),withTiming(DEMO_DURATION,{duration:DEMO_DURATION*1000,easing:Easing.linear})),-1,false));
  return()=>cancelAnimation(time);
 },[time,paused,busy,foreground,reduced,revision]);
 const courier=useAnimatedStyle(()=>({opacity:pose.value.extracted?.25:1,transform:[{translateX:pose.value.x-21},{translateY:pose.value.y-57}]}));
 const sprite=useAnimatedStyle(()=>({transform:[{translateX:-(pose.value.frame%4)*42},{translateY:-Math.floor(pose.value.frame/4)*63}]}));
 const guard=useAnimatedStyle(()=>({opacity:1-pose.value.defeat,transform:[{rotate:`${pose.value.defeat*80}deg`},{scale:ENEMY_ART_SCALE.guard*(1-pose.value.defeat*.6)}]}));
 const health=useAnimatedStyle(()=>({width:36*pose.value.hp}));
 const impact=useAnimatedStyle(()=>({opacity:pose.value.dead?1-pose.value.defeat:0,transform:[{scale:.4+pose.value.defeat*1.3}]}));
 const shot=useAnimatedStyle(()=>({opacity:pose.value.slash>=0?1:0,transform:[{translateX:225},{rotate:`${-.7+Math.max(0,pose.value.slash)*1.8}rad`}]}));
 const phone=useAnimatedStyle(()=>({opacity:pose.value.phoneVisible?1:0}));
 const carried=useAnimatedStyle(()=>({opacity:pose.value.carried?1:0}));
 const success=useAnimatedStyle(()=>({opacity:pose.value.extracted?1:0}));
 const finger=useAnimatedStyle(()=>({opacity:reduced?1:pose.value.tap,transform:[{translateX:pose.value.tapX},{translateY:pose.value.tapY},{scale:reduced?1:1-pose.value.ring*.12}]}));
 const ring=useAnimatedStyle(()=>({opacity:reduced?.6:pose.value.tap*(1-pose.value.ring),transform:[{translateX:pose.value.tapX-22},{translateY:pose.value.tapY-22},{scale:reduced?1:.7+pose.value.ring}]}));
 const movePath=useAnimatedStyle(()=>({opacity:pose.value.step===0?.75:0}));
 const aimPath=useAnimatedStyle(()=>({opacity:pose.value.step===1&&!pose.value.dead?.75:0}));
 const pickupPath=useAnimatedStyle(()=>({opacity:pose.value.step===2&&pose.value.phoneVisible?.75:0}));
 const exitPath=useAnimatedStyle(()=>({opacity:pose.value.carried?.75:0}));
 const selectStep=(index:number)=>{cancelAnimation(time);time.value=reduced?DEMO_STEPS[index]!.still:DEMO_STEPS[index]!.start;setStep(index);setPaused(false);setRevision(n=>n+1);};
 return <View style={s.demo}>
  <View testID="mission-demo-stage" onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={[s.stage,{height:width*300/320}]}>
   <View pointerEvents="none" accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',width:320,height:300,left:(width-320)/2,top:(width*300/320-300)/2,transform:[{scale}]}}>
    <Image source={require('../../assets/world-v3/floor.png')} resizeMode="cover" style={s.floor}/><View style={[s.floor,{backgroundColor:'rgba(5,15,15,.28)'}]}/>
    {DEMO_COVER.map((r,i)=><View key={i} style={[s.cover,{left:r.x,top:r.y,width:r.width,height:r.height}]}><Image source={require('../../assets/walls-v5/warehouse-cap.jpg')} resizeMode="stretch" style={s.floor}/></View>)}
    <Animated.View style={[s.floor,movePath]}><View style={{position:'absolute',left:48,top:133,height:105,borderLeftWidth:2,borderColor:'#AEF1D5',borderStyle:'dashed'}}/><View style={{position:'absolute',left:48,top:132,width:84,borderTopWidth:2,borderColor:'#AEF1D5',borderStyle:'dashed'}}/></Animated.View>

    <Animated.View style={[s.escapePath,{left:119.7,top:172,width:142.5,transform:[{rotate:'34.14deg'}]},pickupPath]}/>
    <Animated.View style={[s.escapePath,{left:231.7,top:239.5,width:59.6,transform:[{rotate:'67.3deg'}]},exitPath]}/>
    <View style={s.exit}><Text style={s.exitText}>EXIT</Text><Text style={s.chevron}>⌄</Text></View>
    <Animated.View style={[s.pickup,phone]}><View style={s.phoneGlow}/><PhoneArt index={edition} height={38}/></Animated.View>
    <Animated.View style={[s.guard,guard]}><Image source={GUARD_SPRITES.guard} resizeMode="contain" style={{position:'absolute',left:-8,top:-8,width:60,height:60,transform:[{rotate:'180deg'}]}}/><View style={s.healthTrack}><Animated.View style={[s.health,health]}/></View></Animated.View>
    <Animated.View style={[s.impact,impact]}><Text style={s.impactText}>✦</Text></Animated.View><Animated.Image source={require('../../assets/weapons/knife-v1/knife.png')} resizeMode="contain" style={[{position:'absolute',top:123,width:32,height:11},shot]}/>
    <Animated.View testID="demo-courier" style={[s.courier,courier]}><View style={s.shadow}/><View style={s.spriteCrop}><Animated.Image source={require('../../assets/costumes-v4/default-atlas.png')} resizeMode="stretch" style={[s.sprite,sprite]}/></View><Animated.View style={[s.carried,carried]}><PhoneArt index={edition} height={22}/></Animated.View></Animated.View>
    <Animated.View style={[s.ring,ring]}/><Animated.View style={[{position:'absolute',left:0,top:0,width:0,height:0},finger]}><TapHand size={54} flipX={step>0} flipY={step===2}/><View style={s.tapLabel}><Text style={s.tapText}>TAP</Text></View></Animated.View>
    <Animated.View style={[s.success,success]}><Text style={s.successText}>SEEKER SECURED ✓</Text></Animated.View>
   </View>
   <View style={s.overlay}><View style={s.demoPill}><View style={s.liveDot}/><Text style={s.demoLabel}>{reduced?'STEP BY STEP':paused?'DEMO PAUSED':'WATCH DEMO'}</Text></View>{!reduced&&<Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={paused?'Resume movement demo':'Pause movement demo'} onPress={()=>setPaused(p=>!p)} style={s.pause}><Text style={s.pauseText}>{paused?'▶':'Ⅱ'}</Text></Pressable>}</View>
  </View>
  <View accessibilityRole="tablist" style={s.tabs}>{DEMO_STEPS.map((item,index)=><Pressable key={item.label} disabled={busy} accessibilityRole="tab" accessibilityState={{selected:step===index}} accessibilityLabel={`Show ${item.label.toLowerCase()} demo`} onPress={()=>selectStep(index)} style={[s.tab,step===index&&s.selected]}><Text style={[s.tabText,step===index&&s.selectedText]}>{index+1}  {item.label}</Text></Pressable>)}</View>
  <Text testID="mission-demo-caption" accessibilityLiveRegion="polite" style={s.caption}>{DEMO_STEPS[step]!.caption}</Text>
 </View>;
}
const s=StyleSheet.create({
 demo:{gap:12},stage:{overflow:'hidden',borderRadius:20,borderWidth:1,borderColor:'#34574B',backgroundColor:'#14211F'},floor:{position:'absolute',width:'100%',height:'100%'},
 cover:{position:'absolute',borderWidth:3,borderColor:'#29383B',borderRadius:5,overflow:'hidden',boxShadow:'3px 5px 0 rgba(0,0,0,.5)'},
 overlay:{position:'absolute',left:12,right:8,top:8,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},demoPill:{backgroundColor:'#10241F',paddingHorizontal:10,paddingVertical:7,borderRadius:20,flexDirection:'row',alignItems:'center',gap:6},liveDot:{width:5,height:5,borderRadius:3,backgroundColor:'#B9F3D7'},demoLabel:{fontSize:9,fontWeight:'800',letterSpacing:1,color:'#D2EDDF'},pause:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:'#78978C',backgroundColor:'#10211EEB',alignItems:'center',justifyContent:'center'},pauseText:{color:'#E4F4EB',fontSize:18,fontWeight:'900'},
 courier:{position:'absolute',width:42,height:63},spriteCrop:{width:42,height:63,overflow:'hidden'},sprite:{position:'absolute',width:168,height:126},shadow:{position:'absolute',left:0,bottom:0,width:42,height:12,borderRadius:21,backgroundColor:'#02090880'},carried:{position:'absolute',right:-7,bottom:11},
 guard:{position:'absolute',left:231,top:109,width:44,height:44},healthTrack:{position:'absolute',top:-8,left:4,width:36,height:3,backgroundColor:'#183128'},health:{height:3,backgroundColor:'#BBECD7'},
 aim:{position:'absolute',left:153,top:131,width:84,borderTopWidth:1,borderStyle:'dashed',borderColor:'#D5B578'},slash:{position:'absolute',left:0,top:129,width:10,height:3,borderRadius:2,backgroundColor:'#FFF0BC',boxShadow:'0 0 7px #FFD579'},impact:{position:'absolute',left:226,top:99,width:55,height:55,alignItems:'center',justifyContent:'center'},impactText:{fontSize:53,color:'#DFF9DB'},
 pickup:{position:'absolute',left:239,top:184},phoneGlow:{position:'absolute',width:42,height:42,left:-9,top:0,borderRadius:21,backgroundColor:'#76C5AA2A',borderWidth:1,borderColor:'#9FD9C3'},exit:{position:'absolute',left:245,top:243,width:56,height:49,borderRadius:7,borderWidth:2,borderColor:'#9FDDC4',backgroundColor:'#205345'},exitText:{fontSize:10,fontWeight:'900',color:'#CFF7E5',textAlign:'center',marginTop:4,letterSpacing:1},chevron:{fontSize:24,lineHeight:24,fontWeight:'900',color:'#CFF7E5',textAlign:'center'},escapePath:{position:'absolute',left:187,top:181,width:91,borderTopWidth:2,borderStyle:'dashed',borderColor:'#AEF1D5',transform:[{rotate:'48deg'}]},
 ring:{position:'absolute',left:0,top:0,width:44,height:44,borderRadius:22,borderWidth:2,borderColor:'#C9FFE7',backgroundColor:'#BAEBD526'},tapLabel:{position:'absolute',left:20,top:-14,borderRadius:4,paddingHorizontal:5,paddingVertical:3,backgroundColor:'#C4F2DD'},tapText:{fontSize:9,fontWeight:'900',color:'#10291E'},
 success:{position:'absolute',top:80,left:69,right:25,padding:12,borderRadius:12,backgroundColor:'#173C30',borderWidth:1,borderColor:'#BCEDD7'},successText:{color:'#D1F8E4',fontSize:12,fontWeight:'900',textAlign:'center'},tabs:{flexDirection:'row',gap:7},tab:{flex:1,minHeight:44,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#3B5C50',borderRadius:24,paddingHorizontal:4,paddingVertical:8},selected:{backgroundColor:'#C1EFDA',borderColor:'#C1EFDA'},tabText:{color:'#BED7CB',fontSize:12,fontWeight:'700'},selectedText:{color:'#122D22'},caption:{color:'#C3D8CC',fontSize:13,lineHeight:19,textAlign:'center',minHeight:38}
});
