// campaign leaderboard: total points from each player's best verified run per level. wallet players with verified
// runs are listed; a browser guest sees the board and the total from this device, which is not ranked.
// compete with a friend: a wallet player picks one seeker id and sees both totals side by side above the board
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Image,Keyboard,KeyboardAvoidingView,Modal,Pressable as PlainPressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useAccount} from '../commerce/account-context';
import {campaignApi,readFriend,writeFriend,type Friend} from './client';
import {ApiError} from '../commerce/client';
import type {CampaignBoard as Board,CampaignPlayer,CampaignRank} from '../../shared/economy';
import {LeagueSurface,RankMedal} from '../league/LeagueVisuals';
import {leaderboardName} from '../../shared/wallet-name';
import type {Progress} from '../progress/model';
import type {CampaignEntry} from './levels';
const portrait=require('../../assets/leaderboard-v2/courier-avatar.png');
const bannerArt=require('../../assets/leaderboard-v2/compete-banner.webp');
const short=(wallet:string)=>`${wallet.slice(0,5)}…${wallet.slice(-5)}`;
const friendLabel=(f:{wallet:string;name:string|null})=>f.name??short(f.wallet);
type Pick=Friend&{standing?:CampaignRank|null};
type Props={entries:readonly CampaignEntry[];progress:Progress;onShare:()=>void;onRewards:()=>void};
export default function CampaignBoard({entries,progress,onShare,onRewards}:Props){
 const account=useAccount(),accountRef=useRef(account);accountRef.current=account;
 const [data,setData]=useState<Board>(),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [friend,setFriend]=useState<Friend|null>(null),[friendRow,setFriendRow]=useState<CampaignPlayer|null>(null),[duelFailed,setDuelFailed]=useState(false),[picking,setPicking]=useState(false),[gateNote,setGateNote]=useState('');
 // undefined: not looked up yet. null: the wallet has no verified run
 const [mine,setMine]=useState<CampaignRank|null>();
 const friendRef=useRef(friend);friendRef.current=friend;
 const namePolls=useRef(0);
 // both sides come from the server: the friend, and this wallet's public standing (a session is not needed)
 const loadFriend=useCallback(async(f:Friend|null)=>{
  if(!f){setFriendRow(null);return;}
  const a=accountRef.current,own=a.wallet&&!a.preview?a.wallet:undefined;
  try{
   const [them,me]=await Promise.all([campaignApi.players(f.wallet),own?campaignApi.players(own):Promise.resolve(undefined)]);
   if(friendRef.current?.wallet!==f.wallet)return;// a newer pick owns the card
   setFriendRow(them[0]??{...f,standing:null});if(me)setMine(me.find(p=>p.wallet===own)?.standing??null);setDuelFailed(false);
  }catch{if(friendRef.current?.wallet===f.wallet)setDuelFailed(true);}
 },[]);
 const load=useCallback(async(automatic=false)=>{
  if(!automatic){namePolls.current=0;void loadFriend(friendRef.current);}
  setLoading(true);setError('');
  try{let token:string|undefined;const a=accountRef.current;if(a.wallet&&!a.preview){try{token=(await a.session(false)).token;}catch{/* an anonymous board still loads */}}setData(await campaignApi.board(token));}
  catch(e){setError(e instanceof ApiError&&e.status<500?e.message:'The live leaderboard is not reachable from here.');}
  finally{setLoading(false);}
 },[loadFriend]);
 useEffect(()=>{setMine(undefined);},[account.wallet]);
 useEffect(()=>{void load();},[load,account.wallet]);
 useEffect(()=>{void readFriend().then(f=>{setFriend(f);void loadFriend(f);});},[loadFriend]);
 useEffect(()=>{if(!data?.namesPending||loading||namePolls.current>=10)return;const timer=setTimeout(()=>{namePolls.current++;void load(true);},3000);return()=>clearTimeout(timer);},[data,loading,load]);
 // a guest connects a wallet first, so their own side is a ranked score
 const compete=useCallback(async()=>{
  setGateNote('');
  if(!accountRef.current.wallet){try{await accountRef.current.connect();}catch{setGateNote('Connect a wallet to compete with a friend.');return;}}
  setPicking(true);
 },[]);
 // a row from the sheet carries the standing the server just returned; an unchanged pick keeps the card as it is
 const pick=useCallback((p:Pick|null)=>{
  setPicking(false);const f=p?{wallet:p.wallet,name:p.name}:null,same=!!f&&friendRef.current?.wallet===f.wallet;
  friendRef.current=f;setFriend(f);void writeFriend(f);
  if(p&&p.standing!==undefined)setFriendRow({...f!,standing:p.standing});else if(!same)setFriendRow(null);
  setDuelFailed(false);void loadFriend(f);
 },[loadFriend]);
 const closeSheet=useCallback(()=>setPicking(false),[]);
 const localPoints=Object.values(progress.missions).reduce((n,b)=>n+(b?.score??0),0),localCleared=entries.filter(e=>!!progress.missions[e.key]).length;
 const personal=data?.personal??null,rows=data?.board??[],guest=!account.wallet||account.preview;
 const points=personal?personal.score:localPoints,cleared=personal?personal.cleared:localCleared;
 const hint=loading&&!data?'Fetching verified scores…':guest?'Connect a wallet and clear a level to be listed.':error?error:personal?`${data?.participants??0} couriers ranked · best verified run per level`:'Clear a level with your wallet connected to join the board.';
 const name=(p:CampaignRank)=>leaderboardName(p,account.wallet);
 // a wallet's own side is its verified standing only; the browser playtest has no server identity, so it uses this device
 const me=account.preview?undefined:(personal??mine??null),myPoints=account.preview?localPoints:me?.score??0,myLevels=account.preview?localCleared:me?.cleared??0;
 const rival=friendRow?.standing??null,rivalName=friend?friendLabel(friendRow??friend):'',gap=myPoints-(rival?.score??0);
 const lead=!friendRow?(duelFailed?'Scores are not reachable right now. Tap refresh to try again.':'Loading scores…'):!rival?`${rivalName} has not cleared a verified level yet. Send them the game.`:gap>0?`You lead by ${gap.toLocaleString()} points.`:gap<0?`${rivalName} leads by ${(-gap).toLocaleString()} points.`:'You are tied on points.';
 const side=(label:string,levels:number,score:number,rank:number|undefined,you:boolean)=><View style={[s.duelSide,!you&&{alignItems:'flex-end'}]}>
  <Text style={[s.duelName,you&&{color:'#BAEDDC'}]} numberOfLines={1}>{label}</Text>
  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6} style={s.duelPoints}>{score.toLocaleString()}</Text>
  <Text style={s.duelDetail} numberOfLines={1}>{levels} {levels===1?'level':'levels'}{rank?` · #${rank}`:''}</Text>
 </View>;
 return <View style={s.root} testID="campaign-leaderboard">
  <View style={s.heading}><View style={{flex:1,gap:3}}><Text accessibilityRole="header" style={s.title}>Leaderboard</Text><Text style={s.subtitle}>TOTAL POINTS · SPEED AND HEALTH COUNT ON EVERY LEVEL</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Refresh leaderboard" onPress={()=>void load()} style={s.refresh}><Text style={s.refreshText}>{loading?'…':'↻'}</Text></Pressable></View>
  <ScrollView style={{flex:1}} contentContainerStyle={{gap:8,paddingBottom:12}} showsVerticalScrollIndicator={false}>
   <View style={s.position} testID="campaign-your-position">
    <LeagueSurface/>
    <View style={s.positionTop}>
     {personal&&<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6} style={s.positionRank}>#{personal.rank}</Text>}
     <View style={s.positionIdentity}><Text style={s.positionLabel}>{guest?'This device':'Your position'}</Text>{personal?.displayName&&<Text style={s.progress} numberOfLines={1}>{name(personal)}</Text>}<Text style={s.progress}>{cleared} / {entries.length} levels</Text></View>
     <View style={s.scoreCell}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6} style={s.positionPoints}>{points.toLocaleString()}</Text><Text style={s.pointsLabel}>POINTS</Text></View>
    </View>
    <View style={s.hintRow}><Text style={s.positionHint} numberOfLines={2}>{hint}</Text><Pressable accessibilityRole="button" accessibilityLabel="Share your level card" onPress={onShare} style={s.share}><Text style={s.shareText}>Share ↗</Text></Pressable></View>
   </View>
   {friend?<View style={s.duel} testID="compete-card">
    <LeagueSurface kind="row"/>
    <Text style={s.duelEyebrow}>HEAD TO HEAD</Text>
    <View style={s.duelSides}>{side('You',myLevels,myPoints,me?.rank,true)}<Text style={s.vs}>VS</Text>{side(rivalName,rival?.cleared??0,rival?.score??0,rival?.rank,false)}</View>
    <View style={s.hintRow}><Text style={s.positionHint} numberOfLines={2}>{lead}</Text><Pressable accessibilityRole="button" accessibilityLabel="Change the friend you compare with" onPress={()=>void compete()} style={s.share}><Text style={s.shareText}>Change</Text></Pressable></View>
   </View>:<Pressable accessibilityRole="button" accessibilityLabel="Compete with a friend" onPress={()=>void compete()} style={s.banner} testID="compete-banner">
    <View style={s.bannerArt}><Image accessible={false} source={bannerArt} style={s.bannerImage} resizeMode="cover"/></View>
    <View style={s.bannerBody}>
     <View style={{flex:1,gap:3}}><Text style={s.bannerTitle}>Compete with a friend</Text><Text style={s.bannerText}>{account.wallet?'Pick a Seeker ID and see who is ahead.':'Connect your wallet, pick a Seeker ID and see who is ahead.'}</Text></View>
     <View style={s.bannerCta}><Text style={s.bannerCtaText}>{account.wallet?'Pick a friend':'Connect'}</Text></View>
    </View>
   </Pressable>}
   {!!gateNote&&<Text style={s.gateNote} accessibilityLiveRegion="polite">{gateNote}</Text>}
   <View style={s.tableHeader}><Text accessibilityRole="header" style={s.tableTitle}>Top couriers</Text>{!guest&&<Pressable accessibilityRole="button" accessibilityLabel="Open verified rewards" onPress={onRewards}><Text style={s.link}>Rewards ↗</Text></Pressable>}</View>
   <View style={s.rows}>{rows.map(p=>{const yours=p.wallet===account.wallet,medal=p.rank<=3;return <View key={p.wallet} style={[s.row,p.rank===1&&s.goldRow,yours&&s.yourRow]} testID="campaign-ranking-row">
    <LeagueSurface kind={yours?'mint':p.rank===1?'gold':'row'}/>
    <View accessible accessibilityLabel={`Rank ${p.rank}`} style={s.rankCell}>{medal?<RankMedal rank={p.rank}/>:<Text numberOfLines={1} adjustsFontSizeToFit style={[s.rowRank,yours&&{color:'#C1F4E0'}]}>#{p.rank}</Text>}</View>
    <Image accessible={false} source={portrait} style={s.avatar}/>
    <View style={s.nameCell}><Text style={[s.name,yours&&{color:'#BAEDDC'}]} numberOfLines={1}>{name(p)}</Text><Text style={s.rowDetail}>{yours&&p.displayName?'You · ':''}{p.cleared} {p.cleared===1?'level':'levels'} · {p.clean} clean</Text></View>
    <View style={s.rowScore}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={s.points}>{p.score.toLocaleString()}</Text><Text style={s.rowPointsLabel}>POINTS</Text></View>
   </View>;})}</View>
   {!rows.length&&<View style={s.empty} testID="campaign-board-empty"><LeagueSurface kind="row"/><Image accessible={false} source={portrait} style={s.emptyAvatar}/><Text style={s.emptyTitle}>{loading?'Loading the board…':error?'Leaderboard unavailable':'The board is open.'}</Text><Text style={s.emptyText}>{error?error:'The first verified clear takes the top spot.'}</Text></View>}
  </ScrollView>
  <FriendSheet visible={picking} own={account.wallet} current={friend} onClose={closeSheet} onPick={pick}/>
 </View>;
}

