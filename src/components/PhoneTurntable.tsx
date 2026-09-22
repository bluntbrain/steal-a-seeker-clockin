import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import React,{useRef,useState} from 'react';
import {Image,PanResponder,Text,View,useWindowDimensions} from 'react-native';
import {PHONE_EDITIONS} from '../game/collection';
import PhoneArt from './PhoneArt';
import {turntableFrame} from './phoneRotation';
const sheets=[require('../../assets/phone-turntables/frost.webp'),require('../../assets/phone-turntables/graphite.webp'),require('../../assets/phone-turntables/tide.webp'),require('../../assets/phone-turntables/static.webp'),require('../../assets/phone-turntables/mist.webp'),require('../../assets/phone-turntables/orbit.webp'),require('../../assets/phone-turntables/pearl.webp'),require('../../assets/phone-turntables/circuit.webp'),require('../../assets/phone-turntables/relic.webp'),require('../../assets/phone-turntables/flux.webp'),require('../../assets/phone-turntables/archive.webp'),require('../../assets/phone-turntables/ghost.webp')];
const presets={Front:0,Back:8,Left:4,Right:12,Top:16,Bottom:17};
/** Rendered views of the real model, without a live GPU context on Android. */
export default function PhoneStage({index,height}:{index:number;height:number}){
 const {width}=useWindowDimensions(),[frame,setFrame]=useState(7),[failed,setFailed]=useState(false);
 const live=useRef(frame),start=useRef(frame);live.current=frame;
 const scale=Math.min(Math.min(width-24,430)/512,height/640),frameW=512*scale,frameH=640*scale;
 const gesture=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderGrant:()=>{start.current=live.current<16?live.current:0;},onPanResponderMove:(_,g)=>setFrame(turntableFrame(start.current,g.dx))})).current;
 return <View style={{gap:12}}><View testID="phone-turntable" accessibilityLabel={`Interactive ${PHONE_EDITIONS[index]!.name} phone model`} style={{height,alignItems:'center',justifyContent:'center',borderRadius:20,overflow:'hidden',backgroundColor:'#101A21'}} {...gesture.panHandlers}>
 {failed?<PhoneArt index={index} height={Math.min(height-40,300)}/>:<View pointerEvents="none" style={{width:frameW,height:frameH,overflow:'hidden'}}><Image source={sheets[index]} onError={()=>{console.warn('[SeekerRecovery] phone-turntable image unavailable',index);setFailed(true);}} style={{position:'absolute',width:frameW*6,height:frameH*3,left:-(frame%6)*frameW,top:-Math.floor(frame/6)*frameH}} resizeMode="stretch"/></View>}
 <Text testID="phone-turntable-pose" pointerEvents="none" style={{position:'absolute',bottom:12,fontSize:10,color:'#9BB7BD'}}>{failed?'PHONE PREVIEW':frame<16?`DRAG TO TURN · ${frame*22.5}°`:frame===16?'TOP':'BOTTOM'}</Text>
 </View>{!failed&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:6,justifyContent:'center'}}>{Object.entries(presets).map(([name,value])=><Pressable key={name} accessibilityRole="button" accessibilityLabel={`Show phone ${name.toLowerCase()}`} accessibilityState={{selected:frame===value}} onPress={()=>setFrame(value)} style={{minHeight:36,paddingHorizontal:12,paddingVertical:10,backgroundColor:frame===value?'#CFE6E4':'#26383F',borderRadius:9}}><Text style={{color:frame===value?'#173739':'#D9ECE5',fontSize:11}}>{name}</Text></Pressable>)}</View>}</View>;
}
