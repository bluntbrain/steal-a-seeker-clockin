// campaign leaderboard: total points from each player's best verified run per level. wallet players with verified
// runs are listed; a browser guest sees the board and the total from this device, which is not ranked
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Image,ScrollView,StyleSheet,Text,View} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useAccount} from '../commerce/account-context';
import {campaignApi} from './client';
import {ApiError} from '../commerce/client';
import type {CampaignBoard as Board,CampaignRank} from '../../shared/economy';
import {LeagueSurface,RankMedal} from '../league/LeagueVisuals';
import {shortWallet} from '../league/card';
import type {Progress} from '../progress/model';
import type {CampaignEntry} from './levels';
const portrait=require('../../assets/leaderboard-v2/courier-avatar.png');
type Props={entries:readonly CampaignEntry[];progress:Progress;onShare:()=>void;onRewards:()=>void};
export default function CampaignBoard({entries,progress,onShare,onRewards}:Props){
 const account=useAccount(),accountRef=useRef(account);accountRef.current=account;
 const [data,setData]=useState<Board>(),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{let token:string|undefined;const a=accountRef.current;if(a.wallet&&!a.preview){try{token=(await a.session(false)).token;}catch{/* an anonymous board still loads */}}setData(await campaignApi.board(token));}
  catch(e){setError(e instanceof ApiError&&e.status<500?e.message:'The live leaderboard is not reachable from here.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load,account.wallet]);
 const localPoints=Object.values(progress.missions).reduce((n,b)=>n+(b?.score??0),0),localCleared=entries.filter(e=>!!progress.missions[e.key]).length;
 const personal=data?.personal??null,rows=data?.board??[],guest=!account.wallet||account.preview;
 const points=personal?personal.score:localPoints,cleared=personal?personal.cleared:localCleared;
 const hint=loading&&!data?'Fetching verified scores…':guest?'Connect a wallet and clear a level to be listed.':error?error:personal?`${data?.participants??0} couriers ranked · best verified run per level`:'Clear a level with your wallet connected to join the board.';
 const name=(p:CampaignRank)=>p.wallet===account.wallet?'You':shortWallet(p.wallet);
 return <View style={s.root} testID="campaign-leaderboard">
  <View style={s.heading}><View style={{flex:1,gap:3}}><Text accessibilityRole="header" style={s.title}>Leaderboard</Text><Text style={s.subtitle}>TOTAL POINTS · SPEED AND HEALTH COUNT ON EVERY LEVEL</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Refresh leaderboard" onPress={()=>void load()} style={s.refresh}><Text style={s.refreshText}>{loading?'…':'↻'}</Text></Pressable></View>
  <ScrollView style={{flex:1}} contentContainerStyle={{gap:8,paddingBottom:12}} showsVerticalScrollIndicator={false}>
   <View style={s.position} testID="campaign-your-position">
    <LeagueSurface/>
    <View style={s.positionTop}>
     <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6} style={s.positionRank}>{personal?`#${personal.rank}`:'—'}</Text>
     <View style={s.positionIdentity}><Text style={s.positionLabel}>{guest?'This device':'Your position'}</Text><Text style={s.progress}>{cleared} / {entries.length} levels</Text></View>
     <View style={s.scoreCell}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6} style={s.positionPoints}>{points.toLocaleString()}</Text><Text style={s.pointsLabel}>POINTS</Text></View>
    </View>
    <View style={s.hintRow}><Text style={s.positionHint} numberOfLines={2}>{hint}</Text><Pressable accessibilityRole="button" accessibilityLabel="Share your level card" onPress={onShare} style={s.share}><Text style={s.shareText}>Share ↗</Text></Pressable></View>
   </View>
   <View style={s.tableHeader}><Text accessibilityRole="header" style={s.tableTitle}>Top couriers</Text>{!guest&&<Pressable accessibilityRole="button" accessibilityLabel="Open verified rewards" onPress={onRewards}><Text style={s.link}>Rewards ↗</Text></Pressable>}</View>
   <View style={s.rows}>{rows.map(p=>{const yours=p.wallet===account.wallet,medal=p.rank<=3;return <View key={p.wallet} style={[s.row,p.rank===1&&s.goldRow,yours&&s.yourRow]} testID="campaign-ranking-row">
    <LeagueSurface kind={yours?'mint':p.rank===1?'gold':'row'}/>
    <View style={s.rankCell}>{medal&&<RankMedal rank={p.rank}/>}<Text numberOfLines={1} adjustsFontSizeToFit style={[s.rowRank,!medal&&{textAlign:'center'},p.rank===1&&{color:'#EEC875'},yours&&{color:'#C1F4E0'}]}>#{p.rank}</Text></View>
    <Image accessible={false} source={portrait} style={s.avatar}/>
    <View style={s.nameCell}><Text style={[s.name,yours&&{color:'#BAEDDC'}]} numberOfLines={1}>{name(p)}</Text><Text style={s.rowDetail}>{p.cleared} {p.cleared===1?'level':'levels'} · {p.clean} clean</Text></View>
    <View style={s.rowScore}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={s.points}>{p.score.toLocaleString()}</Text><Text style={s.rowPointsLabel}>POINTS</Text></View>
   </View>;})}</View>
   {!rows.length&&<View style={s.empty} testID="campaign-board-empty"><LeagueSurface kind="row"/><Image accessible={false} source={portrait} style={s.emptyAvatar}/><Text style={s.emptyTitle}>{loading?'Loading the board…':error?'Leaderboard unavailable':'The board is open.'}</Text><Text style={s.emptyText}>{error?error:'The first verified clear takes the top spot.'}</Text></View>}
  </ScrollView>
 </View>;
}
const s=StyleSheet.create({
 root:{flex:1,minHeight:0,gap:8},heading:{flexDirection:'row',alignItems:'center',gap:8,minHeight:50},title:{fontSize:26,lineHeight:30,fontWeight:'900',color:'#F4F3E9',letterSpacing:-.6},subtitle:{fontSize:8,lineHeight:11,letterSpacing:.8,fontWeight:'700',color:'#8FAD9D'},
 refresh:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:20,borderWidth:1,borderColor:'#36524A'},refreshText:{color:'#CDEBD9',fontSize:18},
 position:{borderRadius:16,overflow:'hidden',padding:14,gap:10},positionTop:{flexDirection:'row',alignItems:'center',gap:12},positionRank:{width:78,fontSize:34,lineHeight:38,fontWeight:'900',color:'#0E2A24'},positionIdentity:{flex:1,gap:3},positionLabel:{fontSize:10,letterSpacing:1.4,fontWeight:'800',color:'#235047'},progress:{fontSize:13,fontWeight:'700',color:'#0E2A24'},
 scoreCell:{alignItems:'flex-end'},positionPoints:{fontSize:24,lineHeight:28,fontWeight:'900',color:'#0E2A24'},pointsLabel:{fontSize:8,letterSpacing:1.4,fontWeight:'800',color:'#235047'},
 hintRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},positionHint:{flex:1,fontSize:11,lineHeight:15,color:'#1F4A40'},share:{minHeight:34,paddingHorizontal:12,justifyContent:'center',borderRadius:17,backgroundColor:'#0E2A24'},shareText:{color:'#CDEBD9',fontSize:11,fontWeight:'800'},
 tableHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:30,paddingHorizontal:2},tableTitle:{fontSize:13,fontWeight:'800',color:'#DDF0E8',letterSpacing:.3},link:{fontSize:11,fontWeight:'800',color:'#9FD6C2'},
 rows:{gap:6},row:{flexDirection:'row',alignItems:'center',gap:10,minHeight:58,paddingHorizontal:10,borderRadius:13,overflow:'hidden'},goldRow:{},yourRow:{},
 rankCell:{width:48,flexDirection:'row',alignItems:'center',gap:4},rowRank:{flex:1,fontSize:15,fontWeight:'900',color:'#DDEDE6'},avatar:{width:34,height:34,borderRadius:17},
 nameCell:{flex:1,gap:2},name:{fontSize:14,fontWeight:'800',color:'#E8F3EE'},rowDetail:{fontSize:10,color:'#8FAD9D'},rowScore:{alignItems:'flex-end'},points:{fontSize:16,fontWeight:'900',color:'#E8F3EE'},rowPointsLabel:{fontSize:7,letterSpacing:1.2,fontWeight:'800',color:'#8FAD9D'},
 empty:{borderRadius:14,overflow:'hidden',padding:18,alignItems:'center',gap:8},emptyAvatar:{width:52,height:52,borderRadius:26},emptyTitle:{fontSize:16,fontWeight:'800',color:'#E8F3EE'},emptyText:{fontSize:11,color:'#A9C3B8',textAlign:'center'},
});
