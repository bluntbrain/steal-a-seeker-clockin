import React,{memo,useState} from 'react';
import {View,StyleSheet} from 'react-native';
import {Canvas,Circle,Group} from '@shopify/react-native-skia';
import {runOnJS,useAnimatedReaction,useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {Camera} from '../camera/geometry';
import type {GameState} from '../game/simulation';
type Props={progress:SharedValue<number>;game:SharedValue<GameState>;camera:SharedValue<Camera>;width:number;height:number};
// the ring and its derived values live in this child, so nothing reacts to the game once the intro ends
function FocusRing({progress,game,camera,width,height}:Props){
 const cx=useDerivedValue(()=>(game.value.x-camera.value.x)*width/12*camera.value.zoom);
 const cy=useDerivedValue(()=>(game.value.y-.5-camera.value.y)*width/12*camera.value.zoom);
 const radius=useDerivedValue(()=>Math.hypot(width,height)*(1-progress.value)+width*.055);
 const opacity=useDerivedValue(()=>progress.value<1?Math.min(1,(1-progress.value)*5)*.8:0);
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Canvas style={{width,height}} accessible={false}><Group opacity={opacity}><Circle cx={cx} cy={cy} r={radius} style="stroke" strokeWidth={2} color="#CFE6E4"/><Circle cx={cx} cy={cy} r={radius} style="stroke" strokeWidth={12} color="#CFE6E4" opacity={.08}/></Group></Canvas></View>;
}
// intro focus ring over the board; mounted only while the ring animates
function MissionFocus(props:Props){
 const [active,setActive]=useState(false);
 useAnimatedReaction(()=>props.progress.value<1,(running,previous)=>{if(running!==previous)runOnJS(setActive)(running);},[props.progress]);
 return active?<FocusRing {...props}/>:null;
}
export default memo(MissionFocus);
