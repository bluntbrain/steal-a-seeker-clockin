import {deliverHaptic} from './deliverHaptic';
import {useCallback} from 'react';
import {AppState,Platform,Vibration} from 'react-native';
import * as Haptics from 'expo-haptics';
import {createHapticGate,HAPTIC_POLICY,PATTERN_PRIORITY,type HapticCue} from './haptic-policy';
import {HAPTIC_TEXTURES,type Pulse} from './haptic-patterns';
const allow=createHapticGate();
let followTimer:ReturnType<typeof setTimeout>|undefined,runningPriority=-1;
const IMPACT:Record<Pulse,Haptics.ImpactFeedbackStyle>={light:Haptics.ImpactFeedbackStyle.Light,medium:Haptics.ImpactFeedbackStyle.Medium,heavy:Haptics.ImpactFeedbackStyle.Heavy};
/** single pulses go through expo's amplitude-controlled waveforms; patterns use the motor's default strength and can
 * be cancelled by a higher cue. the system view-feedback constants are only a fallback, since they vanish when the
 * phone's touch-feedback setting is off. haptics are part of the controls and always on; only background and web are silent */
export function useHaptics(){
  return useCallback((cue:HapticCue)=>{
  if(Platform.OS==='web'||AppState.currentState!=='active')return;
  const now=Date.now();if(!allow(cue,now))return;
  const texture=HAPTIC_TEXTURES[cue],priority=HAPTIC_POLICY[cue].priority;
  // a stronger cue takes the motor: stop a running pattern and drop a pending second pulse
  if(followTimer){clearTimeout(followTimer);followTimer=undefined;}
  if(priority>=PATTERN_PRIORITY&&Platform.OS==='android')Vibration.cancel();
  runningPriority=priority;
  const still=()=>AppState.currentState==='active';
  if(texture.kind==='wave'){
   if(Platform.OS==='android'){Vibration.vibrate([...texture.pattern]);return;}
   const notification=cue==='caught'||cue==='damage'||cue==='error'?Haptics.NotificationFeedbackType.Error:cue==='spotted'?Haptics.NotificationFeedbackType.Warning:Haptics.NotificationFeedbackType.Success;
   void deliverHaptic(()=>Haptics.notificationAsync(notification),undefined,still);return;
  }
  const pulse=(style:Pulse)=>deliverHaptic(()=>Haptics.impactAsync(IMPACT[style]),Platform.OS==='android'?()=>Haptics.performAndroidHapticsAsync(style==='light'?Haptics.AndroidHaptics.Clock_Tick:Haptics.AndroidHaptics.Virtual_Key):undefined,still);
  void pulse(texture.style);
  if(texture.follow){const follow=texture.follow;followTimer=setTimeout(()=>{followTimer=undefined;if(runningPriority===priority&&still())void pulse(follow.style);},follow.after);}
 },[]);
}
