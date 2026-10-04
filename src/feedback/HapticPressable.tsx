import React,{forwardRef,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,StyleSheet,View,type PressableProps} from 'react-native';
import {useHaptics} from './useHaptics';
import type {HapticCue} from './haptic-policy';

export type HapticPressableProps=PressableProps&{hapticCue?:HapticCue|false;spinner?:boolean};
// a pressed spinner button shows a native spinner at once and runs onPress a frame later,
// so a slow handler (level build, modal mount) never looks like a dead tap; the spinner
// clears on unmount, when the control is disabled, or after a safety timeout
const SPINNER_RESET_MS=6000;
/** Feedback belongs to the actual press, not a navigation effect or async result.
 * Disabled controls stay silent. Result/success feedback is still emitted by its owner.
 */
export const HapticPressable=forwardRef<View,HapticPressableProps>(function HapticPressable(
 {onPress,disabled,hapticCue='select',spinner=false,children,...props},ref,
){
 const haptic=useHaptics();
 const [busy,setBusy]=useState(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 useEffect(()=>()=>{timers.current.forEach(clearTimeout);},[]);
 useEffect(()=>{if(disabled)setBusy(false);},[disabled]);
 return <Pressable {...props} ref={ref} disabled={disabled||busy} accessibilityState={{...(props.accessibilityState??{}),busy:busy||props.accessibilityState?.busy,disabled:!!disabled||props.accessibilityState?.disabled}} onPress={onPress?event=>{
  if(disabled||busy)return;
  if(hapticCue)haptic(hapticCue);
  if(!spinner){onPress(event);return;}
  event.persist?.();setBusy(true);
  timers.current.push(setTimeout(()=>onPress(event),40),setTimeout(()=>setBusy(false),SPINNER_RESET_MS));
 }:undefined}>
  {typeof children==='function'?children:<>{children}{spinner&&busy&&<View style={s.spinner}><ActivityIndicator color="#173337" size="small"/></View>}</>}
 </Pressable>;
});
const s=StyleSheet.create({spinner:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center',backgroundColor:'#C9F5DF'}});
