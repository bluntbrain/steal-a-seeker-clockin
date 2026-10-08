// Static artwork and mission nodes share the same continuous Bezier road.
// FlatList keeps GPU surfaces and decoded images bounded while scrolling.
import {useHaptics} from '../feedback/useHaptics';
import React,{useCallback,useMemo} from 'react';
import {ActivityIndicator,FlatList,Image,Pressable,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeOut} from 'react-native-reanimated';
import {levelDownload} from '../campaign/client';
import {entryUnlocked,padLevel,type CampaignEntry} from '../campaign/levels';
import type {Progress} from '../progress/model';
import {BOSS_NAMES} from '../../shared/campaign-levels';
import {bossPortrait} from './costumeAssets';
import {campaignMapLayout,type MapScene} from './campaignMapLayout';

const NODE=40,BOSS_NODE=52;
const art={
 'first-pickup':require('../../assets/campaign-world-v4/first-pickup.webp'),
 'seeker-square':require('../../assets/campaign-world-v4/seeker-square.webp'),
 'validator-yard':require('../../assets/campaign-world-v4/validator-yard.webp'),
 'seed-vault':require('../../assets/campaign-world-v4/seed-vault.webp'),
 'relay-raid':require('../../assets/campaign-world-v4/relay-raid.webp'),
 'phone-flight':require('../../assets/campaign-world-v4/phone-flight.webp'),
 'meme-market':require('../../assets/campaign-world-v4/meme-market.webp'),
 'orbital-escape':require('../../assets/campaign-world-v4/orbital-escape.webp'),
 'portal-pursuit':require('../../assets/campaign-world-v4/portal-pursuit.webp'),
 'last-hideout':require('../../assets/campaign-world-v4/last-hideout.webp')
};
export default function CampaignMap({entries,progress,current,onSelect}:{entries:readonly CampaignEntry[];progress:Progress;current:CampaignEntry;onSelect:(entry:CampaignEntry)=>void}){
 const haptic=useHaptics();
 // a first install downloads every mission behind a loader; it never blocks the map for more than 12 seconds
 const download=React.useSyncExternalStore(levelDownload.subscribe,levelDownload.get),[waited,setWaited]=React.useState(false);
 React.useEffect(()=>{if(!download.active)return;const timer=setTimeout(()=>setWaited(true),12000);return()=>clearTimeout(timer);},[download.active]);
 const loadingMissions=download.active&&!waited;
 const [{width,height},setSize]=React.useState({width:0,height:0});
 const list=React.useRef<FlatList<MapScene>>(null),positioned=React.useRef('');
 // the list runs from level 1 upward (inverted, so it still reads bottom to top). downloaded levels append above the
 // highest scene, so nothing already on screen moves or remounts while the 1,000 levels arrive in pages
 const scenes=useMemo(()=>campaignMapLayout(entries,width).scenes.slice().reverse(),[entries,width]);
 const sceneHeight=scenes[0]?.height??0;
 const currentScene=Math.max(0,scenes.findIndex(s=>s.nodes.some(n=>n.entry.key===current.key)));
 const position=useCallback(()=>{
  const key=`${width}:${current.key}`;
  if(!width||!height||positioned.current===key)return;
  const scene=scenes[currentScene],node=scene?.nodes.find(n=>n.entry.key===current.key);
  // offsets count from the bottom: keep the current level 35% up from the bottom edge, as before
  if(scene&&node&&list.current){list.current.scrollToOffset({offset:Math.max(0,currentScene*sceneHeight+scene.height-node.y-height*.35),animated:false});positioned.current=key;}
 },[width,height,scenes,sceneHeight,currentScene,current.key]);
 const getItemLayout=useCallback((_:unknown,index:number)=>({length:sceneHeight,offset:sceneHeight*index,index}),[sceneHeight]);
 const render=useCallback(({item}:{item:MapScene})=>{
  return <View style={{height:item.height,overflow:'hidden'}}>
   <Image accessible={false} source={art[item.world]} resizeMode="contain" style={{position:'absolute',left:0,top:0,width,height:item.imageHeight}}/>
   {item.nodes.map(({entry,index,x,y})=>{
    const open=entryUnlocked(progress,entries,index)&&entry.playable,best=progress.missions[entry.key],isCurrent=entry.key===current.key,boss=entry.boss,size=boss?BOSS_NODE:NODE;
    return <Pressable key={entry.key} testID={`mission-node-${entry.number}`} accessibilityRole="button" accessibilityLabel={`Level ${entry.number}: ${boss?`${BOSS_NAMES[boss]} boss fight`:entry.title}${open?'':'. Locked'}`} accessibilityState={{selected:isCurrent}} onPress={()=>{haptic(open?'select':'error');onSelect(entry);}} style={({pressed})=>[s.target,{left:x-30,top:y-size/2-4,opacity:pressed?.7:1}]}>
     <View style={[s.node,{width:size,height:size,borderRadius:size/2},open&&s.open,isCurrent&&s.current,boss&&s.bossNode]}>
      {boss?<Image accessible={false} source={bossPortrait(boss)} resizeMode="cover" style={{width:size-6,height:size-6,borderRadius:size/2,transform:[{translateY:3}]}}/>:<Text maxFontSizeMultiplier={1.15} style={[s.number,isCurrent&&{color:'#142F28'},!open&&{color:'#BED3C9'}]}>{padLevel(entry.number)}</Text>}
     </View>
     {boss&&<Text maxFontSizeMultiplier={1} style={s.bossLabel}>{BOSS_NAMES[boss].toUpperCase()}</Text>}
     {best?<Text maxFontSizeMultiplier={1} style={s.stars}>{'★'.repeat(best.stars)}<Text style={{color:'#65736C'}}>{'★'.repeat(3-best.stars)}</Text></Text>:isCurrent?<Text maxFontSizeMultiplier={1} style={s.play}>PLAY</Text>:!open?<View style={s.lock}><View style={s.shackle}/><View style={s.lockBody}/></View>:null}
    </Pressable>;
   })}
  </View>;
 },[width,progress,entries,current.key,haptic,onSelect]);
 const extra=useMemo(()=>({progress,width,current:current.key}),[progress,width,current.key]);
 return <View testID="mission-districts" style={s.list} onLayout={e=>{const {width:w,height:h}=e.nativeEvent.layout;setSize(old=>old.width===w&&old.height===h?old:{width:w,height:h});}}>
  {width>0&&<FlatList key={String(width)} inverted ref={list} data={scenes} extraData={extra} renderItem={render} keyExtractor={r=>r.key} getItemLayout={getItemLayout} initialScrollIndex={currentScene} initialNumToRender={2} windowSize={5} maxToRenderPerBatch={3} showsVerticalScrollIndicator={false} onContentSizeChange={position} onScrollToIndexFailed={position}/>}
  {loadingMissions&&<Animated.View exiting={FadeOut.duration(220)} testID="missions-loading" accessibilityLiveRegion="polite" style={s.loader}>
   <ActivityIndicator color="#9FF0C8" size="large"/>
   <Text style={s.loaderTitle}>Loading missions</Text>
   <View style={s.loaderTrack}><View style={[s.loaderFill,{width:`${Math.round(Math.max(.06,download.progress)*100)}%`}]}/></View>
  </Animated.View>}
 </View>;
}
const s=StyleSheet.create({
 list:{flex:1,minHeight:0,overflow:'hidden',backgroundColor:'#16352F'},
 loader:{...StyleSheet.absoluteFillObject,backgroundColor:'#16352F',alignItems:'center',justifyContent:'center',gap:14},loaderTitle:{fontSize:15,fontWeight:'800',letterSpacing:.4,color:'#E8F6EE'},
 loaderTrack:{width:180,height:6,borderRadius:3,backgroundColor:'#0E2621',overflow:'hidden'},loaderFill:{height:6,borderRadius:3,backgroundColor:'#9FF0C8'},
 target:{position:'absolute',width:60,alignItems:'center',paddingTop:4},
 node:{borderWidth:2,borderColor:'#A0BCAF',backgroundColor:'#18342E',alignItems:'center',justifyContent:'center',overflow:'hidden'},
 open:{borderColor:'#B7E5D4',backgroundColor:'#19352F',shadowColor:'#9BE8CE',shadowRadius:7,shadowOpacity:.55,shadowOffset:{width:0,height:0}},
 current:{backgroundColor:'#D7F3E5',borderColor:'#F0FFF6',shadowOpacity:.7,shadowRadius:11},
 bossNode:{borderColor:'#E58A7A',borderWidth:3,backgroundColor:'#2A1714',shadowColor:'#FF8C73'},
 bossLabel:{fontSize:8,lineHeight:10,fontWeight:'800',letterSpacing:1.6,color:'#FFD4C6',marginTop:3,backgroundColor:'#1C211EF2',paddingHorizontal:6,borderRadius:4},
 number:{fontSize:14,lineHeight:18,fontWeight:'800',color:'#EDFFF6'},
 stars:{fontSize:9,lineHeight:11,letterSpacing:1,color:'#D2F1DF',marginTop:2,textShadowColor:'#07100C',textShadowRadius:3,textShadowOffset:{width:0,height:1}},
 play:{fontSize:7,lineHeight:10,fontWeight:'800',letterSpacing:1.4,color:'#D2F1DF',marginTop:2,backgroundColor:'#0B2D24',paddingHorizontal:6,borderRadius:4},
 lock:{alignItems:'center',marginTop:2},shackle:{width:7,height:5,borderWidth:1.3,borderBottomWidth:0,borderColor:'#ADBAB2',borderTopLeftRadius:4,borderTopRightRadius:4},lockBody:{width:10,height:6,borderRadius:1.5,backgroundColor:'#ADBAB2'},
});
