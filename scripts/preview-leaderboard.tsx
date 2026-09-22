// Review-only fixtures. Never imported by the game or written to its storage.
import React,{useState} from 'react';
const {createRoot}=require('react-dom/client') as {createRoot:(element:HTMLElement)=>{render:(node:React.ReactNode)=>void}};
import {Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import WeeklyStandings from '../src/league/WeeklyStandings';
import BottomTabs from '../src/components/BottomTabs';
import type {LeagueEntry,LeagueSummary} from '../shared/league';

const state=new URLSearchParams(location.search).get('state')??'populated';
const entry=(n:number):LeagueEntry=>({wallet:`Fixture${String(n).padStart(2,'0')}Wallet${String(n).padStart(4,'0')}`,rank:n,position:n,points:Math.max(0,9000-n*80),ticks:2700+n*90,cleared:3,best:[]});
const entries=Array.from({length:8},(_,i)=>entry(i+1));
const personal=entry(34),rival=entry(30);rival.points=personal.points+180;
if(state==='ties'){entries[1]={...entries[1]!,rank:1,points:entries[0]!.points,ticks:entries[0]!.ticks};}
const empty=['empty','loading','unavailable'].includes(state),local=state==='local';
const data:LeagueSummary={authenticated:true,week:'2026-09-14',endsAt:'2026-09-21T00:00:00Z',rulesHash:'review-fixture',contracts:[],attempts:{},earned:false,active:null,history:[],domain:state==='long-name'?'verylongcouriernameforlayout.skr':null,board:{week:'2026-09-14',endsAt:'2026-09-21T00:00:00Z',participants:empty?0:local?1:58,final:false,entries:empty?[]:local?[personal]:entries,personal:empty||state==='unranked'?null:personal,rival:empty||local?null:rival,nearby:empty||local?[]:[rival,...[31,32,33].map((n,i)=>({...entry(n),points:rival.points-(i+1)*20})),personal,entry(35)]}};
function Preview(){
 const {height}=useWindowDimensions(),[action,setAction]=useState('');
 return <View style={{height:'100%',minHeight:0,backgroundColor:'#0C0C0E',padding:12,paddingTop:4}}>
  <View style={{height:34,justifyContent:'center'}}><Text style={{fontSize:11,fontWeight:'800',letterSpacing:2,color:'#BDD6CC'}}>STEAL A SEEKER</Text></View>
  <View style={{height:64,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{gap:4}}><Text style={{fontSize:9,color:'#AFD1C6',letterSpacing:1}}>REVIEW FIXTURE · {state.toUpperCase()}</Text><Text style={{fontSize:25,fontWeight:'900',color:'#DEEEEA'}}>WEEKLY LEAGUE</Text></View><Text style={{fontSize:10,color:'#9FBAB1'}}>3d 12h left ↻</Text></View>
  <View style={{height:43,flexDirection:'row',marginBottom:8,borderBottomWidth:1,borderColor:'#35423D'}}>{['Rankings','Missions','History'].map((v,i)=><View key={v} style={{flex:1,justifyContent:'center',alignItems:'center',borderBottomWidth:3,borderBottomColor:i===0?'#B8E1D8':'transparent'}}><Text style={{fontSize:12,color:i===0?'#DDF0E8':'#7F9B90',fontWeight:'700'}}>{v}</Text></View>)}</View>
  {action?<View style={{flex:1,justifyContent:'center',alignItems:'center',gap:20}}><Text style={{fontSize:15,color:'#DDF0E8',textAlign:'center'}}>{action} callback fired. This gallery has no gameplay or sharing side effects.</Text><Pressable accessibilityRole="button" onPress={()=>setAction('')}><Text style={{color:'#ACE2D0'}}>Back to fixture</Text></Pressable></View>:<ScrollView style={{flex:1}}><WeeklyStandings data={state==='unavailable'||state==='loading'?undefined:data} local={local} loading={state==='loading'} onPlay={()=>setAction('Play weekly missions')} onShare={()=>setAction('Share Courier Card')}/></ScrollView>}
  <Text style={{fontSize:9,color:'#718C81',textAlign:'center',marginTop:8}}>Weekly token prizes are not active.</Text>
  <BottomTabs compact={height<760} selected="leaderboard" onChange={()=>setAction('Bottom navigation')}/>
 </View>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
