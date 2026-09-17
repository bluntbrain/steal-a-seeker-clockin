import {useEconomy} from '../commerce/EconomyProvider';
import HideoutStore from './HideoutStore';
import CreditBalance from './CreditBalance';
import {combatLevel} from '../game/combat-levels';
import {IS_MAINNET} from '../wallet/config';
import {environmentFor} from '../game/environment';
import React,{useEffect,useState} from 'react';
import {Image,Modal,Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAccount} from '../commerce/account-context';
import {CAMPAIGN_IDS,getLevel,type MissionId} from '../game/level';
import {PHONE_EDITIONS,editionIndex,phoneEdition} from '../game/collection';
import {unlocked,type Progress} from '../progress/model';
import CourierArt from './CourierArt';
import BottomTabs from './BottomTabs';
import CampaignDistricts from './CampaignDistricts';
import MissionBriefing from './MissionBriefing';
import WeeklyBoard,{useWeekly} from '../ranked/WeeklyBoard';
import PhoneInspector from './PhoneInspector';
import PhoneArt from './PhoneArt';import HideoutBalance from './HideoutBalance';
type Props={onContractStart:(ticket:import('../../shared/ranked').RunTicket)=>void;initialTab?:'map'|'leaderboard'|'rack';visible:boolean;onClose:()=>void;onStart:(id:MissionId)=>void;onShop:()=>void;onSync:()=>void;onDaily:()=>void;onPaid:()=>void;onSettings:()=>void;progress:Progress;syncStatus:string};
export default function Hideout({onContractStart,initialTab='map',visible,onClose,onStart,onShop,onSync,onDaily,onPaid,onSettings,progress,syncStatus}:Props){
 const economy=useEconomy();
 const judge=process.env.EXPO_PUBLIC_JUDGE_PREVIEW==='1';
 const {account,preview}=useAccount(),equipment=account?.equipment??{},themed=equipment.rack==='rack-theme',framed=equipment.frame==='profile-frame';
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets(),usable=height-insets.top-insets.bottom,w=Math.min(width-24,430),roomH=Math.max(150,Math.min(500,usable-400)),roomW=Math.min(w,roomH*2/3);
 const completed=CAMPAIGN_IDS.filter(id=>!!progress.missions[id]).length,next=CAMPAIGN_IDS.find(id=>!progress.missions[id])??CAMPAIGN_IDS[11]!;
 const [weeklyDetail,setWeeklyDetail]=useState(false);
 const [inspection,setInspection]=useState<number|null>(null);
 const rackPhoneHeight=Math.max(12,Math.min(68,((roomW*.59-18)/4-8)*388/212,((roomH*.48-18)*.88/3-8)));
 const weekly=useWeekly(visible);
 const [tab,setTab]=useState<'rack'|'map'|'leaderboard'|'briefing'|'complete'>(initialTab),[selected,setSelected]=useState<MissionId>('practice');
 useEffect(()=>{if(visible){setSelected(next);setInspection(null);}},[visible,completed]);
 const level=combatLevel(selected),edition=phoneEdition(selected),best=progress.missions[selected],available=unlocked(progress,selected);
 const action=(label:string,name:string,onPress:()=>void,primary=false,disabled=false,fluid=false)=><Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} disabled={disabled} style={[s.button,fluid&&{flexGrow:1,flexBasis:0,minWidth:0},primary&&s.primary,disabled&&{opacity:.4}]}><Text style={[s.buttonText,primary&&{color:'#173739'}]}>{label}</Text></Pressable>;
 return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}><View style={[s.overlay,{paddingTop:insets.top+8,paddingBottom:insets.bottom+8}]}><View style={{width:w,flex:1,maxHeight:980}}>
 {tab==='map'&&<View style={s.mapHeader}>
  <View style={[s.mapTopline,usable<700&&{height:32}]}><Text style={s.mapBrand}>STEAL A SEEKER</Text><View style={s.mapTools}><CreditBalance compact/><Text accessibilityLabel={`${Object.values(progress.missions).reduce((n,b)=>n+(b?.stars??0),0)} of 36 stars`} style={s.mapStars}>★ {Object.values(progress.missions).reduce((n,b)=>n+(b?.stars??0),0)}<Text style={{color:'#6F8780'}}> / 36</Text></Text><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={s.mapSettings}><Text style={{color:'#B6D2C7',fontSize:20}}>⚙</Text></Pressable></View></View>
  <View style={[s.mapHeading,usable<700&&{height:43}]}><View style={{gap:3}}><Text style={s.mapEyebrow}>CAMPAIGN</Text><Text accessibilityRole="header" style={s.mapTitle}>DISTRICT MAP</Text></View><Text style={s.mapCompletion}>{String(completed).padStart(2,'0')}<Text style={{color:'#668278'}}> / 12</Text></Text></View>
 </View>}
 {tab==='leaderboard'&&<View style={{height:34,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:4}}><Text style={{fontSize:11,fontWeight:'800',letterSpacing:2,color:'#BDD6CC'}}>STEAL A SEEKER</Text><CreditBalance compact/><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={{height:34,width:36,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:20,color:'#93B0A4'}}>⚙</Text></Pressable></View>}
 {tab==='rack'&&<View style={{height:53,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><Text style={{fontSize:25,color:'#D5EDE0',fontWeight:'900',letterSpacing:2}}>HIDEOUT</Text><CreditBalance/></View>}
 {(tab==='briefing'||tab==='complete')&&<View style={{alignItems:'flex-end',height:38}}><CreditBalance compact/></View>}
 {tab==='leaderboard'?<WeeklyBoard onDetailChange={setWeeklyDetail} showStandings={initialTab==='leaderboard'} state={weekly} onStart={onContractStart}/>:tab==='complete'?<View testID="campaign-complete" style={{flex:1,justifyContent:'center',alignItems:'center',gap:16}}><Image source={require('../../assets/messages/success.png')} style={{width:Math.min(w*.7,210),height:Math.min(w*.7,210),borderRadius:24}}/><Text style={[s.title,{fontSize:28,textAlign:'center'}]}>Twelve phones. One courier.</Text><Text style={[s.small,{textAlign:'center'}]}>You cleared every heist across all three districts.{'\n'}{Object.values(progress.missions).reduce((n,b)=>n+(b?.stars??0),0)} / 36 stars earned. Your collection stays here.</Text>{action('VIEW YOUR COLLECTION ↗','View completed collection',()=>setTab('rack'),true)}{action('CLIMB THE WEEKLY BOARD','Open weekly leaderboard after campaign',()=>setTab('leaderboard'))}{action('IMPROVE YOUR STARS','Replay completed missions',()=>setTab('map'))}</View>:tab==='rack'?<HideoutStore progress={progress} onInspect={setInspection} ghostEarned={!!weekly.data?.earned} onEquipGhost={async()=>{await weekly.equip();await economy.syncGhost();}} onOpenWeekly={()=>setTab('leaderboard')}/>:tab==='map'?<View style={{flex:1,minHeight:0}}><CampaignDistricts progress={progress} onSelect={id=>{setSelected(id);setTab('briefing');}}/>
 <Pressable accessibilityRole="button" accessibilityLabel={completed===12?'View campaign ending':`Continue · ${combatLevel(next).title}`} onPress={()=>completed===12?setTab('complete'):onStart(next)} style={({pressed})=>[s.mapContinue,usable<700&&{height:46},pressed&&{opacity:.75}]}>
  <View style={s.passMark}><Text style={{fontSize:23,color:'#B8E3D0'}}>◈</Text></View><View style={{flex:1,gap:3}}><Text style={s.continueEyebrow}>{completed===12?'ALL PHONES RECOVERED':'FREE CAMPAIGN'}</Text><Text numberOfLines={1} style={s.continueTitle}>{completed===12?'View your collection':`${String(combatLevel(next).number).padStart(2,'0')} · ${combatLevel(next).title}`}</Text></View><Text style={s.continueArrow}>→</Text>
 </Pressable></View>:<MissionBriefing mission={selected} available={available} onBack={()=>setTab('map')} onPlay={()=>onStart(selected)}/>}
 {tab==='rack'&&!!syncStatus&&<Pressable accessibilityRole="button" accessibilityLabel="Sync progress" onPress={onSync}><Text numberOfLines={1} style={s.small}>{syncStatus} · Retry sync ↻</Text></Pressable>}
 <BottomTabs compact={usable<760&&(tab==='map'||tab==='briefing'||tab==='leaderboard')} selected={tab==='leaderboard'?'leaderboard':tab==='rack'||tab==='complete'?'rack':'map'} onChange={nextTab=>{if(nextTab!==tab){setWeeklyDetail(false);setTab(nextTab);economy.setTab(nextTab);}}}/>

 </View>{inspection!==null&&<PhoneInspector index={inspection} recovered={!!progress.missions[CAMPAIGN_IDS[inspection]!]} onClose={()=>setInspection(null)}/>}</View></Modal>;
}
const s=StyleSheet.create({
 mapHeader:{flexShrink:0},mapTopline:{height:39,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:'#2A3634'},mapBrand:{fontSize:13,fontWeight:'800',letterSpacing:1.5,color:'#EDF3EF'},mapTools:{flexDirection:'row',alignItems:'center',gap:3},mapStars:{fontSize:10,fontWeight:'700',color:'#C9E7D8'},mapSettings:{width:36,height:36,alignItems:'center',justifyContent:'center'},mapHeading:{height:57,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},mapEyebrow:{fontSize:9,lineHeight:12,letterSpacing:2.3,fontWeight:'700',color:'#A5C9BA'},mapTitle:{fontSize:22,lineHeight:26,fontWeight:'800',letterSpacing:2.4,color:'#F0F5F0'},mapCompletion:{fontSize:11,color:'#C7E2D4',fontWeight:'700'},
 mapContinue:{height:53,flexShrink:0,marginTop:5,borderWidth:1,borderColor:'#385249',borderRadius:10,backgroundColor:'#101917',flexDirection:'row',alignItems:'center',paddingHorizontal:12,gap:10},passMark:{width:24,alignItems:'center'},continueEyebrow:{fontSize:8,lineHeight:11,letterSpacing:1.4,color:'#94B6A7',fontWeight:'700'},continueTitle:{fontSize:12,lineHeight:15,fontWeight:'800',color:'#D9F1E4'},continueArrow:{fontSize:24,color:'#CDEBD9'},
 overlay:{flex:1,backgroundColor:'#0C0C0E',alignItems:'center',paddingHorizontal:12},header:{height:50,flexShrink:0,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{fontSize:13,fontWeight:'800',color:'#F6F6F5',letterSpacing:.8},small:{fontSize:10,lineHeight:15,color:'#A7BCC1'},navigation:{flexShrink:0,minHeight:46,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:6},screenTitle:{fontSize:27,lineHeight:32,fontWeight:'800',color:'#F1F6EF'},button:{flexGrow:0,minHeight:42,paddingHorizontal:10,paddingVertical:11,backgroundColor:'#202B32',borderRadius:12,alignItems:'center',justifyContent:'center'},primary:{backgroundColor:'#CFE6E4'},buttonText:{fontSize:10,fontWeight:'800',color:'#CFE6E4',textAlign:'center',letterSpacing:.2},rack:{position:'absolute',borderRadius:13,borderWidth:3,padding:6,shadowColor:'#000',shadowOffset:{width:0,height:7},shadowOpacity:.8,shadowRadius:4},slot:{flex:1,borderWidth:1,borderRadius:6,alignItems:'center',justifyContent:'center',overflow:'hidden'},title:{fontSize:18,fontWeight:'800',color:'#F1F6EF'},collectionDetail:{flexDirection:'row',gap:12,alignItems:'center',backgroundColor:'#141C22',borderWidth:1,borderColor:'#334149',borderRadius:14,paddingHorizontal:14,paddingVertical:5},shortcuts:{height:44,flexShrink:0,flexDirection:'row',gap:6},eyebrow:{fontSize:9,fontWeight:'700',letterSpacing:1.5,color:'#AECFC8'},districtTitle:{color:'#DCECE4',fontSize:11,letterSpacing:1.7,fontWeight:'700',height:20},node:{position:'absolute',width:43,height:43,borderRadius:24,borderWidth:3,alignItems:'center',justifyContent:'center',shadowColor:'#93E2D5',shadowRadius:7,shadowOpacity:.3,shadowOffset:{width:0,height:0}}});
