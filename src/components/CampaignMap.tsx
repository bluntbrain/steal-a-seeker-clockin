// vertical saga map: one node per level from the bottom up, a zone banner every ten levels, larger boss nodes.
// a FlatList with fixed row heights keeps hundreds of levels cheap and lets the list open on the current level.
import {useHaptics} from '../feedback/useHaptics';
import React,{useCallback,useMemo} from 'react';
import {FlatList,Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {entryUnlocked,padLevel,type CampaignEntry} from '../campaign/levels';
import type {Progress} from '../progress/model';
import {BOSS_NAMES,type CampaignZone} from '../../shared/campaign-levels';
import {bossPortrait} from './costumeAssets';
import frames from '../../assets/district-map/frames.json';

const ROW=86,BANNER=132,NODE=44,BOSS_NODE=62;
const zones:Record<CampaignZone,{name:string;art:number;ratio:number}>={
 warehouse:{name:'WAREHOUSE',art:require('../../assets/district-map/warehouse.webp'),ratio:frames.warehouse.width/frames.warehouse.height},
 rooftops:{name:'ROOFTOPS',art:require('../../assets/district-map/rooftops.webp'),ratio:frames.rooftops.width/frames.rooftops.height},
 powerworks:{name:'POWERWORKS',art:require('../../assets/district-map/powerworks.webp'),ratio:frames.powerworks.width/frames.powerworks.height},
};
type Row={kind:'level';entry:CampaignEntry;index:number;gapBelow:number}|{kind:'banner';zone:CampaignZone;from:number;to:number};
// the path winds left and right; the same function places a node and the connector that reaches it
const nodeX=(number:number,width:number)=>width*(.5+.33*Math.sin(number*1.05));
export default function CampaignMap({entries,progress,current,onSelect}:{entries:readonly CampaignEntry[];progress:Progress;current:CampaignEntry;onSelect:(entry:CampaignEntry)=>void}){
 const haptic=useHaptics();
 const [width,setWidth]=React.useState(0);
 // rows run from the top level down so the list scrolls normally; a banner sits below the first level of each zone
 const rows=useMemo<Row[]>(()=>{
  const out:Row[]=[];
  for(let i=entries.length-1;i>=0;i--){
   const entry=entries[i]!,startsZone=i>0&&entries[i-1]!.zone!==entry.zone;
   out.push({kind:'level',entry,index:i,gapBelow:startsZone?BANNER:0});
   let last=i;while(last+1<entries.length&&entries[last+1]!.zone===entry.zone)last++;
   if(startsZone)out.push({kind:'banner',zone:entry.zone,from:entry.number,to:entries[last]!.number});
  }
  return out;
 },[entries]);
 const offsets=useMemo(()=>{let y=0;return rows.map(r=>{const at=y;y+=r.kind==='banner'?BANNER:ROW;return at;});},[rows]);
 const currentIndex=Math.max(0,rows.findIndex(r=>r.kind==='level'&&r.entry.key===current.key));
 const getItemLayout=useCallback((_:unknown,index:number)=>({length:rows[index]?.kind==='banner'?BANNER:ROW,offset:offsets[index]??0,index}),[rows,offsets]);
 const render=useCallback(({item}:{item:Row})=>{
  const w=width;
  if(item.kind==='banner'){const h=Math.min(BANNER-16,w/zones[item.zone].ratio);return <View style={{height:BANNER,justifyContent:'center',alignItems:'center'}}><Image accessible={false} source={zones[item.zone].art} resizeMode="contain" style={{position:'absolute',width:h*zones[item.zone].ratio,height:h,opacity:.55}}/><View style={s.banner}><Text style={s.bannerName}>{zones[item.zone].name}</Text><Text style={s.bannerRange}>LEVELS {item.from} – {item.to}</Text></View></View>;}
  const {entry,index,gapBelow}=item,open=entryUnlocked(progress,entries,index)&&entry.playable,best=progress.missions[entry.key],isCurrent=entry.key===current.key,boss=entry.boss;
  const size=boss?BOSS_NODE:NODE,x=nodeX(entry.number,w),below=index>0?entries[index-1]!:null;
  // one rotated view connects this node to the level below, through a banner when one sits between them
  const connector=below?(()=>{const bx=nodeX(below.number,w),dy=ROW+gapBelow,dx=bx-x,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);return <View pointerEvents="none" style={[s.link,{left:x,top:ROW/2,width:length,transform:[{translateX:-length/2},{rotate:`${angle}rad`},{translateX:length/2}]},!!progress.missions[below.key]&&s.linkDone]}/>;})():null;
  return <View style={{height:ROW,overflow:'visible'}}>
   {connector}
   <Pressable testID={`mission-node-${entry.number}`} accessibilityRole="button" accessibilityLabel={`Level ${entry.number}: ${boss?`${BOSS_NAMES[boss]} boss fight`:entry.title}${open?'':'. Locked'}`} accessibilityState={{selected:isCurrent}} onPress={()=>{haptic('select');onSelect(entry);}} style={({pressed})=>[s.target,{left:x-36,top:ROW/2-size/2-4,opacity:pressed?.7:1}]}>
    <View style={[s.node,{width:size,height:size,borderRadius:size/2},open&&s.open,isCurrent&&s.current,boss&&s.bossNode,boss&&!open&&{opacity:.55}]}>
     {boss?<Image accessible={false} source={bossPortrait(boss)} resizeMode="cover" style={{width:size-6,height:size-6,borderRadius:size/2,transform:[{translateY:4}]}}/>:<Text maxFontSizeMultiplier={1.15} style={[s.number,isCurrent&&{color:'#142F28'},!open&&{color:'#9FAEA9'}]}>{padLevel(entry.number)}</Text>}
    </View>
    {boss&&<Text maxFontSizeMultiplier={1} style={s.bossLabel}>{BOSS_NAMES[boss].toUpperCase()}</Text>}
    {best?<Text maxFontSizeMultiplier={1} style={s.stars}>{'★'.repeat(best.stars)}<Text style={{color:'#65736C'}}>{'★'.repeat(3-best.stars)}</Text></Text>:isCurrent?<Text maxFontSizeMultiplier={1} style={s.play}>PLAY</Text>:!open?<View style={s.lock}><View style={s.shackle}/><View style={s.lockBody}/></View>:null}
   </Pressable>
  </View>;
 },[entries,progress,current.key,haptic,onSelect,width]);
 const extra=useMemo(()=>({progress,width}),[progress,width]);
 return <View testID="mission-districts" style={s.list} onLayout={e=>{const w=e.nativeEvent.layout.width;setWidth(old=>old===w?old:w);}}>
  {width>0&&<FlatList data={rows} extraData={extra} renderItem={render} keyExtractor={r=>r.kind==='banner'?`zone-${r.from}`:r.entry.key} getItemLayout={getItemLayout} initialScrollIndex={currentIndex} initialNumToRender={12} windowSize={7} showsVerticalScrollIndicator={false} onScrollToIndexFailed={()=>{}} contentContainerStyle={{paddingVertical:8}}/>}
 </View>;
}
const s=StyleSheet.create({
 list:{flex:1,minHeight:0},
 banner:{alignItems:'center',gap:4,paddingHorizontal:14,paddingVertical:8,borderRadius:8,backgroundColor:'#0C1412CC',borderWidth:1,borderColor:'#2E423C'},
 bannerName:{fontSize:13,lineHeight:16,fontWeight:'800',letterSpacing:2.6,color:'#E3F3EC'},bannerRange:{fontSize:9,lineHeight:12,letterSpacing:1.6,fontWeight:'700',color:'#8FB0A3'},
 link:{position:'absolute',height:3,borderRadius:2,backgroundColor:'#4E655D',opacity:.6},linkDone:{backgroundColor:'#BAF1DC',opacity:.95},
 target:{position:'absolute',width:72,alignItems:'center',paddingTop:4},
 node:{borderWidth:2,borderColor:'#60746C',backgroundColor:'#15201D',alignItems:'center',justifyContent:'center',overflow:'hidden'},
 open:{borderColor:'#B7E5D4',backgroundColor:'#19352F',shadowColor:'#9BE8CE',shadowRadius:7,shadowOpacity:.55,shadowOffset:{width:0,height:0}},
 current:{backgroundColor:'#D7F3E5',borderColor:'#F0FFF6',shadowOpacity:.7,shadowRadius:11},
 bossNode:{borderColor:'#E58A7A',borderWidth:3,backgroundColor:'#2A1714',shadowColor:'#FF8C73'},
 bossLabel:{fontSize:8,lineHeight:10,fontWeight:'800',letterSpacing:1.6,color:'#F3B8AC',marginTop:3},
 number:{fontSize:16,lineHeight:20,fontWeight:'800',color:'#EDFFF6'},
 stars:{fontSize:9,lineHeight:11,letterSpacing:1,color:'#D2F1DF',marginTop:2,textShadowColor:'#07100C',textShadowRadius:3,textShadowOffset:{width:0,height:1}},
 play:{fontSize:7,lineHeight:10,fontWeight:'800',letterSpacing:1.4,color:'#D2F1DF',marginTop:2},
 lock:{alignItems:'center',marginTop:2},shackle:{width:7,height:5,borderWidth:1.3,borderBottomWidth:0,borderColor:'#ADBAB2',borderTopLeftRadius:4,borderTopRightRadius:4},lockBody:{width:10,height:6,borderRadius:1.5,backgroundColor:'#ADBAB2'},
});
