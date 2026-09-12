import React,{useEffect,useMemo} from 'react';
import {useLoader} from '@react-three/fiber';
import {Asset} from 'expo-asset';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {PHONE_EDITIONS} from '../game/collection';
import atlas from '../../assets/world-v3/phones.frames.json';

const atlasUri=Asset.fromModule(require('../../assets/world-v3/phones.png')).uri;
function roundedShape(width:number,height:number,r:number){
 const shape=new THREE.Shape(),x=-width/2,y=-height/2;
 shape.moveTo(x+r,y);shape.lineTo(x+width-r,y);shape.quadraticCurveTo(x+width,y,x+width,y+r);
 shape.lineTo(x+width,y+height-r);shape.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
 shape.lineTo(x+r,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-r);
 shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);return shape;
}
function roundedFace(width:number,height:number,r:number){return new THREE.ShapeGeometry(roundedShape(width,height,r),16);}
function Slab({size,at,color,r=.16,metal=.55}:{size:[number,number,number];at:[number,number,number];color:string;r?:number;metal?:number}){
 const geometry=useMemo(()=>{const bevel=Math.min(.02,size[2]/4);const g=new THREE.ExtrudeGeometry(roundedShape(size[0]-bevel*2,size[1]-bevel*2,r),{depth:size[2]-bevel*2,bevelEnabled:true,bevelSegments:3,bevelSize:bevel,bevelThickness:bevel,steps:1,curveSegments:16});g.translate(0,0,-size[2]/2+bevel);return g;},[...size,r]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh position={at} geometry={geometry}><meshStandardMaterial color={color} metalness={metal} roughness={.3}/></mesh>;
}
function Box({size,at,color,r=.025,metal=.55}:{size:[number,number,number];at:[number,number,number];color:string;r?:number;metal?:number}){
 const geometry=useMemo(()=>new RoundedBoxGeometry(...size,4,r),[...size,r]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh position={at} geometry={geometry}><meshStandardMaterial color={color} metalness={metal} roughness={.3}/></mesh>;
}
export default function CollectiblePhone({index,onReady}:{index:number;onReady?:()=>void}){
 const edition=PHONE_EDITIONS[index]!,texture=useLoader(THREE.TextureLoader,atlasUri);
 const face=useMemo(()=>{
  const geometry=roundedFace(1.38,2.80,.11),pos=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),f=atlas.frames[index]!;
  // Pixel bounds of the display; the bezel and chassis are real geometry. No grid assumptions.
  const x=f.x+22,y=f.y+30,w=156,h=333;
  for(let i=0;i<pos.count;i++)uv.setXY(i,(x+(pos.getX(i)/1.38+.5)*w)/atlas.width,1-(y+(1-(pos.getY(i)/2.80+.5))*h)/atlas.height);
  uv.needsUpdate=true;return geometry;
 },[index]);
 useEffect(()=>{texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;onReady?.();},[texture,index]);
 useEffect(()=>()=>face.dispose(),[face]);
 return <group name={'Collectible '+edition.name}>
  <Slab at={[0,0,0]} size={[1.6,3.1,.22]} color={edition.shell}/>
  <Slab at={[0,0,-.09]} size={[1.55,3.04,.075]} color={edition.shell} r={.16} metal={.2}/>
  <Slab at={[0,0,.107]} size={[1.48,2.99,.025]} color="#11191E" r={.15} metal={.15}/>
  <Box at={[0,1.445,.126]} size={[.22,.026,.012]} color="#0A1015" r={.005}/>
  <mesh position={[0,1.408,.128]}><circleGeometry args={[.023,20]}/><meshBasicMaterial color="#293F49"/></mesh>
  <mesh position={[0,-.025,.127]} geometry={face}><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
  {/* Side keys and antenna bands. */}
  <Box at={[.809,.53,0]} size={[.027,.4,.085]} color={edition.screen} r={.012}/>
  <Box at={[-.809,.5,0]} size={[.027,.51,.07]} color="#63767C" r={.012}/>
  <Box at={[-.809,-.55,0]} size={[.025,.28,.055]} color="#657479" r={.009}/>
  {[-.805,.805].map(x=>[-1.12,1.12].map(y=><Box key={x+':'+y} at={[x,y,0]} size={[.012,.025,.16]} color="#85958F" r={.004}/>))}
  {/* Back camera island, two protruding glass lenses and flash. */}
  <Box at={[-.38,.94,-.168]} size={[.53,.86,.105]} color="#1B252C" r={.09}/>
  {[.72,1.13].map(y=><group key={y} position={[-.38,y,-.23]} rotation={[-Math.PI/2,0,0]}>
   <mesh><cylinderGeometry args={[.18,.18,.045,40]}/><meshStandardMaterial color="#667C83" metalness={.85} roughness={.2}/></mesh>
   <mesh position={[0,.029,0]}><cylinderGeometry args={[.139,.139,.018,40]}/><meshPhysicalMaterial color="#102B40" metalness={.5} roughness={.12} clearcoat={1}/></mesh>
   <mesh position={[-.04,.043,.04]}><sphereGeometry args={[.025,12,8]}/><meshBasicMaterial color="#9CBFD4"/></mesh>
  </group>)}
  <mesh position={[.03,.93,-.144]}><sphereGeometry args={[.047,16,12]}/><meshStandardMaterial color="#EFEAD6" emissive="#B6AB82" emissiveIntensity={.2}/></mesh>
  {/* Edition emblem is a game design, not a manufacturer claim. */}
  <mesh position={[0,-.14,-.139]} rotation={[0,Math.PI,0]}><torusGeometry args={[.32,.018,8,64]}/><meshStandardMaterial color={edition.screen} metalness={.7} roughness={.25}/></mesh>
  <mesh position={[0,-.14,-.145]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[.13,.13,.012]}/><meshStandardMaterial color={edition.screen}/></mesh>
  <Box at={[0,-1.16,-.141]} size={[.42,.022,.008]} color={edition.screen} r={.004}/>
  {/* Recessed-looking USB-C port and speaker holes on the bottom edge. */}
  <Box at={[0,-1.549,0]} size={[.24,.012,.065]} color="#11191D" r={.005}/>
  {[-.56,-.47,-.38,.38,.47,.56].map(x=><mesh key={x} position={[x,-1.549,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.02,12]}/><meshBasicMaterial color="#10191D" side={THREE.DoubleSide}/></mesh>)}
 </group>;
}
