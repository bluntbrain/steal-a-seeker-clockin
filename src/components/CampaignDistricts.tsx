import {useHaptics} from '../feedback/useHaptics';
import React,{useState} from 'react';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {Canvas,Path} from '@shopify/react-native-skia';
import {combatLevel} from '../game/combat-levels';
import {CAMPAIGN_IDS,type MissionId} from '../game/level';
import {unlocked,type Progress} from '../progress/model';
import frames from '../../assets/district-map/frames.json';

type Point={x:number;y:number};
const districts=[
 {id:'warehouse',name:'WAREHOUSE',art:require('../../assets/district-map/warehouse.png'),ratio:frames.warehouse.width/frames.warehouse.height,anchors:[[.13,.51],[.38,.61],[.63,.75],[.88,.53]],icon:'M3 21 V9 L12 3 L21 9 V21 H15 V14 H9 V21 Z M7 10 H9 M15 10 H17'},
 {id:'rooftops',name:'ROOFTOPS',art:require('../../assets/district-map/rooftops.png'),ratio:frames.rooftops.width/frames.rooftops.height,anchors:[[.13,.53],[.38,.40],[.63,.76],[.88,.60]],icon:'M3 21 V10 H21 V21 Z M7 10 V6 H17 V10 M12 6 V2 M7 14 V16 M12 14 V16 M17 14 V16'},
 {id:'powerworks',name:'POWERWORKS',art:require('../../assets/district-map/powerworks.png'),ratio:frames.powerworks.width/frames.powerworks.height,anchors:[[.13,.58],[.38,.48],[.63,.72],[.88,.54]],icon:'M14 2 L4 14 H11 L9 23 L21 10 H14 Z'},
] as const;

