// the still map of a mission on its briefing. a cover in the panel colour sits over the canvas until the sheets a still
// frame needs have decoded, then goes in one step; drawn earlier, each image popped in as it arrived and the preview
// flickered. the cover is a normal view on top because the canvas is an opaque android surface, which ignores opacity
// on its parent. it is plain react state, not an animation: while the canvas decodes, the android ui thread is busy
// enough that timers and animated fades were delayed by seconds
import {combatLevel} from '../game/combat-levels';
import React,{useCallback,useEffect,useState} from 'react';import {StyleSheet,View} from 'react-native';import {useSharedValue} from 'react-native-reanimated';
import GameCanvas from './GameCanvas';import {type LevelDefinition,type MissionId} from '../game/level';import {initialState,idleInput} from '../game/simulation';
export default function MissionPreview({mission,size,definition}:{mission:MissionId;size:number;definition?:LevelDefinition}){
 const game=useSharedValue(initialState(mission,definition??combatLevel(mission))),input=useSharedValue(idleInput()),alpha=useSharedValue(0),clock=useSharedValue(0),[drawn,setDrawn]=useState(false);
 useEffect(()=>{game.value=initialState(mission,definition??combatLevel(mission));},[mission,definition,game]);
 const decoded=useCallback(()=>setDrawn(true),[]);
 return <View><GameCanvas size={size} game={game} input={input} alpha={alpha} clock={clock} level={definition??combatLevel(mission)} appearance={{reducedEffects:true}} onSceneDrawn={decoded}/>{!drawn&&<View pointerEvents="none" style={[StyleSheet.absoluteFill,s.cover]}/>}</View>;
}
const s=StyleSheet.create({cover:{backgroundColor:'#0A0D10'}});
