import React,{useEffect} from 'react';
import {Image,View} from 'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useSharedValue,withRepeat,withSequence,withTiming} from 'react-native-reanimated';

/** The origin is the fingertip, not the centre of the sprite. Never intercept taps. */
export function TapHand({size=64,flipX=false,flipY=false}:{size?:number;flipX?:boolean;flipY?:boolean}){
 return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{width:0,height:0,transform:[{scaleX:flipX?-1:1},{scaleY:flipY?-1:1}]}}>
  <Image source={require('../../assets/tutorial/tap-hand.png')} resizeMode="contain" style={{position:'absolute',left:-size*.09,top:-size*.09,width:size,height:size}}/>
 </View>;
}

export default function TutorialHand({x,y,width,height,reduced=false}:{x:number;y:number;width:number;height:number;reduced?:boolean}){
 const pulse=useSharedValue(0);
 const flipX=x>width-72,flipY=y>height-96;
 useEffect(()=>{
  cancelAnimation(pulse);pulse.value=0;
  if(!reduced)pulse.value=withRepeat(withSequence(withTiming(1,{duration:450,easing:Easing.inOut(Easing.quad)}),withTiming(0,{duration:550,easing:Easing.inOut(Easing.quad)})),-1,false);
  return()=>cancelAnimation(pulse);
 },[pulse,reduced]);
 const hand=useAnimatedStyle(()=>({transform:[{translateX:(flipX?-1:1)*(1-pulse.value)*6},{translateY:(flipY?-1:1)*(1-pulse.value)*8}]}));
 return <View testID="tutorial-hand" pointerEvents="none" accessible={false} style={{position:'absolute',left:x,top:y,width:0,height:0}}>
  <Animated.View style={hand}><TapHand flipX={flipX} flipY={flipY}/></Animated.View>
 </View>;
}