export default function CampaignDistricts({progress,onSelect}:{progress:Progress;onSelect:(mission:MissionId)=>void}){
 const haptic=useHaptics();
 const [bounds,setBounds]=useState({width:0,height:0});
 const rowHeight=bounds.height/3;
 const next=CAMPAIGN_IDS.find(id=>!progress.missions[id]);
 const scenes=districts.map(d=>{const h=Math.min(Math.max(0,rowHeight-8),bounds.width/d.ratio);return {width:h*d.ratio,height:h,left:(bounds.width-h*d.ratio)/2,top:rowHeight-h};});
 const point=(index:number,node:number):Point=>{const d=districts[index]!,scene=scenes[index]!,p=d.anchors[node]!;return {x:scene.left+p[0]*scene.width,y:index*rowHeight+scene.top+p[1]*scene.height};};
 const diameter=Math.max(29,Math.min(38,bounds.width*.103)),touch=rowHeight<140?44:48;
 return <View testID="mission-districts" style={s.list} onLayout={event=>{const {width,height}=event.nativeEvent.layout;setBounds(old=>old.width===width&&old.height===height?old:{width,height});}}>
  {bounds.width>0&&districts.map((district,index)=>{const scene=scenes[index]!,ids=CAMPAIGN_IDS.slice(index*4,index*4+4),cleared=ids.filter(id=>progress.missions[id]).length;
   return <View key={district.id} testID={`district-${index}`} style={{position:'absolute',top:index*rowHeight,width:'100%',height:rowHeight}}>
    <Image source={district.art} accessible={false} resizeMode="contain" style={{position:'absolute',left:scene.left,top:scene.top,width:scene.width,height:scene.height}}/>
    <View pointerEvents="none" style={s.caption}><Canvas style={{width:22,height:24}}><Path path={district.icon} color="#C7E5DA" style="stroke" strokeWidth={1.65} strokeJoin="round" strokeCap="round"/></Canvas><View style={{gap:5}}><Text style={s.title}>{district.name}</Text><View style={s.progress}>{ids.map((id,n)=><View key={id} style={[s.progressBit,{backgroundColor:n<cleared?'#B8E7D5':'#34413F'}]}/>)}</View></View></View>
   </View>;
  })}
  {bounds.width>0&&<Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
   {districts.flatMap((_,index)=>[0,1,2].map(n=>{const a=point(index,n),b=point(index,n+1),done=!!progress.missions[CAMPAIGN_IDS[index*4+n]!];return <Path key={`${index}-${n}`} path={`M${a.x} ${a.y} L${b.x} ${b.y}`} color={done?'#BAF1DC':'#758F87'} opacity={done?.95:.55} style="stroke" strokeWidth={done?2.5:1.6} strokeCap="round"/>;}))}
   {[0,1].map(index=>{const from=point(index,3),to=scenes[index+1]!,y=(index+1)*rowHeight+to.top+to.height*.18;return <Path key={`bridge-${index}`} path={`M${from.x} ${from.y+diameter/2} L${from.x} ${y}`} color="#739B8D" opacity={.45} style="stroke" strokeWidth={1.6}/>;})}
  </Canvas>}
  {bounds.width>0&&CAMPAIGN_IDS.map((id,index)=>{const level=combatLevel(id),open=unlocked(progress,id),best=progress.missions[id],current=id===next,p=point(Math.floor(index/4),index%4);
   return <Pressable key={id} testID={`mission-node-${level.number}`} accessibilityRole="button" accessibilityLabel={`Mission ${level.number}: ${level.title}${open?'':'. Locked'}`} accessibilityState={{selected:current}} onPress={()=>{haptic('select');onSelect(id);}} style={({pressed})=>[s.target,{width:touch,height:touch+9,left:p.x-touch/2,top:p.y-diameter/2-4,opacity:pressed?.7:1}]}>
    <View style={[s.node,{width:diameter,height:diameter,borderRadius:diameter/2},open&&s.open,current&&s.current]}><Text maxFontSizeMultiplier={1.15} style={[s.number,current&&{color:'#142F28'},!open&&{color:'#9FAEA9'}]}>{String(level.number).padStart(2,'0')}</Text></View>
    {best?<Text maxFontSizeMultiplier={1} style={s.stars}>{'★'.repeat(best.stars)}<Text style={{color:'#65736C'}}>{'★'.repeat(3-best.stars)}</Text></Text>:current?<Text maxFontSizeMultiplier={1} style={s.play}>PLAY</Text>:!open?<Canvas pointerEvents="none" style={{width:10,height:10,marginTop:2}}><Path path="M3 4 V3 A2 2 0 0 1 7 3 V4 M2 4 H8 V9 H2 Z" color="#ADBAB2" style="stroke" strokeWidth={1.25} strokeJoin="round"/></Canvas>:null}
   </Pressable>;
  })}
 </View>;
}
const s=StyleSheet.create({
 list:{flex:1,minHeight:0},caption:{position:'absolute',left:4,top:3,flexDirection:'row',alignItems:'center',gap:8},
 title:{fontSize:10,lineHeight:13,fontWeight:'700',letterSpacing:1.8,color:'#D5E5DF'},progress:{flexDirection:'row',gap:2},progressBit:{width:9,height:2,borderRadius:1},
 target:{position:'absolute',alignItems:'center',paddingTop:4},node:{borderWidth:2,borderColor:'#60746C',backgroundColor:'#15201D',alignItems:'center',justifyContent:'center'},
 open:{borderColor:'#B7E5D4',backgroundColor:'#19352F',shadowColor:'#9BE8CE',shadowRadius:7,shadowOpacity:.55,shadowOffset:{width:0,height:0}},
 current:{backgroundColor:'#D7F3E5',borderColor:'#F0FFF6',shadowOpacity:.7,shadowRadius:11},number:{fontSize:16,lineHeight:20,fontWeight:'800',color:'#EDFFF6'},
 stars:{fontSize:9,lineHeight:11,letterSpacing:1,color:'#D2F1DF',marginTop:2,textShadowColor:'#07100C',textShadowRadius:3,textShadowOffset:{width:0,height:1}},play:{fontSize:7,lineHeight:10,fontWeight:'800',letterSpacing:1.4,color:'#D2F1DF',marginTop:2},
});
