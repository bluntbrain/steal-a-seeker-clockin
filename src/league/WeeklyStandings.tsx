import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import React,{useState} from 'react';
import {Image,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import type {LeagueSummary,LeagueEntry} from '../../shared/league';
import {leagueLeaders,leagueRows,rivalLabel} from './presentation';
import {shortWallet} from './card';

const podium=require('../../assets/leaderboard-v2/podium.webp');
const portrait=require('../../assets/leaderboard-v2/courier-avatar.png');
type Props={data?:LeagueSummary;local:boolean;loading:boolean;onPlay:()=>void;onShare:()=>void};
export default function WeeklyStandings({data,local,loading,onPlay,onShare}:Props){
 const {height}=useWindowDimensions(),compact=height<760,short=height<700,[nearby,setNearby]=useState(false);
 const heroHeight=short?72:compact?92:112;
 const board=data?.board,personal=board?.personal??null,leaders=board?leagueLeaders(board):[];
 const rows=board?(nearby?board.nearby:leagueRows(board)):[],hasRivals=!local&&!!personal&&(board?.nearby.length??0)>1;
 const playerName=(p:LeagueEntry)=>p.wallet===personal?.wallet?(data?.domain??'YOU'):shortWallet(p.wallet);
 const hint=local?'Local score · not a live rank':rivalLabel(personal,board?.rival??null)??(personal?`${personal.cleared}/3 missions cleared`:'Finish a scored run to join');
 return <View style={s.root} testID="weekly-standings-v2">
  <View style={s.content}>
   <View style={[s.hero,{height:heroHeight}]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Image source={podium} resizeMode="contain" style={[s.heroArt,!leaders.length&&{opacity:.5}]}/></View>
   {leaders.length>0?<View style={[s.leaders,{maxWidth:heroHeight*2.5,alignSelf:'center',width:'100%'},short&&{paddingBottom:6}]} accessibilityLabel={local?'Local test scores':'Top three couriers'}>{[1,0,2].map((position)=>{const p=leaders[position];return <View key={position} style={[s.leader,short&&{gap:2}]}>
    <Text style={[s.leaderRank,short&&{fontSize:18,lineHeight:22},position===0&&s.gold]}>{p?(local?'TEST':`#${p.rank}`):'—'}</Text>
    <Text style={s.leaderName} numberOfLines={1}>{p?playerName(p):'Open place'}</Text>
    <Text style={s.leaderScore}>{p?p.points.toLocaleString():'—'}</Text>
   </View>;})}</View>:<View style={s.empty} testID="weekly-empty"><Text style={s.emptyTitle}>{loading?'Loading this week…':data?'The board is open.':'League unavailable'}</Text><Text style={s.muted}>{loading?'Fetching verified scores':data?'Be the first courier to finish.':'Refresh to try again.'}</Text></View>}
  <View style={s.footer}>
   <View style={s.position} testID="weekly-your-position"><Text style={s.positionRank}>{personal?(local?'·':`#${personal.rank}`):'—'}</Text><View style={s.nameCell}><Text style={s.positionLabel}>{local?'YOUR TEST SCORE':'YOUR POSITION'}</Text><Text numberOfLines={2} style={s.positionHint}>{hint}</Text></View><View style={{alignItems:'flex-end',gap:3}}><Text style={s.positionPoints}>{personal?personal.points.toLocaleString():'—'}</Text>{personal&&<Pressable accessibilityRole="button" accessibilityLabel="Share my Courier Card" onPress={onShare} style={s.share}><Text style={s.shareText}>SHARE ↗</Text></Pressable>}</View></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Play weekly missions" disabled={!data||loading} onPress={onPlay} style={({pressed})=>[s.play,(!data||loading||pressed)&&{opacity:.55}]} testID="weekly-play-missions"><Text style={s.playLabel}>PLAY WEEKLY MISSIONS</Text><Text style={s.arrow}>→</Text></Pressable>
  </View>
   <View style={s.tableHeader}><View style={{flexDirection:'row',gap:16}}><Pressable accessibilityRole="button" accessibilityState={{selected:!nearby}} onPress={()=>setNearby(false)} style={s.listToggle}><Text style={[s.eyebrow,!nearby&&s.activeText]}>{local?'YOUR TEST RUNS':'TOP COURIERS'}</Text></Pressable>{hasRivals&&<Pressable accessibilityRole="button" accessibilityState={{selected:nearby}} onPress={()=>setNearby(true)} style={s.listToggle}><Text style={[s.eyebrow,nearby&&s.activeText]}>NEAR YOU</Text></Pressable>}</View><Text style={s.eyebrow}>POINTS</Text></View>
   {rows.map(p=><View key={p.wallet} style={[s.row,p.wallet===personal?.wallet&&s.yourRow]} testID="weekly-ranking-row"><Text style={s.rowRank}>{local?'·':p.rank}</Text><Image source={portrait} style={s.avatar}/><View style={s.nameCell}><Text style={s.name} numberOfLines={1}>{playerName(p)}</Text><Text style={s.rowDetail}>{p.cleared}/3 · {(p.ticks/30).toFixed(1)}s</Text></View><Text style={s.points}>{p.points.toLocaleString()}</Text></View>)}
   {!rows.length&&<Text style={s.emptyRows}>{local?'Weekly test results stay on this device.':leaders.length?'The next place is still open.':'No completed scores yet.'}</Text>}
  </View>

 </View>;
}
const s=StyleSheet.create({
 root:{gap:4},content:{paddingBottom:6},hero:{width:'100%',marginTop:2},heroArt:{width:'100%',height:'100%'},
 leaders:{flexDirection:'row',paddingHorizontal:'12%',paddingBottom:14,borderBottomWidth:1,borderBottomColor:'#35423D'},leader:{flex:1,alignItems:'center',gap:4},leaderRank:{fontSize:22,lineHeight:26,fontWeight:'900',color:'#C0D4D1'},gold:{color:'#DEC591'},leaderName:{fontSize:11,fontWeight:'700',color:'#E3EEEB',maxWidth:'95%'},leaderScore:{fontSize:16,fontWeight:'800',color:'#ACDFD5',fontVariant:['tabular-nums']},
 empty:{alignItems:'center',gap:6,paddingBottom:15},emptyTitle:{fontSize:19,fontWeight:'800',color:'#E4EEEB'},muted:{fontSize:12,color:'#92ACA6'},tableHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#35423D',minHeight:42},eyebrow:{fontSize:10,fontWeight:'700',letterSpacing:1.1,color:'#809991'},activeText:{color:'#B6DCD2'},listToggle:{minHeight:42,justifyContent:'center'},
 row:{minHeight:48,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderBottomColor:'#25322E',paddingHorizontal:8},yourRow:{backgroundColor:'#172923'},rowRank:{width:26,fontSize:17,fontWeight:'800',color:'#DEECE6',fontVariant:['tabular-nums']},avatar:{height:32,width:32,borderRadius:16,borderWidth:1,borderColor:'#536E65'},nameCell:{flex:1,minWidth:0,gap:3},name:{fontSize:12,fontWeight:'700',color:'#E0EDE6'},rowDetail:{fontSize:10,color:'#8DA69E'},points:{fontSize:14,fontWeight:'700',color:'#E1EBE6',fontVariant:['tabular-nums']},emptyRows:{paddingVertical:18,fontSize:12,color:'#7B938B'},
 footer:{gap:8,paddingVertical:8},position:{minHeight:68,flexDirection:'row',alignItems:'center',gap:10,borderLeftWidth:3,borderLeftColor:'#BDE9DC',padding:12,backgroundColor:'#192C27'},positionRank:{fontSize:24,fontWeight:'800',color:'#E5F0E9',minWidth:32,fontVariant:['tabular-nums']},positionLabel:{fontSize:10,fontWeight:'800',letterSpacing:1,color:'#BEDED4'},positionHint:{fontSize:11,lineHeight:16,color:'#9BB9AF'},positionPoints:{fontSize:20,fontWeight:'800',color:'#E8F2EC',fontVariant:['tabular-nums']},share:{minHeight:24,justifyContent:'center',paddingHorizontal:3},shareText:{fontSize:9,fontWeight:'800',letterSpacing:.6,color:'#A5D7C9'},play:{height:48,borderRadius:7,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:19,backgroundColor:'#CFE6E4'},playLabel:{fontSize:12,fontWeight:'900',letterSpacing:1,color:'#18312A'},arrow:{fontSize:24,color:'#18312A'},
});
