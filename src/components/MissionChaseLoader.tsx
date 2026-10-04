import React,{useEffect} from 'react';
import {Asset} from 'expo-asset';
import {StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useSharedValue,withRepeat,withTiming,type SharedValue} from 'react-native-reanimated';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
const sheets={courier:require('../../assets/loading-chase-v1/courier.webp'),toly:require('../../assets/loading-chase-v1/toly.webp'),mert:require('../../assets/loading-chase-v1/mert.webp'),lily:require('../../assets/loading-chase-v1/lily.webp'),chase:require('../../assets/loading-chase-v1/chase.webp'),vibhu:require('../../assets/loading-chase-v1/vibhu.webp'),akshay:require('../../assets/loading-chase-v1/akshay.webp'),beeman:require('../../assets/loading-chase-v1/beeman.webp')};
// Warm during the splash / mission map, without holding up play on decorative art.
let warmed:Promise<unknown>|undefined;
export function warmMissionChaseSprites(){return warmed??(warmed=Asset.loadAsync(Object.values(sheets)).catch(()=>undefined));}
type RunnerName=keyof typeof sheets;
const crew:{name:RunnerName;x:number;y:number;size:number;phase:number}[]=[
 {name:'chase',x:0,y:66,size:78,phase:.2},{name:'vibhu',x:57,y:65,size:78,phase:.5},{name:'akshay',x:114,y:66,size:78,phase:.8},{name:'beeman',x:171,y:65,size:78,phase:.1},
 {name:'toly',x:22,y:111,size:98,phase:.7},{name:'mert',x:99,y:114,size:98,phase:.3},{name:'lily',x:173,y:113,size:98,phase:.9},{name:'courier',x:284,y:101,size:122,phase:0},
];
function Runner({runner,scale,time,reduced}:{runner:typeof crew[number];scale:number;time:SharedValue<number>;reduced:boolean}){
 const size=runner.size*scale;
 const bob=useAnimatedStyle(()=>({transform:[{translateY:reduced?0:-Math.abs(Math.sin((time.value*4+runner.phase)*Math.PI*2))*3*scale}]}));
 const frame=useAnimatedStyle(()=>({transform:[{translateX:-(reduced?0:Math.floor(time.value*16+runner.phase*4)%4)*size}]}));
 return <Animated.View pointerEvents="none" style={[{position:'absolute',left:runner.x*scale,top:runner.y*scale,width:size,height:size,overflow:'hidden'},bob]}><Animated.Image accessible={false} source={sheets[runner.name]} resizeMode="stretch" style={[{width:size*4,height:size},frame]}/></Animated.View>;
}
/** Presentation only. No timers gate simulation readiness, no per-frame React updates. */
export default function MissionChaseLoader({number,title,boss=false,reduced=false,error='',onRetry,onExit}:{number:number;title:string;boss?:boolean;reduced?:boolean;error?:string;onRetry:()=>void;onExit:()=>void}){
 const {width,height}=useWindowDimensions(),scale=Math.min(420,width-24)/420,compact=height<650;
 const time=useSharedValue(0),still=reduced||!!error;
 useEffect(()=>{cancelAnimation(time);time.value=0;if(!still)time.value=withRepeat(withTiming(1,{duration:1600,easing:Easing.linear}),-1,false);return()=>cancelAnimation(time);},[still,time]);
 const street=useAnimatedStyle(()=>({transform:[{translateX:still?0:-time.value*84*scale}]}));
 const shimmer=useAnimatedStyle(()=>({opacity:still?.5:.45+.35*Math.sin(time.value*Math.PI*2),transform:[{translateX:still?44:time.value*160-28}]}));
 return <View testID="mission-loading" accessibilityViewIsModal style={s.screen}>
  <View style={[s.content,{gap:compact?8:18}]}>
   <Text style={s.eyebrow}>{boss?'BOSS LEVEL':'LEVEL'} {String(number).padStart(2,'0')}</Text>
   <Text accessibilityRole="header" style={s.title}>{title}</Text>
   <View accessible accessibilityLabel="The courier runs with the Seeker while Toly, Mert, Chase, Lily, Vibhu, Akshay and Beeman chase behind." style={{width:420*scale,height:242*scale,overflow:'hidden'}}>
    <View style={[s.halo,{left:248*scale,top:65*scale,width:156*scale,height:156*scale,borderRadius:78*scale}]}/>
    <View style={{position:'absolute',left:0,right:0,top:47*scale,height:108*scale,overflow:'hidden'}}>
     <Animated.View style={[{width:588*scale,height:108*scale,flexDirection:'row',alignItems:'flex-end'},street]}>{Array.from({length:7},(_,i)=><View key={i} style={{width:58*scale,height:(48+i%3*19)*scale,marginRight:26*scale,borderWidth:1,borderColor:'#26473A',backgroundColor:'#10271F',borderTopLeftRadius:5,borderTopRightRadius:5}}><View style={{height:3,width:20*scale,backgroundColor:'#315B49',margin:9*scale}}/></View>)}</Animated.View>
    </View>
    <View style={{position:'absolute',top:210*scale,left:0,right:0,height:2,backgroundColor:'#345345'}}/>
    <Animated.View style={[{position:'absolute',top:224*scale,left:-40*scale,width:600*scale,flexDirection:'row',gap:40*scale},street]}>{Array.from({length:9},(_,i)=><View key={i} style={{height:2,width:44*scale,backgroundColor:'#6DAD90',opacity:.35}}/>)}</Animated.View>
    {crew.map(r=><Runner key={r.name} runner={r} scale={scale} time={time} reduced={still}/>)}
   </View>
   <Text style={s.tagline}>{error?'Let’s try that again.':'One phone. A whole crew behind you.'}</Text>
   {!error&&<View accessibilityRole="progressbar" accessibilityLabel="Preparing mission" style={s.track}><Animated.View style={[s.shimmer,shimmer]}/></View>}
   <Text accessibilityLiveRegion="polite" style={s.status}>{error||'Preparing your escape…'}</Text>
   {!!error&&<View style={s.actions}><Pressable accessibilityRole="button" accessibilityLabel="Retry loading mission" onPress={onRetry} style={s.retry}><Text style={s.retryText}>Retry loading</Text></Pressable><Pressable accessibilityRole="button" onPress={onExit} style={s.exit}><Text style={s.exitText}>Back to missions</Text></Pressable></View>}
  </View>
 </View>;
}
const s=StyleSheet.create({screen:{...StyleSheet.absoluteFillObject,zIndex:80,backgroundColor:'#0C1812',justifyContent:'center',alignItems:'center',paddingVertical:24},content:{width:'100%',alignItems:'center'},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:3,color:'#9EBBAC'},title:{fontSize:28,lineHeight:33,fontWeight:'900',color:'#EFF8ED',textAlign:'center',paddingHorizontal:24},halo:{position:'absolute',backgroundColor:'#254837',opacity:.42},tagline:{fontSize:15,lineHeight:21,color:'#DFEFE5',fontWeight:'700',textAlign:'center',paddingHorizontal:24},track:{height:3,width:160,backgroundColor:'#233D30',borderRadius:2,overflow:'hidden'},shimmer:{width:42,height:3,backgroundColor:'#C1F5D8',borderRadius:2},status:{fontSize:12,lineHeight:18,color:'#A6C3B2',textAlign:'center',paddingHorizontal:30},actions:{alignItems:'center',gap:4},retry:{paddingVertical:13,paddingHorizontal:24,borderRadius:14,backgroundColor:'#CFE6D6'},retryText:{fontWeight:'800',color:'#15352A'},exit:{minHeight:44,justifyContent:'center',paddingHorizontal:20},exitText:{color:'#CFE6D6',fontSize:13,fontWeight:'700'}});
