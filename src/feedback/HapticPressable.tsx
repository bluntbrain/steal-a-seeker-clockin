import React,{forwardRef} from 'react';
import {Pressable,type PressableProps,type View} from 'react-native';
import {useHaptics} from './useHaptics';
import type {HapticCue} from './haptic-policy';

export type HapticPressableProps=PressableProps&{hapticCue?:HapticCue|false};
/** Feedback belongs to the actual press, not a navigation effect or async result.
 * Disabled controls stay silent. Result/success feedback is still emitted by its owner.
 */
export const HapticPressable=forwardRef<View,HapticPressableProps>(function HapticPressable(
 {onPress,disabled,hapticCue='select',...props},ref,
){
 const haptic=useHaptics();
 return <Pressable {...props} ref={ref} disabled={disabled} onPress={onPress?event=>{
  if(disabled)return;
  if(hapticCue)haptic(hapticCue);
  onPress(event);
 }:undefined}/>;
});
