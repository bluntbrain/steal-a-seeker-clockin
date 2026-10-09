import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,Pressable,ScrollView,useWindowDimensions} from 'react-native';
import {useSharedValue} from 'react-native-reanimated';
import GameCanvas from '../components/GameCanvas';
import {combatLevel} from '../game/combat-levels';
import {initialState,idleInput} from '../game/simulation';
import {interiorWalls,wallHeight,type WallStyle} from '../art/wall-depth';
import type {MissionId} from '../game/level';
import type {Camera} from '../camera/geometry';
const INK='#D4EBDF',MUTED='#9AB6A9';
type Pose='north'|'south'|'corner'|'lap';
export default function WallDepthLab(){
 const {width}=useWindowDimensions();const [fullRoom,setFullRoom]=useState(false);
 const size=Math.min(fullRoom?360:420,width-40),height=size*(fullRoom?20/12:1.25);
 const [style,setStyle]=useState<WallStyle>('subtle'),[pose,setPose]=useState<Pose>('lap'),[mission,setMission]=useState<MissionId>('cone-lesson');
 const [carrying,setCarrying]=useState(true),[courierZoom,setCourierZoom]=useState(false);
 const level=useMemo(()=>combatLevel(mission),[mission]);const b=useMemo(()=>interiorWalls(level.blockers).find(w=>w.y>4&&w.x>2&&w.x+w.w<9)??interiorWalls(level.blockers)[0]!,[level]);
 const game=useSharedValue(initialState(mission,level)),input=useSharedValue(idleInput()),alpha=useSharedValue(1),clock=useSharedValue(0);
 const camera=useSharedValue<Camera>({x:0,y:0,zoom:1.5});
 useEffect(()=>{
  const state=initialState(mission,level);state.guards.forEach(g=>{g.active=false;});
  // A controlled visual fixture, not a simulated run or a saved campaign result.
  const guard=state.guards.find(g=>g.combatRole!=='drone');if(guard){guard.active=!courierZoom;guard.x=guard.px=b.x+b.w+.7;guard.y=guard.py=b.y+b.h/2;guard.angle=Math.PI;}
  const drone=state.guards.find(g=>g.combatRole==='drone');if(drone){drone.active=!courierZoom;drone.x=drone.px=b.x+b.w/2;drone.y=drone.py=b.y+.15;drone.angle=Math.PI/2;}
  camera.value=fullRoom?{x:0,y:0,zoom:1}:{x:Math.max(0,Math.min(4,b.x+b.w/2-4)),y:Math.max(0,Math.min(10,b.y+b.h/2-5)),zoom:1.5};
  const corners=[{x:b.x-.45,y:b.y-.45},{x:b.x+b.w+.45,y:b.y-.45},{x:b.x+b.w+.45,y:b.y+b.h+.45},{x:b.x-.45,y:b.y+b.h+.45}];
  const positions={north:{x:b.x+b.w/2,y:b.y-.27},south:{x:b.x+b.w/2,y:b.y+b.h+.27},corner:{x:b.x-.28,y:b.y+b.h+.28}};
  let request=0,start=performance.now();
  const frame=(now:number)=>{let x:number,y:number,vx=0,vy=0,facing=0;const t=(now-start)/1000;
   if(pose==='lap'){let d=t*1.7;const lengths=corners.map((a,i)=>Math.hypot(corners[(i+1)%4]!.x-a.x,corners[(i+1)%4]!.y-a.y));d%=lengths.reduce((a,z)=>a+z,0);let i=0;while(d>lengths[i]!){d-=lengths[i]!;i++;}const a=corners[i]!,z=corners[(i+1)%4]!,f=d/lengths[i]!;x=a.x+(z.x-a.x)*f;y=a.y+(z.y-a.y)*f;vx=(z.x-a.x)/lengths[i]!*1.7;vy=(z.y-a.y)/lengths[i]!*1.7;facing=[3,0,1,2][i]!;
   }else {x=positions[pose].x;y=positions[pose].y;}
   if(courierZoom)camera.value={x:Math.max(0,Math.min(12-12/3,x-6/3)),y:Math.max(0,Math.min(20-15/3,y-7.5/3)),zoom:3};
   game.value={...state,carrying,x,y,px:x-vx/60,py:y-vy/60,vx,vy,walked:t*1.7,facing};clock.value=t;
   request=requestAnimationFrame(frame);
  };frame(start);return()=>cancelAnimationFrame(request);
 },[mission,level,pose,b,camera,clock,game,fullRoom,carrying,courierZoom]);
 const btn=(label:string,selected:boolean,press:()=>void)=><Pressable key={label} accessibilityRole="button" accessibilityState={{selected}} onPress={press} style={{paddingVertical:12,paddingHorizontal:14,borderRadius:10,borderWidth:1,borderColor:selected?'#B7EAD4':'#3E554B',backgroundColor:selected?'#BDDCCF':'#172720'}}><Text style={{color:selected?'#10241B':INK,fontWeight:'700',fontSize:13}}>{label}</Text></Pressable>;
 return <ScrollView style={{flex:1,backgroundColor:'#0D1713'}} contentContainerStyle={{alignItems:'center',padding:24,paddingBottom:40}}>
  <View style={{flexDirection:width>850?'row':'column',gap:40,alignItems:'center',maxWidth:1050}}>
   <View style={{width:width>850?400:Math.min(420,width-48),gap:18}}>
    <Text style={{color:MUTED,fontSize:11,letterSpacing:2}}>STEAL A SEEKER / ENVIRONMENT PREVIEW</Text>
    <Text style={{color:INK,fontSize:36,fontWeight:'800'}}>Brick, cargo{'\n'}and room depth.</Text>
    <Text style={{color:MUTED,lineHeight:23}}>New overhead courier, including phone-carrying runs. Right-wall shadows fall left; left-wall shadows fall right. Central shadows fall down.</Text>
    <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{(['cone-lesson','sweep-window','power-trade'] as const).map((m,i)=>btn(['Warehouse','Rooftops','Powerworks'][i]!,mission===m,()=>setMission(m)))}</View>
    <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{(['flat','subtle','strong'] as const).map(s=>btn(s==='flat'?'Flat':s==='subtle'?'Subtle depth':'Stronger depth',style===s,()=>setStyle(s)))}</View>
    <View style={{flexDirection:'row',gap:8}}>{btn('Full room',fullRoom&&!courierZoom,()=>{setFullRoom(true);setCourierZoom(false);})}{btn('Close-up',!fullRoom&&!courierZoom,()=>{setFullRoom(false);setCourierZoom(false);})}{btn('Courier zoom',courierZoom,()=>{setFullRoom(false);setCourierZoom(true);})}</View>
    <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{(['north','south','corner','lap'] as const).map(p=>btn({north:'Behind cover',south:'In front',corner:'Corner',lap:'Walk around'}[p],pose===p,()=>setPose(p)))}</View>
    <View style={{flexDirection:'row',gap:8}}>{btn('Empty-handed',!carrying,()=>setCarrying(false))}{btn('Carrying phone',carrying,()=>setCarrying(true))}</View>
    <Text style={{color:MUTED,lineHeight:21}}>This uses the actual game renderer with staged characters. Map geometry and gameplay rules are unchanged.</Text>
    <Pressable accessibilityRole="link" onPress={()=>{window.location.href=`/?build=industrial-depth&testMission=${mission}&wallDepth=${style}`;}} style={{padding:16,borderRadius:12,backgroundColor:'#BEDCCD'}}><Text style={{color:'#10241B',fontWeight:'800'}}>Play this mission ↗</Text></Pressable>
   </View>
   <View style={{gap:12,alignItems:'center'}}>
    <View style={{borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#425A4E',width:size,height}}><GameCanvas key={mission} size={size} height={height} camera={camera} input={input} game={game} alpha={alpha} clock={clock} level={level} wallStyle={style} appearance={{reducedEffects:true}}/></View>
    <Text accessibilityLiveRegion="polite" style={{color:MUTED}}>Wall height: {wallHeight(style).toFixed(2)} tiles · {pose==='lap'?'walking around cover':pose+' edge'}</Text>
   </View>
  </View>
 </ScrollView>;
}
