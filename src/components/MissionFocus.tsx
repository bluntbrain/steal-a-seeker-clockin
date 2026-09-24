import React from 'react';
import {View,StyleSheet} from 'react-native';
import {Canvas,Circle,Group} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {Camera} from '../camera/geometry';
import type {GameState} from '../game/simulation';
export default function MissionFocus({progress,game,camera,width,height}:{progress:SharedValue<number>;game:SharedValue<GameState>;camera:SharedValue<Camera>;width:number;height:number}){
 const cx=useDerivedValue(()=>(game.value.x-camera.value.x)*width/12*camera.value.zoom);
 const cy=useDerivedValue(()=>(game.value.y-.5-camera.value.y)*width/12*camera.value.zoom);
 const radius=useDerivedValue(()=>Math.hypot(width,height)*(1-progress.value)+width*.055);
 const opacity=useDerivedValue(()=>progress.value<1?Math.min(1,(1-progress.value)*5)*.8:0);
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Canvas style={{width,height}} accessible={false}><Group opacity={opacity}><Circle cx={cx} cy={cy} r={radius} style="stroke" strokeWidth={2} color="#CFE6E4"/><Circle cx={cx} cy={cy} r={radius} style="stroke" strokeWidth={12} color="#CFE6E4" opacity={.08}/></Group></Canvas></View>;
}
