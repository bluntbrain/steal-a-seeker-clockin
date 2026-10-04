import React,{memo} from 'react';
import {Canvas,Circle,Path,RoundedRect} from '@shopify/react-native-skia';

// Vector silhouettes stay crisp at thumb-control size on web and Android.
export default memo(function ActionIcon({kind,color}:{kind:'decoy'|'phone'|'switch'|'check'|'dash'|'target';color:string}){
 return <Canvas pointerEvents="none" style={{width:26,height:26}}>
  {kind==='decoy'?<><Circle cx={13} cy={13} r={3} color={color}/><Path path="M8 7 Q2 13 8 19 M18 7 Q24 13 18 19 M5 3 Q-4 13 5 23 M21 3 Q30 13 21 23" style="stroke" strokeWidth={1.6} strokeCap="round" color={color}/></>
  :kind==='target'?<><Circle cx={13} cy={13} r={8} style="stroke" strokeWidth={2} color={color}/><Circle cx={13} cy={13} r={2.5} color={color}/><Path path="M13 1 V7 M13 19 V25 M1 13 H7 M19 13 H25" style="stroke" strokeWidth={2} strokeCap="round" color={color}/></>
  :kind==='phone'?<><RoundedRect x={7} y={2} width={12} height={22} r={3} style="stroke" strokeWidth={1.8} color={color}/><Path path="M11 5 H15 M12 20 H14" style="stroke" strokeWidth={1.8} strokeCap="round" color={color}/></>
  :kind==='switch'?<><Path path="M7 6 A9 9 0 1 0 19 6 M13 2 V12" style="stroke" strokeWidth={2} strokeCap="round" color={color}/></>
  :kind==='check'?<Path path="M5 13 L10 18 L21 7" style="stroke" strokeWidth={2.5} strokeCap="round" strokeJoin="round" color={color}/>
  :<Path path="M15 1 L5 15 H12 L10 25 L22 10 H15 Z" color={color}/>}
 </Canvas>;
});
