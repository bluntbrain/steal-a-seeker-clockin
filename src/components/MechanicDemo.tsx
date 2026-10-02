import DemoCourierSprite from './DemoCourierSprite';
import {TapHand} from './TutorialHand';
import React,{useEffect,useState} from 'react';
import {AppState,Image,StyleSheet,Text,View} from 'react-native';
import Animated,{cancelAnimation,Easing,runOnJS,useAnimatedReaction,useAnimatedStyle,useDerivedValue,useSharedValue,withRepeat,withSequence,withTiming,type SharedValue} from 'react-native-reanimated';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {MECHANIC_COVER,MECHANIC_DURATION,MECHANIC_STEPS,mechanicFrame,type Mechanic,type MechanicFrame,type DemoPoint} from '../onboarding/mechanic-demo';
import PhoneArt from './PhoneArt';
import {ENEMY_ART_SCALE,GUARD_SPRITES} from './enemy-presentation';

type Film=SharedValue<MechanicFrame>;
function Route({points,color='#AEEBCF'}:{points:DemoPoint[];color?:string}){return <>{points.slice(1).map((b,i)=>{const a=points[i]!,d=Math.hypot(b.x-a.x,b.y-a.y);return <View key={i} style={{position:'absolute',left:(a.x+b.x-d)/2,top:(a.y+b.y)/2,width:d,borderTopWidth:2,borderStyle:'dashed',borderColor:color,transform:[{rotate:`${Math.atan2(b.y-a.y,b.x-a.x)}rad`}]}}/>;})}</>;}
function Enemy({film,time,index,kind,reduced}:{film:Film;time:SharedValue<number>;index:number;kind:'guard'|'drone'|'heavy';reduced:boolean}){
 const artScale=ENEMY_ART_SCALE[kind];
 const placement=useAnimatedStyle(()=>{const a=film.value.actors[index];return {opacity:a?.visible?1:0,transform:[{translateX:(a?.x??0)-24},{translateY:(a?.y??0)-24},{scale:artScale}]};});
 const health=useAnimatedStyle(()=>({width:40*(film.value.actors[index]?.hp??0)}));
 const droneFacing=useAnimatedStyle(()=>{const d=film.value.actors[index];return {transform:[{rotate:`${d?Math.atan2(film.value.y-d.y,film.value.x-d.x):0}rad`},{scale:reduced?1:1+Math.sin(time.value*3)*.018}]};});
 return <Animated.View testID={`lesson-enemy-${index}`} style={[s.enemy,placement]}>
  {kind==='drone'?<Animated.Image source={require('../../assets/drones-v2/scout.png')} resizeMode="contain" style={[{position:'absolute',left:-5,top:-5,width:58,height:58},droneFacing]}/>:<Image source={GUARD_SPRITES[kind]} resizeMode="contain" style={{position:'absolute',left:-6,top:-6,width:60,height:60,transform:[{rotate:'180deg'}]}}/>}
  <View style={s.healthTrack}><Animated.View style={[s.health,health]}/></View>
 </Animated.View>;
}
function ChargeMark({film,index,actor}:{film:Film;index:number;actor:number}){
 const a=index*Math.PI/8-Math.PI/2;
 const radius=34*ENEMY_ART_SCALE.drone;
 const style=useAnimatedStyle(()=>{const d=film.value.actors[actor];return {opacity:d?.visible&&film.value.charge>0?(film.value.charge>=index/16?1:.16):0,transform:[{translateX:(d?.x??0)+Math.cos(a)*radius-3},{translateY:(d?.y??0)+Math.sin(a)*radius-3}]};});
 return <Animated.View style={[s.chargeMark,style]}/>;
}
function RadioWave({film,time,index,actor,reduced}:{film:Film;time:SharedValue<number>;index:number;actor:number;reduced:boolean}){
 const style=useAnimatedStyle(()=>{const p=reduced?.4:(time.value*.65+index/3)%1,d=film.value.actors[actor];return {opacity:film.value.radio?(1-p)*.65:0,transform:[{translateX:(d?.x??100)-70},{translateY:(d?.y??170)-70},{scale:.5+p*1.2}]};});
 return <Animated.View style={[s.wave,style]}/>;
}
function ScanCone({film}:{film:Film}){
 const style=useAnimatedStyle(()=>{const d=film.value.actors[0]!;return {opacity:d.visible?.18:0,transform:[{translateX:d.x},{translateY:d.y},{rotate:`${Math.atan2(film.value.y-d.y,film.value.x-d.x)}rad`}]};});
 return <Animated.View style={[s.origin,style]}>{Array.from({length:10},(_,i)=><View key={i} style={{position:'absolute',left:i*12,top:-(6+i*6)/2,width:13,height:6+i*6,backgroundColor:'#E7C46D'}}/>)}</Animated.View>;
}

