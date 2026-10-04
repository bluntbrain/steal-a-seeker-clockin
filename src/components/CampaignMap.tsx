// Illustrated journey; virtualized rows share continuous district artwork and a legible route.
// the art is plain images: a skia canvas per row would put several gpu surfaces inside the scroll view and stutter on
// android. the crossfade into the zone above is baked into the top of each image at pack time (scripts/pack-world-art.mjs).
import {useHaptics} from '../feedback/useHaptics';
import React,{useCallback,useMemo} from 'react';
import {FlatList,Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {entryUnlocked,padLevel,type CampaignEntry} from '../campaign/levels';
import type {Progress} from '../progress/model';
import {BOSS_NAMES} from '../../shared/campaign-levels';
import {bossPortrait} from './costumeAssets';
import {campaignMapLayout,type MapScene} from './campaignMapLayout';

const NODE=40,BOSS_NODE=52;
const art={warehouse:require('../../assets/campaign-world-v2/warehouse.webp'),rooftops:require('../../assets/campaign-world-v2/rooftops.webp'),powerworks:require('../../assets/campaign-world-v2/powerworks.webp')};
export default function CampaignMap({entries,progress,current,onSelect}:{entries:readonly CampaignEntry[];progress:Progress;current:CampaignEntry;onSelect:(entry:CampaignEntry)=>void}){
 const haptic=useHaptics();
 const [{width,height},setSize]=React.useState({width:0,height:0});
 const list=React.useRef<FlatList<MapScene>>(null),positioned=React.useRef('');
 const {scenes}=useMemo(()=>campaignMapLayout(entries,width),[entries,width]);
 const currentScene=Math.max(0,scenes.findIndex(s=>s.nodes.some(n=>n.entry.key===current.key)));
 const position=useCallback(()=>{
  const key=`${width}:${entries.length}`;
  if(!width||!height||positioned.current===key)return;
  const scene=scenes[currentScene],node=scene?.nodes.find(n=>n.entry.key===current.key);
  if(scene&&node&&list.current){list.current.scrollToOffset({offset:Math.max(0,scene.offset+node.y-height*.65),animated:false});positioned.current=key;}
 },[width,height,entries.length,scenes,currentScene,current.key]);
 const getItemLayout=useCallback((_:unknown,index:number)=>({length:scenes[index]?.height??0,offset:scenes[index]?.offset??0,index}),[scenes]);
 const render=useCallback(({item}:{item:MapScene})=>{
  // the row above shows its bottom strip under this image's faded top, which keeps the road continuous
  return <View style={{height:item.height,overflow:'hidden'}}>
   {item.previousZone&&<Image accessible={false} source={art[item.previousZone]} resizeMode="contain" style={{position:'absolute',left:0,top:-(item.imageHeight-item.fade),width,height:item.imageHeight}}/>}
   <Image accessible={false} source={art[item.zone]} resizeMode="contain" style={{position:'absolute',left:0,top:0,width,height:item.imageHeight}}/>
   {item.nodes.map(({entry,index,x,y})=>{
    const open=entryUnlocked(progress,entries,index)&&entry.playable,best=progress.missions[entry.key],isCurrent=entry.key===current.key,boss=entry.boss,size=boss?BOSS_NODE:NODE;
    return <Pressable key={entry.key} testID={`mission-node-${entry.number}`} accessibilityRole="button" accessibilityLabel={`Level ${entry.number}: ${boss?`${BOSS_NAMES[boss]} boss fight`:entry.title}${open?'':'. Locked'}`} accessibilityState={{selected:isCurrent}} onPress={()=>{haptic('select');onSelect(entry);}} style={({pressed})=>[s.target,{left:x-30,top:y-size/2-4,opacity:pressed?.7:1}]}>
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
  {width>0&&<FlatList key={`${width}:${entries.length}`} ref={list} data={scenes} extraData={extra} renderItem={render} keyExtractor={r=>r.key} getItemLayout={getItemLayout} initialScrollIndex={currentScene} initialNumToRender={2} windowSize={5} maxToRenderPerBatch={3} showsVerticalScrollIndicator={false} onContentSizeChange={position} onScrollToIndexFailed={position}/>}
 </View>;
}
const s=StyleSheet.create({
 list:{flex:1,minHeight:0,overflow:'hidden',backgroundColor:'#152B26'},
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
