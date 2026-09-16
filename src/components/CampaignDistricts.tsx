import {combatLevel} from '../game/combat-levels';
import React from 'react';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {CAMPAIGN_IDS,getLevel,type MissionId} from '../game/level';
import {unlocked,type Progress} from '../progress/model';

const districts=[
 {name:'WAREHOUSE',art:require('../../assets/world-v3/district-warehouse.png')},
 {name:'ROOFTOPS',art:require('../../assets/world-v3/district-rooftops.png')},
 {name:'POWERWORKS',art:require('../../assets/world-v3/district-powerworks.png')},
];

export default function CampaignDistricts({progress,onSelect}:{progress:Progress;onSelect:(mission:MissionId)=>void}){
 return <View testID="mission-districts" style={s.list}>{districts.map((district,index)=><View key={district.name} testID={`district-${index}`} style={s.card}>
  <View style={s.world}><Text style={s.title}>{district.name}</Text><Image source={district.art} resizeMode="contain" style={s.art}/></View>
  <View style={s.missions}>{[0,1].map(row=><View key={row} style={s.row}>{CAMPAIGN_IDS.slice(index*4+row*2,index*4+row*2+2).map(id=>{
   const level=combatLevel(id),open=unlocked(progress,id),best=progress.missions[id],ready=open&&!best;
   return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Mission ${level.number}: ${level.title}${open?'':'. Locked'}`} onPress={()=>onSelect(id)} style={({pressed})=>[s.mission,open&&s.open,ready&&s.ready,pressed&&{opacity:.7}]}>
    <Text style={[s.number,open&&{color:'#E8FAF1'},ready&&{color:'#183C36'}]}>{String(level.number).padStart(2,'0')}</Text>
    <Text style={[s.status,ready&&{color:'#254D42'}]}>{best?'★'.repeat(best.stars)+'☆'.repeat(3-best.stars):open?'PLAY':'LOCKED'}</Text>
   </Pressable>;
  })}</View>)}</View>
 </View>)}</View>;
}
const s=StyleSheet.create({
 list:{flex:1,minHeight:0,gap:8,paddingTop:3,paddingBottom:2},
 card:{flex:1,minHeight:0,flexDirection:'row',gap:8,padding:8,borderWidth:1,borderColor:'#293E39',borderRadius:16,backgroundColor:'#101B19'},
 world:{flex:1,minWidth:0},title:{fontSize:10,lineHeight:14,fontWeight:'800',letterSpacing:1.2,color:'#C8DDD3'},
 art:{flex:1,minHeight:0,width:'100%'},
 missions:{width:'39%',maxWidth:158,justifyContent:'center',gap:6},row:{flexDirection:'row',gap:6},
 mission:{flex:1,minHeight:44,maxHeight:62,aspectRatio:1.12,borderRadius:16,borderWidth:1,borderColor:'#2A3A37',backgroundColor:'#16211F',alignItems:'center',justifyContent:'center'},
 open:{backgroundColor:'#28483F',borderColor:'#779F90'},ready:{backgroundColor:'#CFE6D8',borderColor:'#E3F9E8'},
 number:{fontSize:20,lineHeight:24,fontWeight:'800',color:'#788E86'},status:{fontSize:7,lineHeight:11,letterSpacing:.5,fontWeight:'700',color:'#8FA99F'},
});
