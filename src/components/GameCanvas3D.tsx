import React from 'react';
import {Canvas} from '../three/Canvas';
import HeistScene, {type SceneProps} from '../three/HeistScene';
export default function GameCanvas3D({size,...props}: SceneProps & {size:number}) {
 return <Canvas style={{width:size,height:size*20/12}} shadows camera={{position:[12,18,24],fov:44,near:.1,far:80}} gl={{antialias:true,alpha:false}}><HeistScene {...props}/></Canvas>;
}
