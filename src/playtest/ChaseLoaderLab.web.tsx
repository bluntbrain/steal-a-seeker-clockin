import React,{useState} from 'react';
import {View,Text,Pressable} from 'react-native';
import MissionChaseLoader from '../components/MissionChaseLoader';
// Local-only visual fixture of the actual component, never a simulated loading percentage.
export default function ChaseLoaderLab(){
 const [mode,setMode]=useState('Animated'),[notice,setNotice]=useState('');
 return <View style={{flex:1,backgroundColor:'#0C1812'}}>
  <MissionChaseLoader number={3} title="Laser Alley" reduced={mode==='Reduced motion'} error={mode==='Error'?'Could not load the map. Try again.':''} onRetry={()=>{setMode('Animated');setNotice('Retry selected');}} onExit={()=>{window.location.href='/?build=chase-loader';}}/>
  <View style={{position:'absolute',zIndex:90,top:16,left:12,right:12,alignItems:'center',gap:8}}>
   <Text style={{fontSize:10,color:'#A6C3B2'}}>LOADER PREVIEW · REAL COMPONENT</Text>
   <View style={{flexDirection:'row',gap:8}}>{['Animated','Reduced motion','Error'].map(label=><Pressable key={label} accessibilityRole="button" onPress={()=>{setMode(label);setNotice('');}} style={{padding:10,borderRadius:8,backgroundColor:mode===label?'#CFE6D6':'#22392C'}}><Text style={{fontSize:11,color:mode===label?'#15352A':'#CFE6D6'}}>{label}</Text></Pressable>)}</View>
   <Text accessibilityLiveRegion="polite" style={{color:'#A6C3B2',fontSize:11}}>{notice}</Text>
  </View>
  <Pressable accessibilityRole="link" onPress={()=>{window.location.href='/?build=chase-loader&testMission=practice';}} style={{position:'absolute',zIndex:90,bottom:20,alignSelf:'center',padding:14}}><Text style={{color:'#CFE6D6',fontWeight:'700'}}>Play mission 1 →</Text></Pressable>
 </View>;
}
