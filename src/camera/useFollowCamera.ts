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
  // a still courier costs nothing: compare the clamped target as scalars before building a camera object
  const zoom=Math.max(CAMERA_CONFIG.zoom,viewportHeight/20),cx=s.px+(s.x-s.px)*alpha.value,cy=s.py+(s.y-s.py)*alpha.value;
  const tx=Math.max(0,Math.min(12-12/zoom,cx-6/zoom)),ty=Math.max(0,Math.min(20-viewportHeight/zoom,cy-.5-viewportHeight/2/zoom)),c=camera.value;
  if(s.ticks>=2&&c.zoom===zoom&&Math.abs(tx-c.x)<1e-6&&Math.abs(ty-c.y)<1e-6)return;
  const target=frameCourier(cx,cy,CAMERA_CONFIG.zoom,viewportHeight);
  const next=s.ticks<2?target:followCamera(c,target,(frame.timeSincePreviousFrame??16)/1000);
  if(next!==c)camera.value=next;
 },[game,alpha,fullMap,camera,viewportHeight]),false);
 useEffect(()=>{driver.setActive(active);return()=>driver.setActive(false);},[driver,active]);
 return camera;
}