// a contact-list sheet: the top players by default, .skr search or a pasted wallet, one tick at a time
function FriendSheet({visible,own,current,onClose,onPick}:{visible:boolean;own?:string;current:Friend|null;onClose:()=>void;onPick:(p:Pick|null)=>void}){
 const insets=useSafeAreaInsets();
 const [query,setQuery]=useState(''),[results,setResults]=useState<CampaignPlayer[]>([]),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false),[chosen,setChosen]=useState<Pick|null>(current);
 useEffect(()=>{if(visible){setChosen(current);setQuery('');}},[visible,current]);
 useEffect(()=>{
  if(!visible)return;
  let live=true;setBusy(true);
  const timer=setTimeout(()=>{campaignApi.players(query).then(r=>{if(live){setResults(r.filter(p=>p.wallet!==own));setFailed(false);}}).catch(()=>{if(live)setFailed(true);}).finally(()=>{if(live)setBusy(false);});},query.trim()?300:0);
  return()=>{live=false;clearTimeout(timer);};
 },[visible,query,own]);
 const note=failed?'Search is not reachable right now. Try again in a moment.':busy&&!results.length?'Searching…':!results.length?(query.trim()?`No Seeker ID starts with “${query.trim()}”.`:'No ranked players yet.'):'';
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
  {/* padding lifts the sheet above the keyboard; it measures its own frame, so a window that already resized is not lifted twice */}
  <KeyboardAvoidingView behavior="padding" style={s.sheetRoot}>
   <PlainPressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close friend picker"/>
   <View style={[s.sheet,{paddingBottom:12+insets.bottom}]} accessibilityViewIsModal testID="friend-sheet">
    <View style={s.handle}/>
    <Text accessibilityRole="header" style={s.sheetTitle}>Compete with a friend</Text>
    <Text style={s.sheetText}>Pick one Seeker ID. Their verified score sits next to yours.</Text>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search a .skr name or paste a wallet" placeholderTextColor="#6F8C80" autoCapitalize="none" autoCorrect={false} maxLength={64} style={s.search} accessibilityLabel="Search a .skr name or paste a wallet" testID="friend-search"/>
    <Text style={s.sheetSection}>{query.trim()?'SEEKER IDS':'TOP PLAYERS'}</Text>
    <ScrollView style={s.sheetList} contentContainerStyle={{gap:6}} keyboardShouldPersistTaps="handled">
     {results.map(p=>{const on=chosen?.wallet===p.wallet,label=friendLabel(p);return <Pressable key={`${p.wallet}:${p.name??''}`} accessibilityRole="radio" accessibilityState={{checked:on}} accessibilityLabel={label} onPress={()=>{Keyboard.dismiss();setChosen(on?null:p);}} style={[s.pickRow,on&&s.pickRowOn]} testID="friend-row">
      <Image accessible={false} source={portrait} style={s.avatar}/>
      <View style={s.nameCell}><Text style={s.name} numberOfLines={1}>{label}</Text><Text style={s.rowDetail} numberOfLines={1}>{p.standing?`#${p.standing.rank} · ${p.standing.cleared} ${p.standing.cleared===1?'level':'levels'} · ${p.standing.score.toLocaleString()} points`:'Has not played yet'}</Text></View>
      <View style={[s.tick,on&&s.tickOn]}>{on&&<Text style={s.tickMark}>✓</Text>}</View>
     </Pressable>;})}
     {!!note&&<Text style={s.sheetNote}>{note}</Text>}
    </ScrollView>
    <View style={s.sheetActions}>
     {current&&<Pressable accessibilityRole="button" onPress={()=>onPick(null)} style={s.sheetGhost}><Text style={s.sheetGhostText}>Stop comparing</Text></Pressable>}
     <Pressable accessibilityRole="button" accessibilityState={{disabled:!chosen}} disabled={!chosen} onPress={()=>{if(chosen)onPick(chosen);}} style={[s.sheetPrimary,!chosen&&{opacity:.4}]} testID="friend-compare"><Text style={s.sheetPrimaryText}>Compare</Text></Pressable>
    </View>
   </View>
  </KeyboardAvoidingView>
 </Modal>;
}
const s=StyleSheet.create({
 root:{flex:1,minHeight:0,gap:8},heading:{flexDirection:'row',alignItems:'center',gap:8,minHeight:50},title:{fontSize:26,lineHeight:30,fontWeight:'900',color:'#F4F3E9',letterSpacing:-.6},subtitle:{fontSize:8,lineHeight:11,letterSpacing:.8,fontWeight:'700',color:'#8FAD9D'},
 refresh:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:20,borderWidth:1,borderColor:'#36524A'},refreshText:{color:'#CDEBD9',fontSize:18},
 position:{borderRadius:16,overflow:'hidden',padding:14,gap:12,backgroundColor:'#142F28',borderWidth:1,borderColor:'#416A5D'},positionTop:{flexDirection:'row',alignItems:'center',gap:12},positionRank:{width:52,fontSize:32,lineHeight:38,fontWeight:'900',color:'#D4F8E8'},positionIdentity:{flex:1,minWidth:0,gap:5},positionLabel:{fontSize:11,letterSpacing:.6,fontWeight:'800',color:'#E8F6EE'},progress:{fontSize:13,fontWeight:'700',color:'#B5D4C6'},
 scoreCell:{alignItems:'flex-end'},positionPoints:{fontSize:26,lineHeight:30,fontWeight:'900',color:'#F4FFF8'},pointsLabel:{fontSize:8,letterSpacing:1.4,fontWeight:'800',color:'#B5D4C6'},
 hintRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,borderTopWidth:1,borderTopColor:'#426357',paddingTop:10},positionHint:{flex:1,fontSize:11,lineHeight:16,color:'#C5DED2'},share:{minHeight:34,paddingHorizontal:12,justifyContent:'center',borderRadius:17,backgroundColor:'#0E2A24'},shareText:{color:'#CDEBD9',fontSize:11,fontWeight:'800'},
 banner:{borderRadius:16,overflow:'hidden',backgroundColor:'#0E2621',borderWidth:1,borderColor:'#3F7A66'},bannerArt:{width:'100%',aspectRatio:3,overflow:'hidden'},bannerImage:{position:'absolute',top:0,left:0,width:'100%',height:'100%'},
 bannerBody:{flexDirection:'row',alignItems:'center',gap:12,padding:12},bannerTitle:{fontSize:16,fontWeight:'900',color:'#F4FFF8'},bannerText:{fontSize:11,lineHeight:15,color:'#B5D4C6'},
 bannerCta:{minHeight:36,paddingHorizontal:14,justifyContent:'center',borderRadius:18,backgroundColor:'#9FF0C8'},bannerCtaText:{fontSize:12,fontWeight:'900',color:'#0B1F18'},
 gateNote:{fontSize:11,color:'#F3C98B',paddingHorizontal:4},
 duel:{borderRadius:16,overflow:'hidden',padding:14,gap:10,borderWidth:1,borderColor:'#3F7A66'},duelEyebrow:{fontSize:9,letterSpacing:1.4,fontWeight:'800',color:'#9FD6C2'},
 duelSides:{flexDirection:'row',alignItems:'center',gap:8},duelSide:{flex:1,minWidth:0,gap:2},duelName:{fontSize:12,fontWeight:'800',color:'#E8F3EE'},duelPoints:{fontSize:22,lineHeight:26,fontWeight:'900',color:'#F4FFF8'},duelDetail:{fontSize:10,color:'#8FAD9D'},
 vs:{fontSize:12,fontWeight:'900',color:'#9FF0C8',letterSpacing:1},
 tableHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:30,paddingHorizontal:2},tableTitle:{fontSize:13,fontWeight:'800',color:'#DDF0E8',letterSpacing:.3},link:{fontSize:11,fontWeight:'800',color:'#9FD6C2'},
 rows:{gap:6},row:{flexDirection:'row',alignItems:'center',gap:10,minHeight:58,paddingHorizontal:10,borderRadius:13,overflow:'hidden'},goldRow:{},yourRow:{},
 rankCell:{width:36,alignItems:'center',justifyContent:'center'},rowRank:{width:'100%',textAlign:'center',fontSize:15,fontWeight:'900',color:'#DDEDE6'},avatar:{width:34,height:34,borderRadius:17},
 nameCell:{flex:1,gap:2},name:{fontSize:14,fontWeight:'800',color:'#E8F3EE'},rowDetail:{fontSize:10,color:'#8FAD9D'},rowScore:{alignItems:'flex-end'},points:{fontSize:16,fontWeight:'900',color:'#E8F3EE'},rowPointsLabel:{fontSize:7,letterSpacing:1.2,fontWeight:'800',color:'#8FAD9D'},
 empty:{borderRadius:14,overflow:'hidden',padding:18,alignItems:'center',gap:8},emptyAvatar:{width:52,height:52,borderRadius:26},emptyTitle:{fontSize:16,fontWeight:'800',color:'#E8F3EE'},emptyText:{fontSize:11,color:'#A9C3B8',textAlign:'center'},
 sheetRoot:{flex:1,justifyContent:'flex-end',backgroundColor:'#05080BA6'},
 sheet:{width:'100%',maxWidth:480,alignSelf:'center',maxHeight:'86%',flexShrink:1,backgroundColor:'#0F2520',borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,borderColor:'#36524A',paddingHorizontal:16,paddingTop:8,gap:10},
 handle:{alignSelf:'center',width:44,height:5,borderRadius:3,backgroundColor:'#3E5D53',marginBottom:4},
 sheetTitle:{fontSize:20,fontWeight:'900',color:'#F4F3E9'},sheetText:{fontSize:12,lineHeight:17,color:'#B5D4C6'},
 search:{minHeight:46,borderRadius:12,borderWidth:1,borderColor:'#416A5D',backgroundColor:'#0B1C18',paddingHorizontal:14,fontSize:14,color:'#F4FFF8'},
 sheetSection:{fontSize:9,letterSpacing:1.4,fontWeight:'800',color:'#8FAD9D',marginTop:2},sheetList:{flexGrow:0,flexShrink:1},
 pickRow:{flexDirection:'row',alignItems:'center',gap:10,minHeight:56,paddingHorizontal:10,borderRadius:12,backgroundColor:'#132E28',borderWidth:1,borderColor:'#132E28'},pickRowOn:{borderColor:'#9FF0C8',backgroundColor:'#163A31'},
 tick:{width:26,height:26,borderRadius:13,borderWidth:2,borderColor:'#4E7366',alignItems:'center',justifyContent:'center'},tickOn:{backgroundColor:'#9FF0C8',borderColor:'#9FF0C8'},tickMark:{fontSize:14,fontWeight:'900',color:'#0B1F18'},
 sheetNote:{fontSize:12,color:'#A9C3B8',textAlign:'center',paddingVertical:16},
 sheetActions:{flexDirection:'row',gap:8,paddingTop:4},sheetGhost:{flex:1,minHeight:48,borderRadius:24,borderWidth:1,borderColor:'#416A5D',alignItems:'center',justifyContent:'center'},sheetGhostText:{fontSize:13,fontWeight:'800',color:'#CDEBD9'},
 sheetPrimary:{flex:1,minHeight:48,borderRadius:24,backgroundColor:'#9FF0C8',alignItems:'center',justifyContent:'center'},sheetPrimaryText:{fontSize:14,fontWeight:'900',color:'#0B1F18'},
});
