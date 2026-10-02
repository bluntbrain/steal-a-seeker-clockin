import {useCallback,useEffect} from 'react';
import {useFrameCallback,useSharedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {cameraConfig,frameCourier,followCamera,OVERVIEW} from './geometry';
export const CAMERA_CONFIG=cameraConfig(process.env.EXPO_PUBLIC_FOLLOW_CAMERA,process.env.EXPO_PUBLIC_CAMERA_ZOOM);
// one stable worklet identity: reanimated re-registers an inline callback on every render and drops a frame each time
// `active` pauses the camera together with the simulation; a still camera keeps the same object so renderers skip the frame
export function useFollowCamera(game:SharedValue<GameState>,alpha:SharedValue<number>,overview:boolean,viewportHeight=20,active=true){
 const fullMap=useSharedValue(overview),camera=useSharedValue(OVERVIEW);
 useEffect(()=>{fullMap.value=overview;},[overview,fullMap]);
 const driver=useFrameCallback(useCallback((frame:{timeSincePreviousFrame:number|null})=>{
  'worklet';
  const s=game.value;
  if(fullMap.value){if(camera.value!==OVERVIEW)camera.value=OVERVIEW;return;}
  const target=frameCourier(s.px+(s.x-s.px)*alpha.value,s.py+(s.y-s.py)*alpha.value,CAMERA_CONFIG.zoom,viewportHeight);
  const next=s.ticks<2?target:followCamera(camera.value,target,(frame.timeSincePreviousFrame??16)/1000);
  if(next!==camera.value)camera.value=next;
 },[game,alpha,fullMap,camera,viewportHeight]),false);
 useEffect(()=>{driver.setActive(active);return()=>driver.setActive(false);},[driver,active]);
 return camera;
}
