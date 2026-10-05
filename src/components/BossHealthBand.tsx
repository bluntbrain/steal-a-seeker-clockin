import React from 'react';
import {Image,StyleSheet,Text,View} from 'react-native';
import Animated,{useAnimatedReaction,useAnimatedStyle,useSharedValue,type SharedValue} from 'react-native-reanimated';
import {BOSS_NAMES,type BossId} from '../../shared/campaign-levels';
import {stateLevel,type GameState} from '../game/simulation';
import {BOSS_MOTION} from './bossMotionAssets';
type State={game:SharedValue<GameState>};
/** All changing health and visibility stay on the UI thread. */
export default function BossHealthBand({boss,game}:State&{boss:BossId}){
 const index=stateLevel(game.value).patrols.findIndex(p=>p.boss===boss);
 const visible=useAnimatedStyle(()=>{const g=game.value.guards[index];return {opacity:game.value.status==='playing'&&g?.active&&g.hp>0?1:0};});
 const health=useAnimatedStyle(()=>{const g=game.value.guards[index],ratio=g?Math.max(0,Math.min(1,g.hp/g.maxHp)):0;return {width:`${ratio*100}%`,backgroundColor:ratio<.5?'#FF7769':'#B7ECD6'};});
 return <Animated.View testID="boss-health-band" pointerEvents="none" style={[s.band,visible]}>
  <View style={s.portrait}><Image accessible={false} source={BOSS_MOTION[boss]} style={s.sheet}/></View>
  <View style={s.details}><Text style={s.name}>{BOSS_NAMES[boss].toUpperCase()}</Text><View style={s.track}><Animated.View style={[s.health,health]}/></View></View>
 </Animated.View>;
}
/** Mounted with the scene; only a live-to-dead transition starts this display timer. */
export function BossDownRibbon({game,clock,reduced}:State&{clock:SharedValue<number>;reduced:boolean}){
 const index=stateLevel(game.value).patrols.findIndex(p=>p.boss),started=useSharedValue(-100);
 useAnimatedReaction(()=>game.value.guards[index]?.hp??0,(hp,previous)=>{if(previous!==null&&previous>0&&hp<=0)started.value=clock.value;});
 const presentation=useAnimatedStyle(()=>{const age=clock.value-started.value;return {opacity:age>=0&&age<2?(reduced?1:Math.min(1,age/.12,(2-age)/.25)):0,transform:[{translateY:reduced?0:Math.max(0,1-age/.18)*-12}]};});
 return <Animated.View testID="boss-down-ribbon" pointerEvents="none" style={[s.ribbon,presentation]}><Text style={s.down}>BOSS DOWN</Text></Animated.View>;
}
const s=StyleSheet.create({
 band:{position:'absolute',top:64,left:16,right:16,height:60,maxWidth:480,alignSelf:'center',borderRadius:14,backgroundColor:'#101F1EF0',borderWidth:1,borderColor:'#527769',padding:8,flexDirection:'row',gap:10,zIndex:44},
 portrait:{width:44,height:44,overflow:'hidden',borderRadius:10,backgroundColor:'#274238'},sheet:{position:'absolute',width:528,height:264,left:-443,top:-128},
 details:{flex:1,justifyContent:'center',gap:8},name:{fontSize:12,fontWeight:'900',letterSpacing:2,color:'#E4F4EB'},track:{height:8,borderRadius:4,backgroundColor:'#394F47',overflow:'hidden'},health:{height:8,borderRadius:4},
 ribbon:{position:'absolute',top:'28%',alignSelf:'center',paddingVertical:12,paddingHorizontal:28,borderRadius:12,borderWidth:1,borderColor:'#EFD79D',backgroundColor:'#17382EF2',zIndex:45},down:{color:'#F5E0AF',fontWeight:'900',fontSize:24,letterSpacing:3},
});
