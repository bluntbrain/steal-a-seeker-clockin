import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useEconomy} from '../commerce/EconomyProvider';
import HideoutStore from './HideoutStore';
import CreditBalance from './CreditBalance';
import BrandWordmark from './BrandWordmark';
import {IS_MAINNET} from '../wallet/config';
import React,{useCallback,useEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import {campaignEntries,entryOpen,firstOpenEntry,type CampaignEntry} from '../campaign/levels';
import {loadPublishedLevels,publishedLevels} from '../campaign/client';
import CompletionCard,{levelShareUrl} from '../campaign/CompletionCard';
import type {CourierCardData} from '../league/card';
import {Linking,Platform} from 'react-native';
import {Image,Modal,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAccount} from '../commerce/account-context';
import {homeShown} from '../commerce/pass-intro';
import {CAMPAIGN_IDS} from '../game/level';
import {PHONE_EDITIONS,editionIndex,phoneEdition} from '../game/collection';
import type {Progress} from '../progress/model';
import CourierArt from './CourierArt';
import BottomTabs from './BottomTabs';
import CampaignMap from './CampaignMap';
import MissionBriefing from './MissionBriefing';
import CampaignBoard from '../campaign/CampaignBoard';
import PhoneInspector from './PhoneInspector';
import PhoneArt from './PhoneArt';import HideoutBalance from './HideoutBalance';
type Props={initialTab?:'map'|'leaderboard'|'rack';mapRequest?:number;visible:boolean;onClose:()=>void;onStart:(entry:CampaignEntry)=>void;onShop:()=>void;onSync:()=>void;onRewards:()=>void;onSettings:()=>void;progress:Progress;syncStatus:string};
export default function Hideout({initialTab='map',mapRequest=0,visible,onClose,onStart,onShop,onSync,onRewards,onSettings,progress,syncStatus}:Props){
 const economy=useEconomy();
 const judge=process.env.EXPO_PUBLIC_JUDGE_PREVIEW==='1';
 const {account,preview}=useAccount(),equipment=account?.equipment??{},themed=equipment.rack==='rack-theme',framed=equipment.frame==='profile-frame';
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets(),usable=height-insets.top-insets.bottom,w=Math.min(width-24,430),roomH=Math.max(150,Math.min(500,usable-400)),roomW=Math.min(w,roomH*2/3);
 const published=useSyncExternalStore(publishedLevels.subscribe,publishedLevels.get),entries=useMemo(()=>campaignEntries(published),[published]);
 useEffect(()=>{if(visible)void loadPublishedLevels();},[visible]);
 const completed=entries.filter(e=>!!progress.missions[e.key]).length,next=firstOpenEntry(progress,entries),totalStars=Object.values(progress.missions).reduce((n,b)=>n+(b?.stars??0),0);
 const [shareOpen,setShareOpen]=useState(false),shareFn=useRef<(()=>Promise<void>)|null>(null),[shareReady,setShareReady]=useState(false),[shareSaved,setShareSaved]=useState(false);
 const shareData=useMemo<CourierCardData>(()=>({wallet:account?.wallet??'browser-playtest',local:Platform.OS==='web',outfit:equipment.outfit,frame:equipment.frame,campaign:{cleared:completed,stars:totalStars,score:Object.values(progress.missions).reduce((n,b)=>n+(b?.score??0),0),seconds:Object.values(progress.missions).reduce((n,b)=>n+(b?.seconds??0),0),level:next.number,total:entries.length}}),[account?.wallet,equipment.outfit,equipment.frame,completed,totalStars,progress.missions,next.number,entries.length]);
 const [inspection,setInspection]=useState<number|null>(null);
 const rackPhoneHeight=Math.max(12,Math.min(68,((roomW*.59-18)/4-8)*388/212,((roomH*.48-18)*.88/3-8)));
 const [tab,setTab]=useState<'rack'|'map'|'leaderboard'|'briefing'|'complete'>(initialTab),[selected,setSelected]=useState<CampaignEntry>(entries[0]!);
 // A run exit requests the district map without resetting ordinary Hideout navigation.
 useEffect(()=>{if(mapRequest>0){setTab('map');setInspection(null);}},[mapRequest]);
 // Returning from the teaching screen must keep the mission the player chose.
 useEffect(()=>{if(visible){if(tab!=='briefing')setSelected(next);setInspection(null);}},[visible,completed,next,tab]);
 const available=entryOpen(progress,entries,selected.number-1);
 const selectEntry=useCallback((entry:CampaignEntry)=>{setSelected(entry);setTab('briefing');},[]);
  const openShare=useCallback(()=>{setShareSaved(false);setShareOpen(true);},[]);
 const registerShare=useCallback((fn:(()=>Promise<void>)|null)=>{shareFn.current=fn;setShareReady(!!fn);},[]);
 const shareSaved_=useCallback(()=>setShareSaved(true),[]);
 const action=(label:string,name:string,onPress:()=>void,primary=false,disabled=false,fluid=false)=><Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} disabled={disabled} style={[s.button,fluid&&{flexGrow:1,flexBasis:0,minWidth:0},primary&&s.primary,disabled&&{opacity:.4}]}><Text style={[s.buttonText,primary&&{color:'#173739'}]}>{label}</Text></Pressable>;
 return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} onShow={homeShown}><View style={[s.overlay,(tab==='rack'||tab==='leaderboard')&&{backgroundColor:tab==='rack'?'#0B1612':'#0B1711'},{paddingTop:insets.top+8,paddingBottom:insets.bottom+8}]}><View style={{width:w,flex:1,maxHeight:980}}>
 {tab==='leaderboard'&&<View pointerEvents="none" style={{position:'absolute',width:500,height:540,top:-80,right:-110,opacity:.75}}><Image accessible={false} source={require('../../assets/leaderboard-v3/header-glow.webp')} resizeMode="stretch" style={{width:'100%',height:'100%'}}/></View>}
 {tab==='map'&&<View style={s.mapHeader}>
  <View style={s.mapTopline}><BrandWordmark/><View style={s.mapTools}><CreditBalance/><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={s.mapSettings}><Text style={{color:'#B6D2C7',fontSize:20}}>⚙</Text></Pressable></View></View>

 </View>}
 {tab==='leaderboard'&&<View style={{height:53,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:4}}><BrandWordmark/><View style={s.mapTools}><CreditBalance/><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={s.mapSettings}><Text style={{fontSize:20,color:'#93B0A4'}}>⚙</Text></Pressable></View></View>}
 {tab==='rack'&&<View style={{height:53,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><BrandWordmark accessibilityLabel="Hideout · Steal a Seeker"/><CreditBalance/></View>}
 {(tab==='briefing'||tab==='complete')&&<View style={{alignItems:'flex-end',height:46}}><CreditBalance/></View>}
 {tab==='leaderboard'?<CampaignBoard entries={entries} progress={progress} onShare={openShare} onRewards={onRewards}/>:tab==='complete'?<ScrollView testID="campaign-complete" style={{flex:1}} contentContainerStyle={{flexGrow:1,justifyContent:'center',alignItems:'center',gap:16,paddingVertical:8}}><Image source={require('../../assets/messages/success.webp')} style={{width:Math.min(w*.7,210,Math.max(120,usable*.3)),height:Math.min(w*.7,210,Math.max(120,usable*.3)),borderRadius:24}}/><Text style={[s.title,{fontSize:28,textAlign:'center'}]}>Every level. One courier.</Text><Text style={[s.small,{textAlign:'center'}]}>You cleared all {entries.length} levels on the map.{'\n'}{totalStars} / {entries.length*3} stars earned. Your collection stays here.</Text>{action('VIEW YOUR COLLECTION ↗','View completed collection',()=>setTab('rack'),true)}{action('SEE THE LEADERBOARD','Open the leaderboard',()=>setTab('leaderboard'))}{action('IMPROVE YOUR STARS','Replay completed missions',()=>setTab('map'))}</ScrollView>:tab==='rack'?<HideoutStore active={visible} progress={progress} onInspect={setInspection} hasPass={!!account?.entitlements.includes('campaign')}/>:tab==='map'?<View style={{flex:1,minHeight:0}}><CampaignMap entries={entries} progress={progress} current={next} onSelect={selectEntry}/>
 </View>:<MissionBriefing entry={selected} available={available} onBack={()=>setTab('map')} onPlay={()=>onStart(selected)}/>}
 {tab==='rack'&&!!syncStatus&&<Pressable accessibilityRole="button" accessibilityLabel="Sync progress" onPress={onSync}><Text numberOfLines={1} style={s.small}>{syncStatus} · Retry sync ↻</Text></Pressable>}
 <BottomTabs compact={usable<760&&(tab==='map'||tab==='briefing'||tab==='leaderboard')} selected={tab==='leaderboard'?'leaderboard':tab==='rack'||tab==='complete'?'rack':'map'} onChange={nextTab=>{if(nextTab!==tab){setTab(nextTab);economy.setTab(nextTab);}}}/>

 </View>{shareOpen&&<View testID="level-share" style={[StyleSheet.absoluteFill,{backgroundColor:'#0C0C0EF2',alignItems:'center',justifyContent:'center',padding:16,gap:10}]}><Text style={s.mapEyebrow}>YOUR LEVEL CARD</Text><CompletionCard data={shareData} reduced registerShare={registerShare} onSaved={shareSaved_}/><View style={{flexDirection:'row',gap:8}}>{action(Platform.OS==='web'?'SAVE CARD':'SHARE CARD ↗','Share level card',()=>void shareFn.current?.(),true,!shareReady)}{shareSaved&&Platform.OS==='web'&&action('OPEN X ↗','Open X with your level post',()=>void Linking.openURL(levelShareUrl(shareData)))}{action('CLOSE','Close level card',()=>setShareOpen(false))}</View></View>}{inspection!==null&&<PhoneInspector index={inspection} recovered={!!progress.missions[CAMPAIGN_IDS[inspection]!]} onClose={()=>setInspection(null)}/>}</View></Modal>;
}
const s=StyleSheet.create({
 mapHeader:{flexShrink:0},mapTopline:{height:53,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:'#2A3634'},mapTools:{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:8},mapStars:{fontSize:10,fontWeight:'700',color:'#C9E7D8'},mapSettings:{width:36,height:36,alignItems:'center',justifyContent:'center'},mapHeading:{height:57,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},mapEyebrow:{fontSize:9,lineHeight:12,letterSpacing:2.3,fontWeight:'700',color:'#A5C9BA'},mapTitle:{fontSize:22,lineHeight:26,fontWeight:'800',letterSpacing:2.4,color:'#F0F5F0'},mapCompletion:{fontSize:11,color:'#C7E2D4',fontWeight:'700'},
 shareButton:{minHeight:36,paddingHorizontal:10,justifyContent:'center',borderRadius:8,borderWidth:1,borderColor:'#385249',backgroundColor:'#101917'},shareText:{fontSize:9,fontWeight:'800',letterSpacing:1.4,color:'#CDEBD9'},
 mapContinue:{height:53,flexShrink:0,marginTop:5,borderWidth:1,borderColor:'#385249',borderRadius:10,backgroundColor:'#101917',flexDirection:'row',alignItems:'center',paddingHorizontal:12,gap:10},passMark:{width:24,alignItems:'center'},continueEyebrow:{fontSize:8,lineHeight:11,letterSpacing:1.4,color:'#94B6A7',fontWeight:'700'},continueTitle:{fontSize:12,lineHeight:15,fontWeight:'800',color:'#D9F1E4'},continueArrow:{fontSize:24,color:'#CDEBD9'},
 overlay:{flex:1,backgroundColor:'#0C0C0E',alignItems:'center',paddingHorizontal:12},header:{height:50,flexShrink:0,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{fontSize:13,fontWeight:'800',color:'#F6F6F5',letterSpacing:.8},small:{fontSize:10,lineHeight:15,color:'#A7BCC1'},navigation:{flexShrink:0,minHeight:46,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:6},screenTitle:{fontSize:27,lineHeight:32,fontWeight:'800',color:'#F1F6EF'},button:{flexGrow:0,minHeight:42,paddingHorizontal:10,paddingVertical:11,backgroundColor:'#202B32',borderRadius:12,alignItems:'center',justifyContent:'center'},primary:{backgroundColor:'#CFE6E4'},buttonText:{fontSize:10,fontWeight:'800',color:'#CFE6E4',textAlign:'center',letterSpacing:.2},rack:{position:'absolute',borderRadius:13,borderWidth:3,padding:6,shadowColor:'#000',shadowOffset:{width:0,height:7},shadowOpacity:.8,shadowRadius:4},slot:{flex:1,borderWidth:1,borderRadius:6,alignItems:'center',justifyContent:'center',overflow:'hidden'},title:{fontSize:18,fontWeight:'800',color:'#F1F6EF'},collectionDetail:{flexDirection:'row',gap:12,alignItems:'center',backgroundColor:'#141C22',borderWidth:1,borderColor:'#334149',borderRadius:14,paddingHorizontal:14,paddingVertical:5},shortcuts:{height:44,flexShrink:0,flexDirection:'row',gap:6},eyebrow:{fontSize:9,fontWeight:'700',letterSpacing:1.5,color:'#AECFC8'},districtTitle:{color:'#DCECE4',fontSize:11,letterSpacing:1.7,fontWeight:'700',height:20},node:{position:'absolute',width:43,height:43,borderRadius:24,borderWidth:3,alignItems:'center',justifyContent:'center',shadowColor:'#93E2D5',shadowRadius:7,shadowOpacity:.3,shadowOffset:{width:0,height:0}}});
