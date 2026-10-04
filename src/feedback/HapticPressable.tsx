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
 // Resolve the same radius for the native press surface and its absolute overlay.
 // Keep the original children directly in the Pressable: an extra View breaks row/flex buttons.
 const state=props.accessibilityState??{};
 const buttonStyle=(pressed:PressableStateCallbackType)=>[typeof props.style==='function'?props.style(pressed):props.style,spinner&&{overflow:'hidden' as const}];
 return <Pressable {...props} style={buttonStyle} ref={ref} disabled={disabled||busy} accessibilityState={{...state,busy:busy||state.busy,disabled:!!disabled||busy||state.disabled}} onPress={onPress?press:undefined}>
  {(pressed:PressableStateCallbackType):ReactNode=>{
   const flat=StyleSheet.flatten(typeof props.style==='function'?props.style(pressed):props.style)??{};
   const corners={borderRadius:flat.borderRadius,borderTopLeftRadius:flat.borderTopLeftRadius,borderTopRightRadius:flat.borderTopRightRadius,borderBottomLeftRadius:flat.borderBottomLeftRadius,borderBottomRightRadius:flat.borderBottomRightRadius};
   return <>{typeof children==='function'?children(pressed):children}{spinner&&busy&&<View pointerEvents="none" style={[s.spinner,corners,{backgroundColor:flat.backgroundColor??'#C1EFDA'}]}><ActivityIndicator color="#173337" size="small"/></View>}</>;
  }}
 </Pressable>;
});
const s=StyleSheet.create({spinner:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center'}});
