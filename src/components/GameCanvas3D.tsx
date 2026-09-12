import React from 'react';
import {Canvas} from '../three/Canvas';
import HeistScene, {type SceneProps} from '../three/HeistScene';
export default function GameCanvas3D({size,viewHeight=size*20/12,...props}: SceneProps & {size:number;viewHeight?:number}) {
 return <Canvas style={{width:size,height:viewHeight}} shadows camera={{position:[12,18,24],fov:48,near:.1,far:80}} gl={{antialias:true,alpha:false}}><HeistScene {...props}/></Canvas>;
}
