import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import React,{useState} from 'react';
import {Image,StyleSheet,Text,View} from 'react-native';
import type {LeagueSummary,LeagueEntry} from '../../shared/league';
import {leagueStandings,rivalLabel} from './presentation';
import {shortWallet} from './card';
import {LeagueSurface,RankMedal} from './LeagueVisuals';

const portrait=require('../../assets/leaderboard-v2/courier-avatar.png');
type Props={data?:LeagueSummary;local:boolean;loading:boolean;onShare:()=>void};
export default function WeeklyStandings({data,local,loading,onShare}:Props){
 const [nearby,setNearby]=useState(false),board=data?.board,personal=board?.personal??null;
 const hasRivals=!local&&!!personal&&(board?.nearby.length??0)>1;
 const rows=board?leagueStandings(board,nearby&&hasRivals):[];
 const playerName=(p:LeagueEntry)=>p.wallet===personal?.wallet?(data?.domain??'You'):shortWallet(p.wallet);
 const remaining=personal?Math.max(0,3-personal.cleared):3;
 const hint=local?'Local score · not a live rank':personal?(remaining===1?'One mission left to complete your week.':remaining>1?`${remaining} missions left to complete your week.`:rivalLabel(personal,board?.rival??null)??'All three cleared. Improve your best runs.'):'Finish a scored run to join the board.';
 return <View style={s.root} testID="weekly-standings-v3">
  <View style={s.position} testID="weekly-your-position">
   <LeagueSurface/>
   <View style={s.positionTop}>
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6} style={s.positionRank}>{personal?(local?'·':`#${personal.rank}`):'—'}</Text>
    <View style={s.positionIdentity}><Text style={s.positionLabel}>{local?'Your test score':'Your position'}</Text><Text style={s.progress}>{data?(personal?.cleared??0):'—'} / 3 missions</Text></View>
    <View style={s.scoreCell}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6} style={s.positionPoints}>{personal?personal.points.toLocaleString():'—'}</Text><Text style={s.pointsLabel}>POINTS</Text></View>
   </View>
   <View style={s.hintRow}><Text style={s.positionHint}>{loading?'Fetching verified scores…':!data?'Refresh to load your position.':hint}</Text>{personal&&<Pressable accessibilityRole="button" accessibilityLabel="Share my Courier Card" onPress={onShare} style={s.share}><Text style={s.shareText}>Share ↗</Text></Pressable>}</View>
  </View>
  <View style={s.tableHeader}><Text accessibilityRole="header" style={s.tableTitle}>{local?'Your test runs':nearby&&hasRivals?'Near you':'Top couriers'}</Text>{hasRivals&&<Pressable accessibilityRole="button" accessibilityLabel={nearby?'Show top couriers':'Show couriers near you'} onPress={()=>setNearby(!nearby)} style={s.listToggle}><Text style={s.toggleText}>{nearby?'Top couriers':'Near you'} <Text style={{fontSize:20}}>›</Text></Text></Pressable>}</View>
  <View style={s.rows}>{rows.map(p=>{const yours=p.wallet===personal?.wallet,medal=!local&&p.rank<=3;return <View key={p.wallet} style={[s.row,!local&&p.rank===1&&s.goldRow,yours&&s.yourRow]} testID="weekly-ranking-row">
   <LeagueSurface kind={yours?'mint':!local&&p.rank===1?'gold':'row'}/>
   <View style={s.rankCell}>{medal&&<RankMedal rank={p.rank}/>}<Text numberOfLines={1} adjustsFontSizeToFit style={[s.rowRank,!medal&&{textAlign:'center'},!local&&p.rank===1&&{color:'#EEC875'},yours&&{color:'#C1F4E0'}]}>{local?'·':`#${p.rank}`}</Text></View>
   <Image accessible={false} source={portrait} style={s.avatar}/>
   <View style={s.nameCell}><Text style={[s.name,yours&&{color:'#BAEDDC'}]} numberOfLines={1}>{playerName(p)}</Text><Text style={s.rowDetail}>{p.cleared} / 3 cleared</Text></View>
   <View style={s.rowScore}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={s.points}>{p.points.toLocaleString()}</Text><Text style={s.rowPointsLabel}>POINTS</Text></View>
  </View>;})}</View>
  {!rows.length&&<View style={s.empty} testID="weekly-empty"><LeagueSurface kind="row"/><Image accessible={false} source={portrait} style={s.emptyAvatar}/><Text style={s.emptyTitle}>{loading?'Loading this week…':data?'The board is open.':'League unavailable'}</Text><Text style={s.emptyText}>{loading?'Fetching verified scores':data?'Be the first courier to finish a weekly mission.':'Refresh the league to try again.'}</Text></View>}
  {local&&<Text style={s.localNote}>Weekly test results stay on this device.</Text>}
 </View>;
}
const s=StyleSheet.create({
 root:{gap:8,paddingTop:12,paddingHorizontal:2},position:{borderWidth:1.5,borderColor:'#A4EED4',borderRadius:14,overflow:'hidden',paddingHorizontal:12,paddingTop:13,paddingBottom:7,minHeight:99},positionTop:{flexDirection:'row',alignItems:'center',gap:9},positionRank:{flex:.8,fontSize:39,lineHeight:46,fontWeight:'900',letterSpacing:-1.6,color:'#A9F0D8',fontVariant:['tabular-nums']},positionIdentity:{flex:1.25,borderLeftWidth:1,borderRightWidth:1,borderColor:'#55796A',paddingHorizontal:10,gap:5},positionLabel:{fontSize:11,lineHeight:14,color:'#B8D2C5'},progress:{fontSize:12,lineHeight:17,fontWeight:'800',color:'#F2F6EC'},scoreCell:{flex:1.25,alignItems:'flex-end',gap:2},positionPoints:{fontSize:26,lineHeight:32,fontWeight:'900',color:'#BFF7E3',fontVariant:['tabular-nums'],letterSpacing:-.6,maxWidth:'100%'},pointsLabel:{fontSize:9,color:'#A7BFB1',letterSpacing:1.3},hintRow:{flexDirection:'row',alignItems:'center',gap:5,minHeight:28,marginTop:2},positionHint:{flex:1,fontSize:10,lineHeight:14,color:'#AECABB'},share:{minHeight:32,minWidth:42,alignItems:'flex-end',justifyContent:'center'},shareText:{fontSize:10,fontWeight:'700',color:'#BEECDA'},
 tableHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,minHeight:42,marginTop:7,paddingHorizontal:2},tableTitle:{fontSize:22,lineHeight:27,fontWeight:'800',letterSpacing:-.5,color:'#F4F3E9'},listToggle:{minHeight:40,justifyContent:'center',paddingLeft:8},toggleText:{fontSize:11,color:'#A7BFB1'},rows:{gap:6},row:{minHeight:62,borderRadius:11,borderWidth:1,borderColor:'#2B4638',overflow:'hidden',paddingHorizontal:9,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:8},goldRow:{borderColor:'#726534'},yourRow:{borderWidth:1.5,borderColor:'#9DEBD0'},rankCell:{width:46,flexDirection:'row',alignItems:'center',gap:1},rowRank:{flex:1,fontSize:12,fontWeight:'800',color:'#A4B8AD',fontVariant:['tabular-nums']},avatar:{height:39,width:39,borderRadius:20,borderWidth:1,borderColor:'#647D6E'},nameCell:{flex:1,minWidth:0,gap:5},name:{fontSize:13,lineHeight:16,fontWeight:'800',color:'#F1F3EB'},rowDetail:{fontSize:10,color:'#B1C9BA'},rowScore:{width:66,alignItems:'flex-end',gap:4},points:{fontSize:17,lineHeight:20,fontWeight:'800',color:'#F1F5EC',fontVariant:['tabular-nums'],maxWidth:'100%'},rowPointsLabel:{fontSize:8,letterSpacing:1,color:'#8AA89A'},
 empty:{borderWidth:1,borderColor:'#33533F',borderRadius:14,overflow:'hidden',alignItems:'center',padding:22,gap:8},emptyAvatar:{width:65,height:65,borderRadius:33,borderWidth:1,borderColor:'#86B6A2'},emptyTitle:{fontSize:21,fontWeight:'800',color:'#E7F0E8',textAlign:'center'},emptyText:{fontSize:12,lineHeight:19,color:'#A0BAAB',textAlign:'center'},localNote:{paddingVertical:12,color:'#829F8F',fontSize:10,lineHeight:15,textAlign:'center'},
});
