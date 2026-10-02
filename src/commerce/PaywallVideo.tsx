import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import React,{useEffect,useState} from 'react';
import {AppState,Image,StyleSheet,Text,View} from 'react-native';
import {useVideoPlayer,VideoView} from 'expo-video';
import RecoveryBoundary from '../components/RecoveryBoundary';
const clips=[require('../../assets/paywall-video/close-call.mp4'),require('../../assets/paywall-video/last-second.mp4')];
const poster=require('../../assets/paywall-v3/courier-heist.webp');
const still=<Image source={poster} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]}/>;
function Clip({index,active,onEnd,onFailure}:{index:number;active:boolean;onEnd:()=>void;onFailure:()=>void}){
 const player=useVideoPlayer(clips[index],p=>{p.muted=true;p.loop=false;});
 useEffect(()=>{let alive=true;const operation=(playing:boolean)=>{if(!alive)return;try{playing?player.play():player.pause();}catch{onFailure();}};const ended=player.addListener('playToEnd',()=>{if(alive)onEnd();}),status=player.addListener('statusChange',s=>{if(alive&&s.status==='error'){console.warn('[SeekerVideo] Trailer unavailable');onFailure();}}),app=AppState.addEventListener('change',s=>operation(active&&s==='active'));operation(active&&AppState.currentState==='active');return()=>{alive=false;ended.remove();status.remove();app.remove();};},[player,active]);
 return <VideoView testID="paywall-video" player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} surfaceType="textureView" allowsPictureInPicture={false}/>;
}
export default function PaywallVideo({active=true}:{active?:boolean}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[failed,setFailed]=useState(false);
 return <View style={StyleSheet.absoluteFill} testID="paywall-trailer"><RecoveryBoundary scope="paywall-video" fallback={still}>{failed?still:<Clip key={index} index={index} active={active&&!paused} onEnd={()=>setIndex(i=>(i+1)%clips.length)} onFailure={()=>setFailed(true)}/>}</RecoveryBoundary>{!failed&&<Pressable accessibilityRole="button" accessibilityLabel={paused?'Play trailer':'Pause trailer'} onPress={()=>setPaused(p=>!p)} style={{position:'absolute',right:12,bottom:12,padding:10,borderRadius:20,backgroundColor:'#091917DD'}}><Text style={{color:'#DEF0E9',fontSize:11}}>{paused?'▶ Play':'Ⅱ Pause'}</Text></Pressable>}</View>;
}
