import React from 'react';
import {Canvas,Atlas,ColorMatrix,Skia,useImage} from '@shopify/react-native-skia';
import frames from '../../assets/courier.frames.json';
export default function CourierArt({height=80,outfit}:{height?:number;outfit?:string}){
 const art=useImage(require('../../assets/courier.png')),frame=frames[0]!,scale=height/frame.height;
 return <Canvas style={{height,width:frame.width*scale}}><Atlas image={art} sprites={[frame]} transforms={[Skia.RSXform(scale,0,0,0)]}><ColorMatrix matrix={outfit==='night-courier'?[.38,0,0,0,0,0,.43,0,0,.015,0,0,.49,0,.018,0,0,0,1.5,-.5]:outfit==='signal-runner'?[1,0,0,0,.04,0,.91,0,0,0,0,0,.72,0,0,0,0,0,1.5,-.5]:[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1.5,-.5]}/></Atlas></Canvas>;
}
