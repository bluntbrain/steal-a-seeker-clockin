import React,{useState,useCallback} from 'react';import {Text,View} from 'react-native';
import BossEntrance from '../components/BossEntrance';import {HapticPressable as Pressable} from '../feedback/HapticPressable';import {BOSSES,type BossId} from '../../shared/campaign-levels';
export default function BossLab(){const [boss,setBoss]=useState<BossId>('toly'),[run,setRun]=useState(0),[show,setShow]=useState(false),[reduced,setReduced]=useState(false);const done=useCallback(()=>setShow(false),[]);
return <View style={{flex:1,backgroundColor:'#142823',alignItems:'center',justifyContent:'center',gap:16}}><Text style={{color:'#D4F2E2'}}>Boss entrances and button corners</Text><View style={{flexDirection:'row',gap:6,flexWrap:'wrap',maxWidth:500}}>{BOSSES.map(n=><Pressable key={n} accessibilityRole="button" onPress={()=>{setBoss(n);setRun(v=>v+1);setShow(true);}} style={{padding:15,borderRadius:20,backgroundColor:'#BEDFCD'}}><Text>{n}</Text></Pressable>)}</View>
<Pressable accessibilityRole="button" spinner onPress={()=>{}} style={{width:280,padding:20,borderRadius:28,backgroundColor:'#C1EFDA'}}><Text>Test rounded loading button</Text></Pressable>
<Pressable accessibilityRole="button" spinner onPress={()=>{}} style={({pressed})=>({width:280,padding:20,borderTopLeftRadius:30,borderBottomRightRadius:30,borderTopRightRadius:10,borderBottomLeftRadius:10,backgroundColor:pressed?'#AACBBB':'#C1EFDA'})}><Text>Test mixed corners</Text></Pressable>
<Pressable accessibilityRole="button" onPress={()=>setReduced(!reduced)}><Text style={{color:'#D4F2E2'}}>{reduced?'Enable motion':'Reduce motion'}</Text></Pressable>
{show&&<BossEntrance key={run} boss={boss} reduced={reduced} onDone={done}/>}</View>;
}
