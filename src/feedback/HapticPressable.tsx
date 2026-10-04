import React,{forwardRef,useEffect,useRef,useState,type ReactNode} from 'react';
import {ActivityIndicator,Pressable,StyleSheet,View,type GestureResponderEvent,type PressableProps,type PressableStateCallbackType} from 'react-native';
import {useHaptics} from './useHaptics';
import type {HapticCue} from './haptic-policy';

export type HapticPressableProps=PressableProps&{hapticCue?:HapticCue|false;spinner?:boolean};
// a spinner button shows a native spinner at once and runs onPress a frame later, so a slow
// handler (level build, modal mount) never looks like a dead tap; the pending press is dropped
// if the control is disabled meanwhile, and the spinner clears on unmount or after a safety timeout
const SPINNER_RESET_MS=6000;
type Timer=ReturnType<typeof setTimeout>;
/** Feedback belongs to the actual press, not a navigation effect or async result.
 * Disabled controls stay silent. Result/success feedback is still emitted by its owner.
 */
export const HapticPressable=forwardRef<View,HapticPressableProps>(function HapticPressable(
 {onPress,disabled,hapticCue='select',spinner=false,children,...props},ref,
){
 const haptic=useHaptics();
 const [busy,setBusy]=useState(false),dispatch=useRef<Timer|null>(null),reset=useRef<Timer|null>(null);
 const latest=useRef({onPress,disabled});latest.current={onPress,disabled};
 const clear=()=>{if(dispatch.current)clearTimeout(dispatch.current);if(reset.current)clearTimeout(reset.current);dispatch.current=reset.current=null;};
 useEffect(()=>clear,[]);
 useEffect(()=>{if(disabled){clear();setBusy(false);}},[disabled]);
 const press=(event:GestureResponderEvent)=>{
  if(disabled||busy)return;
  if(hapticCue)haptic(hapticCue);
  if(!spinner){onPress?.(event);return;}
  event.persist?.();clear();setBusy(true);
  dispatch.current=setTimeout(()=>{dispatch.current=null;if(!latest.current.disabled)latest.current.onPress?.(event);},40);
  reset.current=setTimeout(()=>{reset.current=null;setBusy(false);},SPINNER_RESET_MS);
 };
 const overlay=spinner&&busy?<View style={s.spinner}><ActivityIndicator color="#173337" size="small"/></View>:null;
 const state=props.accessibilityState??{};
 return <Pressable {...props} ref={ref} disabled={disabled||busy} accessibilityState={{...state,busy:busy||state.busy,disabled:!!disabled||state.disabled}} onPress={onPress?press:undefined}>
  {typeof children==='function'?(pressed:PressableStateCallbackType):ReactNode=><>{children(pressed)}{overlay}</>:<>{children}{overlay}</>}
 </Pressable>;
});
const s=StyleSheet.create({spinner:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center',backgroundColor:'#C9F5DF'}});
