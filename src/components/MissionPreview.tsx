// the still map of a mission on its briefing. the canvas stays hidden until every sprite sheet has decoded, then fades
// in once; drawn earlier, each image popped in as it arrived and the preview flickered through half-drawn frames
import {combatLevel} from '../game/combat-levels';
import React,{useCallback,useEffect} from 'react';import Animated,{useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import GameCanvas from './GameCanvas';import {type LevelDefinition,type MissionId} from '../game/level';import {initialState,idleInput} from '../game/simulation';
export default function MissionPreview({mission,size,definition}:{mission:MissionId;size:number;definition?:LevelDefinition}){
 const game=useSharedValue(initialState(mission,definition??combatLevel(mission))),input=useSharedValue(idleInput()),alpha=useSharedValue(0),clock=useSharedValue(0),shown=useSharedValue(0);
 useEffect(()=>{game.value=initialState(mission,definition??combatLevel(mission));},[mission,definition,game]);
 const ready=useCallback(()=>{shown.value=withTiming(1,{duration:180});},[shown]);
 const fade=useAnimatedStyle(()=>({opacity:shown.value}));
 return <Animated.View style={fade}><GameCanvas size={size} game={game} input={input} alpha={alpha} clock={clock} level={definition??combatLevel(mission)} appearance={{reducedEffects:true}} onReady={ready}/></Animated.View>;
}
