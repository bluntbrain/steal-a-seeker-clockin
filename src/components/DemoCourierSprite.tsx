import React from 'react';
import {View} from 'react-native';
import Animated,{useAnimatedStyle,type SharedValue} from 'react-native-reanimated';

/** The same packed body animation as gameplay, on the demo's existing clock. */
export default function DemoCourierSprite({frame}:{frame:SharedValue<number>}){
 const offset=useAnimatedStyle(()=>({transform:[{translateX:-(frame.value%4)*63},{translateY:-Math.floor(frame.value/4)*63}]}));
 return <View style={{position:'absolute',left:-10.5,top:0,width:63,height:63,overflow:'hidden'}}><Animated.Image source={require('../../assets/melee-v2/default-atlas.png')} resizeMode="stretch" style={[{position:'absolute',width:252,height:315},offset]}/></View>;
}
