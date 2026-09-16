import React,{useEffect,useRef,useState} from 'react';
import {Asset} from 'expo-asset';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
const clips=[require('../../assets/paywall-video/close-call.mp4'),require('../../assets/paywall-video/last-second.mp4')];
export default function PaywallVideo({active=true}:{active?:boolean}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[failed,setFailed]=useState(false),video=useRef<HTMLVideoElement>(null);
 useEffect(()=>{const el=video.current;if(!el)return;let alive=true;const sync=()=>{if(active&&!paused&&!document.hidden)void el.play().catch(()=>{if(alive)setPaused(true);});else el.pause();};sync();document.addEventListener('visibilitychange',sync);return()=>{alive=false;document.removeEventListener('visibilitychange',sync);el.pause();};},[active,paused,index]);
 return <View style={StyleSheet.absoluteFill} testID="paywall-trailer">{failed?<Image source={require('../../assets/paywall-v3/courier-heist.png')} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]}/>:React.createElement('video',{ref:video,src:Asset.fromModule(clips[index]).uri,muted:true,playsInline:true,preload:'auto','data-testid':'paywall-video',onEnded:()=>setIndex(i=>(i+1)%clips.length),onError:()=>setFailed(true),style:{position:'absolute',width:'100%',height:'100%',objectFit:'cover'}})}{!failed&&<Pressable accessibilityRole="button" accessibilityLabel={paused?'Play trailer':'Pause trailer'} onPress={()=>setPaused(p=>!p)} style={{position:'absolute',right:12,bottom:12,padding:10,borderRadius:20,backgroundColor:'#091917DD'}}><Text style={{color:'#DEF0E9',fontSize:11}}>{paused?'▶ Play':'Ⅱ Pause'}</Text></Pressable>}</View>;
}
