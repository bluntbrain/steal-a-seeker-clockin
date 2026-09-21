import {useCallback,useRef} from 'react';
import {AppState,Platform} from 'react-native';
import * as Haptics from 'expo-haptics';
import {useSettings} from '../settings/SettingsProvider';
import {createHapticGate,type HapticCue} from './haptic-policy';
const allow=createHapticGate();
/** No vibration permission/pattern loops; native feedback, settings and foreground only. */
export function useHaptics(){const {settings}=useSettings(),enabled=useRef(settings.haptics);enabled.current=settings.haptics;
 return useCallback((cue:HapticCue)=>{
  if(!enabled.current||Platform.OS==='web'||AppState.currentState!=='active'||!allow(cue,Date.now()))return;
  const android:Record<HapticCue,Haptics.AndroidHaptics>={select:Haptics.AndroidHaptics.Segment_Tick,confirm:Haptics.AndroidHaptics.Confirm,shot:Haptics.AndroidHaptics.Segment_Frequent_Tick,damage:Haptics.AndroidHaptics.Reject,kill:Haptics.AndroidHaptics.Virtual_Key,pickup:Haptics.AndroidHaptics.Confirm,dash:Haptics.AndroidHaptics.Gesture_Start,success:Haptics.AndroidHaptics.Confirm,caught:Haptics.AndroidHaptics.Reject,decoy:Haptics.AndroidHaptics.Context_Click,spot:Haptics.AndroidHaptics.Long_Press,switch:Haptics.AndroidHaptics.Toggle_On,claim:Haptics.AndroidHaptics.Gesture_Start,coin:Haptics.AndroidHaptics.Segment_Tick};
  try{const operation=Platform.OS==='android'?Haptics.performAndroidHapticsAsync(android[cue]):cue==='success'||cue==='confirm'?Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success):cue==='caught'?Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error):Haptics.impactAsync(cue==='damage'?Haptics.ImpactFeedbackStyle.Heavy:cue==='pickup'||cue==='kill'?Haptics.ImpactFeedbackStyle.Medium:Haptics.ImpactFeedbackStyle.Light);
  void operation.catch(()=>{});}catch{/* Unsupported devices never interrupt gameplay. */}
 },[]);
}
