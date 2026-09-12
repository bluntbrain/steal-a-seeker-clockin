import React from 'react';
import {Canvas as WebCanvas,type CanvasProps} from '@react-three/fiber';
export function Canvas(props:CanvasProps){return <WebCanvas dpr={[1,1.5]} {...props}/>;}
