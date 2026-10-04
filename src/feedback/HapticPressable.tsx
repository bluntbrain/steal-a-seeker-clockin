import React,{forwardRef,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
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
 // the committed disabled flag only cancels a pending press; the press keeps the handler it was tapped with
 const latestDisabled=useRef(disabled);useLayoutEffect(()=>{latestDisabled.current=disabled;});
 const clear=()=>{if(dispatch.current)clearTimeout(dispatch.current);if(reset.current)clearTimeout(reset.current);dispatch.current=reset.current=null;};
 useEffect(()=>clear,[]);
 useEffect(()=>{if(disabled){clear();setBusy(false);}},[disabled]);
 const press=(event:GestureResponderEvent)=>{
  if(disabled||busy)return;
  if(hapticCue)haptic(hapticCue);
  if(!spinner){onPress?.(event);return;}
  event.persist?.();clear();setBusy(true);
  dispatch.current=setTimeout(()=>{dispatch.current=null;if(!latestDisabled.current)onPress?.(event);},40);
  reset.current=setTimeout(()=>{reset.current=null;setBusy(false);},SPINNER_RESET_MS);
 };
 // the label dims under a transparent overlay, so the parent's rounded corners stay intact
 const overlay=spinner&&busy?<View style={s.spinner}><ActivityIndicator color="#173337" size="small"/></View>:null,dim=spinner&&busy?s.dim:undefined;
 const state=props.accessibilityState??{};
 return <Pressable {...props} ref={ref} disabled={disabled||busy} accessibilityState={{...state,busy:busy||state.busy,disabled:!!disabled||state.disabled}} onPress={onPress?press:undefined}>
  {typeof children==='function'?(pressed:PressableStateCallbackType):ReactNode=><><View style={dim}>{children(pressed)}</View>{overlay}</>:<><View style={dim}>{children}</View>{overlay}</>}
 </Pressable>;
});
const s=StyleSheet.create({spinner:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center'},dim:{opacity:.15}});
