import {useEffect} from 'react';
import {useFrameCallback,useSharedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {cameraConfig,frameCourier,followCamera,OVERVIEW} from './geometry';
export const CAMERA_CONFIG=cameraConfig(process.env.EXPO_PUBLIC_FOLLOW_CAMERA,process.env.EXPO_PUBLIC_CAMERA_ZOOM);
export function useFollowCamera(game:SharedValue<GameState>,alpha:SharedValue<number>,overview:boolean,viewportHeight=20){
 const fullMap=useSharedValue(overview),camera=useSharedValue(OVERVIEW);
 useEffect(()=>{fullMap.value=overview;},[overview,fullMap]);
 useFrameCallback(frame=>{
  const s=game.value;
  if(fullMap.value){camera.value=OVERVIEW;return;}
  const target=frameCourier(s.px+(s.x-s.px)*alpha.value,s.py+(s.y-s.py)*alpha.value,CAMERA_CONFIG.zoom,viewportHeight);
  camera.value=s.ticks<2?target:followCamera(camera.value,target,(frame.timeSincePreviousFrame??16)/1000);
 });
 return camera;
}
