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
 const {width}=useWindowDimensions();const size=Math.min(420,width-40),height=size*1.25;
 const [style,setStyle]=useState<WallStyle>('subtle'),[pose,setPose]=useState<Pose>('south'),[mission,setMission]=useState<MissionId>('cone-lesson');
 const level=useMemo(()=>combatLevel(mission),[mission]);const b=useMemo(()=>interiorWalls(level.blockers).find(w=>w.y>4&&w.x>2&&w.x+w.w<9)??interiorWalls(level.blockers)[0]!,[level]);
 const game=useSharedValue(initialState(mission,level)),input=useSharedValue(idleInput()),alpha=useSharedValue(1),clock=useSharedValue(0);
 const camera=useSharedValue<Camera>({x:0,y:0,zoom:1.5});
 useEffect(()=>{
  const state=initialState(mission,level);state.guards.forEach(g=>{g.active=false;});
  // A controlled visual fixture, not a simulated run or a saved campaign result.
  const guard=state.guards.find(g=>g.combatRole!=='drone');if(guard){guard.active=true;guard.x=guard.px=b.x+b.w+.7;guard.y=guard.py=b.y+b.h/2;guard.angle=Math.PI;}
  const drone=state.guards.find(g=>g.combatRole==='drone');if(drone){drone.active=true;drone.x=drone.px=b.x+b.w/2;drone.y=drone.py=b.y+.15;drone.angle=Math.PI/2;}
  camera.value={x:Math.max(0,Math.min(4,b.x+b.w/2-4)),y:Math.max(0,Math.min(10,b.y+b.h/2-5)),zoom:1.5};
  const corners=[{x:b.x-.45,y:b.y-.45},{x:b.x+b.w+.45,y:b.y-.45},{x:b.x+b.w+.45,y:b.y+b.h+.45},{x:b.x-.45,y:b.y+b.h+.45}];
  const positions={north:{x:b.x+b.w/2,y:b.y-.27},south:{x:b.x+b.w/2,y:b.y+b.h+.27},corner:{x:b.x-.28,y:b.y+b.h+.28}};
  let request=0,start=performance.now();
  const frame=(now:number)=>{let x:number,y:number,vx=0,vy=0,facing=0;const t=(now-start)/1000;
   if(pose==='lap'){let d=t*1.7;const lengths=corners.map((a,i)=>Math.hypot(corners[(i+1)%4]!.x-a.x,corners[(i+1)%4]!.y-a.y));d%=lengths.reduce((a,z)=>a+z,0);let i=0;while(d>lengths[i]!){d-=lengths[i]!;i++;}const a=corners[i]!,z=corners[(i+1)%4]!,f=d/lengths[i]!;x=a.x+(z.x-a.x)*f;y=a.y+(z.y-a.y)*f;vx=(z.x-a.x)/lengths[i]!*1.7;vy=(z.y-a.y)/lengths[i]!*1.7;facing=[3,0,1,2][i]!;
   }else {x=positions[pose].x;y=positions[pose].y;}
   game.value={...state,x,y,px:x,py:y,vx,vy,walked:t*1.7,facing};clock.value=t;
   request=requestAnimationFrame(frame);
  };frame(start);return()=>cancelAnimationFrame(request);
 },[mission,level,pose,b,camera,clock,game]);
 const btn=(label:string,selected:boolean,press:()=>void)=><Pressable key={label} accessibilityRole="button" accessibilityState={{selected}} onPress={press} style={{paddingVertical:12,paddingHorizontal:14,borderRadius:10,borderWidth:1,borderColor:selected?'#B7EAD4':'#3E554B',backgroundColor:selected?'#BDDCCF':'#172720'}}><Text style={{color:selected?'#10241B':INK,fontWeight:'700',fontSize:13}}>{label}</Text></Pressable>;
 return <ScrollView style={{flex:1,backgroundColor:'#0D1713'}} contentContainerStyle={{alignItems:'center',padding:20,gap:14,paddingBottom:60}}>
  <Text style={{color:MUTED,fontSize:11,letterSpacing:2}}>STEAL A SEEKER / WALL DEPTH STUDY</Text>
  <Text style={{color:INK,fontSize:30,fontWeight:'800',textAlign:'center'}}>Same encounter. More depth.</Text>
  <Text style={{color:MUTED,maxWidth:620,textAlign:'center',lineHeight:21}}>Compare the actual game renderer. These staged poses let you inspect corners and overlap without guards ending the run.</Text>
  <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',justifyContent:'center'}}>{(['flat','subtle','strong'] as const).map(s=>btn(s==='flat'?'A · Current':s==='subtle'?'B · Subtle':'C · Stronger',style===s,()=>setStyle(s)))}</View>
  <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',justifyContent:'center'}}>{(['cone-lesson','sweep-window','power-trade'] as const).map((m,i)=>btn(['Warehouse','Rooftops','Powerworks'][i]!,mission===m,()=>setMission(m)))}</View>
  <View style={{borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#425A4E',width:size,height}}><GameCanvas key={mission} size={size} height={height} camera={camera} input={input} game={game} alpha={alpha} clock={clock} level={level} wallStyle={style} appearance={{reducedEffects:true}}/></View>
  <Text accessibilityLiveRegion="polite" style={{color:INK}}>Wall height: {wallHeight(style).toFixed(2)} tiles · {pose==='lap'?'walking around cover':pose+' edge'}</Text>
  <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',justifyContent:'center'}}>{(['north','south','corner','lap'] as const).map(p=>btn({north:'Behind cover',south:'In front',corner:'Corner',lap:'Walk around'}[p],pose===p,()=>setPose(p)))}</View>
  <Text style={{color:MUTED,maxWidth:620,textAlign:'center',lineHeight:21}}>B is the new default. A retains the previous rendering. Walls use the same collision footprint; drones stay above cover. No progress, scores or payments are changed in this preview.</Text>
  <Pressable accessibilityRole="link" onPress={()=>{window.location.href=`/?build=wall-depth&testMission=${mission}&wallDepth=${style}`;}} style={{padding:16,borderRadius:12,backgroundColor:'#BEDCCD'}}><Text style={{color:'#10241B',fontWeight:'800'}}>Play this mission with {style} walls ↗</Text></Pressable>
 </ScrollView>;
}
