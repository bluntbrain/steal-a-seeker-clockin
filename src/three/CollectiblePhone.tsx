import React,{useEffect,useMemo} from 'react';
import {useLoader} from '@react-three/fiber';
import {Asset} from 'expo-asset';
import * as THREE from 'three';
import {createSeekerPhone,disposeSeekerPhone} from './seekerPhone';
const atlasUri=Asset.fromModule(require('../../assets/world-v3/phones.png')).uri;
export default function CollectiblePhone({index,onReady}:{index:number;onReady?:()=>void}){
 const texture=useLoader(THREE.TextureLoader,atlasUri);
 const model=useMemo(()=>{texture.colorSpace=THREE.SRGBColorSpace;return createSeekerPhone(index,texture);},[index,texture]);
 useEffect(()=>{onReady?.();return()=>disposeSeekerPhone(model);},[model]);
 return <primitive object={model}/>;
}
