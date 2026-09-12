import React,{useEffect,useState} from 'react';
import {ScrollView,Text} from 'react-native';
import {runOnJS,runOnUI} from 'react-native-reanimated';
import fixtures from '../verification/native-replay-fixtures.json';
import {parityRun} from './game/parity';
import type {MissionId} from './game/level';
import type {Replay} from '../shared/replay';
import {restorePaidState} from './paid/recovery';
import {recordStep} from './game/recording';
function recoveredRun(mission:MissionId,replay:Replay){
 'worklet';
 const split=Math.max(1,Math.floor(replay.chunks.length/2)),prefix:Replay={version:1,chunks:replay.chunks.slice(0,split).map(c=>({...c}))};
 const state=restorePaidState(mission,prefix),recorded=prefix.chunks;let dash=state.dashSeen,tool=state.toolSeen;
 for(const c of replay.chunks.slice(split))for(let n=0;n<c.ticks;n++){if(c.buttons&2)dash++;if(c.buttons&4)tool++;recordStep(state,{x:c.x/127,y:c.y/127,interact:!!(c.buttons&1),dash,tool},recorded);}
 const round=(n:number)=>Math.round(n*1e6)/1e6;
 return {status:state.status,ticks:state.ticks,score:state.score,battery:state.battery,delivered:state.delivered,spotted:state.spotted,dashes:state.dashes,decoysLeft:state.decoysLeft,x:round(state.x),y:round(state.y),power:state.power,activations:state.activations,guards:state.guards.map(g=>({x:round(g.x),y:round(g.y),mode:g.mode,exposure:round(g.exposure)})),recordedTicks:recorded.reduce((n,c)=>n+c.ticks,0)};
}
export default function NativeParityProbe(){
 const [report,setReport]=useState<{name:string;passed:boolean;actual:unknown}[]>([]);
 useEffect(()=>{runOnUI(()=>{'worklet';const results=fixtures.cases.flatMap((c,index)=>{const actual=parityRun(c.mission as MissionId,c.replay as Replay),recovered=recoveredRun(c.mission as MissionId,c.replay as Replay);return [{name:`${index+1}. ${c.name}`,passed:JSON.stringify(actual)===JSON.stringify(c.expected),actual},{name:`${index+1}. restored ${c.name}`,passed:JSON.stringify(recovered)===JSON.stringify(c.expected),actual:recovered}];});runOnJS(setReport)(results);})();},[]);
 return <ScrollView style={{flex:1,backgroundColor:'#10221b'}} contentContainerStyle={{padding:35,paddingTop:80,gap:15}}><Text style={{color:'#d6eddf',fontSize:24,fontWeight:'800'}}>{report.length?`${report.filter(r=>r.passed).length}/${report.length} NATIVE PARITY PASSED`:'RUNNING NATIVE PARITY'}</Text><Text style={{color:'#a5c7b3',fontSize:13}}>Dedicated diagnostic build. Reanimated UI runtime, fixed recorded inputs. This is not a native touch playthrough.</Text>{report.map(r=><Text key={r.name} style={{color:r.passed?'#b9e3cd':'#ffad89',fontSize:15}}>{r.passed?'PASS':'FAIL'} {r.name}{!r.passed?JSON.stringify(r.actual):''}</Text>)}</ScrollView>;
}
