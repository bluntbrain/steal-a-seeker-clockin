// Review-only fixtures. Never imported by the game or written to its storage.
import React,{useState} from 'react';
const {createRoot}=require('react-dom/client') as {createRoot:(element:HTMLElement)=>{render:(node:React.ReactNode)=>void}};
import {Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import WeeklyStandings from '../src/league/WeeklyStandings';
import {WeeklyLeagueHeader,WeeklyPlayButton,LeagueSurface} from '../src/league/LeagueVisuals';
import BrandWordmark from '../src/components/BrandWordmark';
import CreditChip from '../src/components/CreditChip';
import BottomTabs from '../src/components/BottomTabs';
import type {LeagueEntry,LeagueSummary} from '../shared/league';

const state=new URLSearchParams(location.search).get('state')??'populated';
const entry=(n:number):LeagueEntry=>({wallet:`Fixture${String(n).padStart(2,'0')}Wallet${String(n).padStart(4,'0')}`,rank:n,position:n,points:Math.max(0,49000-n*1000),ticks:2700+n*90,cleared:3,best:[]});
const entries=Array.from({length:4},(_,i)=>entry(i+1));
const personal={...entry(7),points:41860,cleared:2},rival=entry(6);rival.points=personal.points+180;
if(state==='ties'){entries[1]={...entries[1]!,rank:1,points:entries[0]!.points,ticks:entries[0]!.ticks};}
const empty=['empty','loading','unavailable'].includes(state),local=state==='local';
const data:LeagueSummary={authenticated:state!=='unranked',week:'2026-09-21',endsAt:'2026-09-28T00:00:00Z',rulesHash:'review-fixture',contracts:[],attempts:{},earned:false,active:null,history:[],domain:state==='long-name'?'verylongcouriernameforlayout.skr':null,board:{week:'2026-09-21',endsAt:'2026-09-28T00:00:00Z',participants:empty?0:local?1:58,final:false,entries:empty?[]:local?[personal]:entries,personal:empty||state==='unranked'?null:personal,rival:empty||local?null:rival,nearby:empty||local?[]:[rival,personal,entry(8)]}};
function Preview(){
 const {height}=useWindowDimensions(),[action,setAction]=useState(''),[help,setHelp]=useState(false);
 return <View style={{height:'100%',maxHeight:980,width:'100%',maxWidth:454,alignSelf:'center',minHeight:0,backgroundColor:'#0B1711',paddingHorizontal:12,paddingTop:8,paddingBottom:8}}>
  <View pointerEvents="none" style={{position:'absolute',width:500,height:540,top:-80,right:-110,opacity:.75}}><LeagueSurface kind="glow"/></View>
  <View style={{height:53,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}><BrandWordmark/><View style={{marginLeft:'auto',flexDirection:'row',gap:8,alignItems:'center'}}><CreditChip balance={1575} onPress={()=>setAction('Credits')}/><Text style={{fontSize:20,color:'#93B0A4',width:36,textAlign:'center'}}>⚙</Text></View></View>
  {action?<View style={{flex:1,justifyContent:'center',alignItems:'center',gap:20}}><Text style={{fontSize:15,color:'#DDF0E8',textAlign:'center'}}>{action} callback fired. This gallery has no gameplay or sharing side effects.</Text><Pressable accessibilityRole="button" onPress={()=>setAction('')}><Text style={{color:'#ACE2D0'}}>Back to fixture</Text></Pressable></View>:<><ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom:12,gap:8}} showsVerticalScrollIndicator={false}>
   <WeeklyLeagueHeader local={local} resetLabel="3d 09h left" help={help} onHelp={()=>setHelp(!help)} onRefresh={()=>{}}/>
   <Text style={{fontSize:8,letterSpacing:1,color:'#9BBEA9'}}>REVIEW FIXTURE · SAMPLE DATA · {state.toUpperCase()}</Text>
   <View style={{height:46,flexDirection:'row',borderBottomWidth:1,borderColor:'#35423D'}}>{['Rankings','Missions','History'].map((v,i)=><Pressable key={v} accessibilityRole="tab" aria-selected={i===0} onPress={()=>i&&setAction(v)} style={{flex:1,justifyContent:'center',alignItems:'center',borderBottomWidth:3,borderBottomColor:i===0?'#B8E1D8':'transparent'}}><Text style={{fontSize:14,color:i===0?'#DDF0E8':'#7F9B90',fontWeight:'700'}}>{v}</Text></Pressable>)}</View>
   <WeeklyStandings data={state==='unavailable'||state==='loading'?undefined:data} local={local} loading={state==='loading'} onShare={()=>setAction('Share Courier Card')}/>
   <Text style={{fontSize:9,color:'#718C81',textAlign:'center',marginTop:8}}>Weekly token prizes are not active.</Text>
  </ScrollView><WeeklyPlayButton disabled={state==='loading'||state==='unavailable'} onPress={()=>setAction('Play weekly missions')}/></>}
  <BottomTabs compact={height<760} selected="leaderboard" onChange={()=>setAction('Bottom navigation')}/>
 </View>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
