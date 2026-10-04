import React,{useState} from 'react';
import {View,Text,Pressable} from 'react-native';
import CampaignMap from '../components/CampaignMap';
import {campaignEntries,BUNDLED_LEVELS} from '../campaign/levels';
import {freshProgress} from '../progress/model';
const entries=campaignEntries(BUNDLED_LEVELS);
export default function CampaignWorldLab(){
 const [level,setLevel]=useState(1),[selected,setSelected]=useState('Tap a level to check selection');
 const progress=freshProgress();
 for(const entry of entries.slice(0,level-1))progress.missions[entry.key]={stars:3,seconds:40,score:2500,battery:100,completions:1};
 return <View style={{flex:1,backgroundColor:'#10251F'}}>
  <View style={{padding:10,gap:6,alignItems:'center'}}>
   <Text style={{color:'#B6D4C4',fontSize:10}}>MAP PREVIEW · SAMPLE PROGRESS</Text>
   <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:6}}>{[1,11,21,31,41,51,61,71,81,91,100].map(n=><Pressable key={n} accessibilityRole="button" onPress={()=>{setLevel(n);setSelected('Tap a level to check selection');}} style={{padding:8,borderRadius:8,backgroundColor:level===n?'#B6EAD5':'#284B3C'}}><Text style={{color:level===n?'#142D24':'#D2E8DC',fontSize:11}}>Level {n}</Text></Pressable>)}</View>
   <Text accessibilityLiveRegion="polite" style={{color:'#D2E8DC',fontSize:11}}>{selected}</Text>
  </View>
  <CampaignMap key={level} entries={entries} progress={progress} current={entries[level-1]!} onSelect={e=>setSelected(`Level ${e.number}: ${e.title}`)}/>
 </View>;
}