/** Slowed diagrams of mechanics, not live simulation. Identical lifecycle to the controls demo. */
export default function MechanicDemo({kind,edition,reduced=false,busy=false}:{kind:Mechanic;edition:number;reduced?:boolean;busy?:boolean}){
 const steps=MECHANIC_STEPS[kind];
 const [width,setWidth]=useState(320),[step,setStep]=useState(0),[paused,setPaused]=useState(false),[revision,setRevision]=useState(0),[foreground,setForeground]=useState(AppState.currentState==='active'||AppState.currentState==null);
 const time=useSharedValue(reduced?2.8:0),film=useDerivedValue(()=>mechanicFrame(kind,time.value));
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>sub.remove();},[]);
 useAnimatedReaction(()=>film.value.step,(next,previous)=>{if(next!==previous)runOnJS(setStep)(next);});
 useEffect(()=>{cancelAnimation(time);if(reduced){time.value=mechanicFrame(kind,time.value).step*5+2.8;return;}if(paused||busy||!foreground)return;
  time.value=withSequence(withTiming(MECHANIC_DURATION,{duration:Math.max(0,(MECHANIC_DURATION-time.value)*1000),easing:Easing.linear}),withRepeat(withSequence(withTiming(0,{duration:0}),withTiming(MECHANIC_DURATION,{duration:15000,easing:Easing.linear})),-1,false));return()=>cancelAnimation(time);
 },[time,kind,reduced,paused,busy,foreground,revision]);
 const courier=useAnimatedStyle(()=>({opacity:film.value.extracted?.25:1,transform:[{translateX:film.value.x-21},{translateY:film.value.y-57}]}));
 const spriteFrame=useDerivedValue(()=>film.value.slash<0?film.value.frame:8+film.value.face+(film.value.slash<.4?0:film.value.slash<.7?4:8));
 const shot=useAnimatedStyle(()=>({opacity:film.value.shot.visible&&film.value.shot.enemy?1:0,transform:[{translateX:film.value.shot.x},{translateY:film.value.shot.y},{rotate:`${film.value.shot.angle}rad`}]}));
 const phone=useAnimatedStyle(()=>({opacity:film.value.phoneVisible?1:0,transform:[{translateX:film.value.phone.x-11},{translateY:film.value.phone.y-24}]}));
 const second=useAnimatedStyle(()=>({opacity:film.value.secondVisible?1:0,transform:[{translateX:film.value.secondPhone.x-11},{translateY:film.value.secondPhone.y-24}]}));
 const carried=useAnimatedStyle(()=>({opacity:film.value.carried?1:0}));
 const exit=useAnimatedStyle(()=>({opacity:film.value.exitVisible?1:0,borderColor:film.value.exitOpen?'#AEEAD0':'#E6BA70',backgroundColor:film.value.exitOpen?'#285947':'#614E2B',transform:[{translateX:film.value.exit.x-24},{translateY:film.value.exit.y-20}]}));
 const gate=useAnimatedStyle(()=>({opacity:film.value.gateOpen?.18:1,backgroundColor:film.value.gateOpen?'#BDEFD1':'#E1B16B'}));
 const switchLight=useAnimatedStyle(()=>({backgroundColor:film.value.gateOpen?'#BDEFD1':'#E1B16B'}));
 const noise=useAnimatedStyle(()=>({opacity:film.value.noise?.7:0,transform:[{scale:reduced?1:1+(time.value%1)*.4}]}));
 const entry=useAnimatedStyle(()=>({opacity:film.value.entry?1:0}));
 const secondEntry=useAnimatedStyle(()=>({opacity:film.value.secondEntry?1:0}));
 const stopped=useAnimatedStyle(()=>({opacity:film.value.stopped?1:0}));
 const success=useAnimatedStyle(()=>({opacity:film.value.extracted?1:0}));
 const firstDelivered=useAnimatedStyle(()=>({opacity:film.value.delivered===1?1:0}));
 const bothDelivered=useAnimatedStyle(()=>({opacity:film.value.delivered===2?1:0}));
 const tap=useAnimatedStyle(()=>({opacity:film.value.tapVisible?1:0,transform:[{translateX:film.value.tap.x-15},{translateY:film.value.tap.y-15}]}));
 const rewind=useAnimatedStyle(()=>({opacity:(kind==='drone'||kind==='switch')&&time.value>=10&&time.value<10.9?1:0}));
 const laserGlow=useAnimatedStyle(()=>({backgroundColor:film.value.laserAlarm?'#FF564F':'#FAAD58',opacity:film.value.laserAlarm?1:.65}));
 const laserNotice=useAnimatedStyle(()=>({opacity:film.value.laserAlarm?1:0}));
 const actor=kind==='finale'?1:0;
 const select=(i:number)=>{cancelAnimation(time);time.value=i*5+(reduced?2.8:0);setStep(i);setPaused(false);setRevision(n=>n+1);};
 return <View style={s.demo}>
  <View testID="mechanic-demo-stage" accessibilityLabel={`${kind} illustrated lesson`} onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={[s.stage,{height:width*300/320}]}>
   <View pointerEvents="none" aria-hidden accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',width:320,height:300,left:(width-320)/2,top:(width*300/320-300)/2,transform:[{scale:width/320}]}}>
    <Image source={require('../../assets/world-v3/floor.png')} resizeMode="cover" style={s.floor}/><View style={[s.floor,{backgroundColor:'#05100F30'}]}/>
    {kind==='laser'&&<><Animated.View style={[{position:'absolute',left:65,top:178,width:70,height:4,boxShadow:'0 0 9px #FFAD58'},laserGlow]}/>{[60,132].map(x=><View key={x} style={{position:'absolute',left:x,top:172,width:8,height:16,borderRadius:3,backgroundColor:'#7D9691'}}/>)}<Animated.View style={[s.notice,{left:75,top:55,backgroundColor:'#512722',borderColor:'#FF8270'},laserNotice]}><Text style={s.noticeText}>ALARM · CROSSING REPORTED</Text></Animated.View></>}
    {kind==='routes'&&<><Route points={[{x:60,y:260},{x:220,y:260},{x:220,y:95},{x:255,y:95}]} color="#E3B677"/><Route points={[{x:60,y:260},{x:35,y:260},{x:35,y:75},{x:255,y:75},{x:255,y:95}]}/><Text style={[s.mapLabel,{left:38,top:58}]}>COVERED ROUTE</Text><Text style={[s.mapLabel,{left:201,top:232,color:'#E6C38B'}]}>SHORT</Text></>}
    {kind==='switch'&&<><Route points={[{x:70,y:220},{x:70,y:130},{x:180,y:130},{x:210,y:155}]} color="#B9A778"/><View style={s.grate}>{[0,1,2,3,4].map(i=><View key={i} style={{position:'absolute',left:5+i*9,width:3,height:23,backgroundColor:'#D8C093',transform:[{rotate:'20deg'}]}}/>)}</View><Animated.View style={[s.noise,noise]}/><Animated.View style={[s.gate,gate]}/><Animated.View style={[s.switch,switchLight]}><Text style={s.switchText}>ϟ</Text></Animated.View></>}
    {kind==='pursuit'&&step>0&&<View style={s.lastSeen}><Text style={s.mapLabel}>LAST SEEN</Text><Text style={{color:'#E5BE82',textAlign:'center'}}>⌖</Text></View>}
    {kind==='drone'&&<ScanCone film={film}/>}
    {MECHANIC_COVER[kind].map((r,i)=><View key={i} style={[s.cover,{left:r.x,top:r.y,width:r.width,height:r.height}]}><Image source={require('../../assets/walls-v5/warehouse-cap.jpg')} resizeMode="stretch" style={s.floor}/></View>)}
    <Animated.View style={[s.exit,exit]}><Text style={s.exitText}>EXIT</Text><Text style={s.exitText}>⌄</Text></Animated.View>
    <Animated.View style={[s.origin,phone]}><PhoneArt index={edition} height={35}/></Animated.View><Animated.View style={[s.origin,second]}><PhoneArt index={Math.min(11,edition+1)} height={35}/></Animated.View>
    <Animated.View style={[s.entry,{left:kind==='finale'?22:259,top:kind==='finale'?54:60},entry]}><Text style={s.entryText}>SECURITY</Text><Text style={s.entryArrow}>↓</Text></Animated.View>
    <Animated.View style={[s.entry,{left:258,top:215},secondEntry]}><Text style={s.entryText}>SECURITY</Text><Text style={s.entryArrow}>↑</Text></Animated.View>
    {[0,1,2,3].map(i=><Enemy key={i} film={film} time={time} index={i} reduced={reduced} kind={i===0?(kind==='drone'?'drone':kind==='armor'||kind==='finale'?'heavy':'guard'):i===1&&kind==='finale'?'drone':'guard'}/>)}
    {(kind==='drone'||kind==='finale')&&Array.from({length:16},(_,i)=><ChargeMark key={i} film={film} index={i} actor={actor}/>)}
    {(kind==='drone'||kind==='pursuit')&&[0,1,2].map(i=><RadioWave key={i} film={film} time={time} index={i} actor={0} reduced={reduced}/>)}
    <Animated.View testID="mechanic-courier" style={[s.courier,courier]}><View style={s.shadow}/><DemoCourierSprite frame={spriteFrame}/><Animated.View style={[s.carried,carried]}><PhoneArt index={edition} height={20}/></Animated.View></Animated.View>
    <Animated.View style={[s.bullet,shot]}/><Animated.View style={[s.tap,tap]}><View style={{position:'absolute',left:15,top:15}}><TapHand size={50} flipX/></View><Text style={s.tapText}>TAP</Text></Animated.View>
    <Animated.View style={[{position:'absolute',left:20,right:20,top:110,padding:14,borderRadius:12,backgroundColor:'#081B16F5',borderWidth:1,borderColor:'#96C8B1',alignItems:'center'},rewind]}><Text style={{fontSize:12,fontWeight:'900',color:'#D9F7E7'}}>↶  TRY THIS INSTEAD</Text><Text style={{fontSize:10,color:'#B9D5C8',marginTop:5}}>{kind==='drone'?'Back to before the report':'Back to before the noisy grate'}</Text></Animated.View>
    <Animated.View style={[s.notice,{top:210,left:160},stopped]}><Text style={s.noticeText}>REPORT STOPPED ✓</Text></Animated.View>
    <Animated.View style={[s.notice,{top:64,left:80},success]}><Text style={s.noticeText}>EXTRACTED ✓</Text></Animated.View>
    {kind==='relay'&&<><Animated.View style={[s.notice,{left:100,top:62},firstDelivered]}><Text style={s.noticeText}>1 / 2 EXTRACTED</Text></Animated.View><Animated.View style={[s.notice,{left:100,top:62},bothDelivered]}><Text style={s.noticeText}>2 / 2 EXTRACTED ✓</Text></Animated.View></>}
   </View>
   <View style={s.overlay}><View style={s.pill}><Text style={s.pillText}>{reduced?'STEP BY STEP':paused?'DEMO PAUSED':'WATCH DEMO'}</Text></View>{!reduced&&<Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={paused?'Resume mission demo':'Pause mission demo'} onPress={()=>setPaused(v=>!v)} style={s.pause}><Text style={s.pauseText}>{paused?'▶':'Ⅱ'}</Text></Pressable>}</View>
   <View style={s.sceneBadge}><Text style={s.sceneBadgeText}>{steps[step]!.badge}</Text></View>
  </View>
  <View accessibilityRole="tablist" style={s.tabs}>{steps.map((item,i)=><Pressable key={item.label} accessibilityRole="tab" accessibilityLabel={`Show ${item.label.toLowerCase()} lesson`} accessibilityState={{selected:step===i}} disabled={busy} onPress={()=>select(i)} style={[s.tab,step===i&&s.selected]}><Text style={[s.tabText,step===i&&s.selectedText]}>{i+1} {item.label}</Text></Pressable>)}</View>
  <Text testID="mechanic-demo-caption" accessibilityLiveRegion="polite" style={s.caption}>{steps[step]!.caption}</Text>
  <Text style={s.slowed}>Demonstration slowed to show each step.</Text>
 </View>;
}
const s=StyleSheet.create({demo:{gap:10},stage:{overflow:'hidden',borderRadius:20,borderWidth:1,borderColor:'#34574B',backgroundColor:'#14211F'},floor:{position:'absolute',width:'100%',height:'100%'},origin:{position:'absolute',left:0,top:0},cover:{position:'absolute',borderWidth:3,borderColor:'#29383B',borderRadius:5,overflow:'hidden',boxShadow:'3px 5px 0 #0008'},overlay:{position:'absolute',left:10,right:8,top:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},pill:{backgroundColor:'#10241F',paddingHorizontal:9,paddingVertical:7,borderRadius:20},pillText:{fontSize:9,fontWeight:'800',letterSpacing:1,color:'#D2EDDF'},pause:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:'#78978C',backgroundColor:'#10211EEB',alignItems:'center',justifyContent:'center'},pauseText:{color:'#E4F4EB',fontSize:18,fontWeight:'900'},sceneBadge:{position:'absolute',bottom:6,left:8,right:8,alignItems:'center',pointerEvents:'none'},sceneBadgeText:{fontSize:8,fontWeight:'800',letterSpacing:.5,color:'#E4F5E9',backgroundColor:'#0B1B16EE',paddingVertical:4,paddingHorizontal:8,borderRadius:8},
 courier:{position:'absolute',width:42,height:63},crop:{width:42,height:63,overflow:'hidden'},sprite:{position:'absolute',width:168,height:126},shadow:{position:'absolute',left:0,bottom:0,width:42,height:12,borderRadius:21,backgroundColor:'#02090880'},carried:{position:'absolute',right:-7,bottom:10},enemy:{position:'absolute',width:48,height:48},healthTrack:{position:'absolute',top:-7,left:4,width:40,height:3,backgroundColor:'#142C21'},health:{height:3,backgroundColor:'#BAF0D5'},chargeMark:{position:'absolute',width:5,height:5,borderRadius:3,backgroundColor:'#F0C16C'},wave:{position:'absolute',width:140,height:140,borderRadius:70,borderWidth:2,borderColor:'#F6B879'},bullet:{position:'absolute',width:10,height:3,borderRadius:2,backgroundColor:'#FFF0BC',boxShadow:'0 0 6px #E9C270'},exit:{position:'absolute',width:48,height:40,borderWidth:2,borderRadius:7,alignItems:'center',justifyContent:'center'},exitText:{color:'#DCF6E7',fontSize:10,lineHeight:14,fontWeight:'900'},gate:{position:'absolute',left:206,top:110,width:12,height:112,borderWidth:2,borderColor:'#8BA89A'},switch:{position:'absolute',left:57,top:207,width:26,height:26,borderRadius:7,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#789889'},switchText:{fontSize:20,fontWeight:'900',color:'#142C24'},grate:{position:'absolute',left:133,top:181,width:54,height:23,backgroundColor:'#514933',overflow:'hidden'},noise:{position:'absolute',left:121,top:155,width:78,height:78,borderRadius:39,borderWidth:2,borderColor:'#E8C878'},entry:{position:'absolute',width:44,height:44,backgroundColor:'#402D21BB',borderColor:'#E2B478',borderWidth:1,borderRadius:5,alignItems:'center'},entryText:{fontSize:6,color:'#F2D2A1',fontWeight:'900',marginTop:3},entryArrow:{color:'#F2D2A1',fontSize:23,lineHeight:25},notice:{position:'absolute',padding:7,borderRadius:8,backgroundColor:'#173B2FEB',borderWidth:1,borderColor:'#94C7AF'},noticeText:{fontSize:8,fontWeight:'800',color:'#D6F4E4'},mapLabel:{position:'absolute',fontSize:7,fontWeight:'800',color:'#C2DEC9'},lastSeen:{position:'absolute',left:74,top:155,width:53,height:38},tap:{position:'absolute',width:30,height:30,borderRadius:15,borderWidth:2,borderColor:'#D9FFE8'},tapText:{position:'absolute',left:31,top:-4,fontSize:8,fontWeight:'900',color:'#153829',backgroundColor:'#C5F2D9',padding:3,borderRadius:3},tabs:{flexDirection:'row',gap:6},tab:{flex:1,minHeight:44,paddingVertical:8,paddingHorizontal:3,borderRadius:22,borderWidth:1,borderColor:'#3B5C50',justifyContent:'center',alignItems:'center'},selected:{backgroundColor:'#C1EFDA',borderColor:'#C1EFDA'},tabText:{fontSize:11,fontWeight:'700',color:'#BED7CB',textAlign:'center'},selectedText:{color:'#122D22'},caption:{fontSize:13,lineHeight:19,textAlign:'center',color:'#C3D8CC',minHeight:57},slowed:{fontSize:10,lineHeight:14,textAlign:'center',color:'#819F8F'}});
