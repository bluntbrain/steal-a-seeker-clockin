import React,{useState} from 'react';
import {useLevelMusic} from '../audio/useLevelMusic';
import {View,Text,Pressable} from 'react-native';
import {BOSSES,type BossId} from '../../shared/campaign-levels';
import MissionChaseLoader from '../components/MissionChaseLoader';
// Visual fixture: manual progress samples; production receives actual scene readiness.
export default function ChaseLoaderLab(){
 const query=new URLSearchParams(window.location.search),requestedBoss=query.get('boss') as BossId;
 const [boss,setBoss]=useState<BossId|undefined>(BOSSES.includes(requestedBoss)?requestedBoss:undefined);
 const [mode,setMode]=useState('Preview'),[notice,setNotice]=useState('');
 const [run,setRun]=useState(0);
 const [music,setMusic]=useState(0),[progress,setProgress]=useState(.55);
 useLevelMusic(music||1,music>0,.7,false);
 const controls=new URLSearchParams(window.location.search).has('controls');
 return <View style={{flex:1,backgroundColor:'#0C1812'}}>
  <MissionChaseLoader key={run} onComplete={()=>setNotice('Fill complete; gameplay can begin')} boss={boss} progress={progress} reduced={mode==='Reduced motion'} error={mode==='Error'?'Could not load the map. Try again.':''} onRetry={()=>{setMode('Preview');setProgress(0);setRun(n=>n+1);setNotice('Retry selected');}} onExit={()=>{window.location.href='/?build=poster-loader';}}/>
  {controls&&<View style={{position:'absolute',zIndex:90,top:16,left:12,right:12,alignItems:'center',gap:8}}>
   <Text style={{fontSize:10,color:'#A6C3B2'}}>POSTER LOADER · PREVIEW</Text>
   <View style={{flexDirection:'row',gap:8}}>{['Preview','Reduced motion','Error'].map(label=><Pressable key={label} accessibilityRole="button" onPress={()=>{setMode(label);setNotice('');}} style={{padding:10,borderRadius:8,backgroundColor:mode===label?'#CFE6D6':'#22392C'}}><Text style={{fontSize:11,color:mode===label?'#15352A':'#CFE6D6'}}>{label}</Text></Pressable>)}</View>
   <View style={{flexDirection:'row',gap:8}}>{['Music off','Infiltration','Pursuit'].map((label,i)=><Pressable key={label} accessibilityRole="button" onPress={()=>setMusic(i)} style={{padding:10,borderRadius:8,backgroundColor:music===i?'#CFE6D6':'#22392C'}}><Text style={{fontSize:11,color:music===i?'#15352A':'#CFE6D6'}}>{label}</Text></Pressable>)}</View>
   <View style={{flexDirection:'row',gap:10}}>{[0,.55,1].map(p=><Pressable key={p} accessibilityRole="button" onPress={()=>{setProgress(p);if(p===0){setRun(n=>n+1);setNotice('');}}} style={{padding:8,borderRadius:8,backgroundColor:'#22392C'}}><Text style={{color:'#CFE6D6',fontSize:11}}>{Math.round(p*100)}% preview</Text></Pressable>)}</View>
   <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:4}}>{BOSSES.map(id=><Pressable key={id} accessibilityRole="button" onPress={()=>setBoss(id)} style={{padding:6,borderRadius:8,backgroundColor:'#22392C'}}><Text style={{color:'#CFE6D6',fontSize:10}}>{id}</Text></Pressable>)}</View>
   <Text accessibilityLiveRegion="polite" style={{color:'#A6C3B2',fontSize:11}}>{notice}</Text>
  </View>}
  {controls&&<Pressable accessibilityRole="link" onPress={()=>{window.location.href='/?build=poster-loader&testMission=practice';}} style={{position:'absolute',zIndex:90,bottom:24,alignSelf:'center',padding:14}}><Text style={{color:'#CFE6D6',fontWeight:'700'}}>Play mission 1 →</Text></Pressable>}
 </View>;
}
