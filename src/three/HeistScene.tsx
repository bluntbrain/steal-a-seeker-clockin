import React, {memo, useMemo, useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {getLevel, type LevelDefinition} from '../game/level';
import {sightDistance} from '../game/guards';

export type SceneProps = {game:SharedValue<GameState>;alpha:SharedValue<number>;clock:SharedValue<number>;level:LevelDefinition};
const colors={floor:'#263938',edge:'#142425',mint:'#a8ecd7',cream:'#e8ebda',dark:'#17282d',amber:'#ffcb75'};
function Box({position,scale,color,emissive}: {position:[number,number,number];scale:[number,number,number];color:string;emissive?:boolean}) {
 return <mesh position={position} castShadow receiveShadow><boxGeometry args={scale}/><meshStandardMaterial color={color} roughness={.72} emissive={emissive?color:'#000000'} emissiveIntensity={emissive?.65:0}/></mesh>;
}
function Ball({position,scale,color}: {position:[number,number,number];scale:[number,number,number];color:string}) {
 return <mesh position={position} scale={scale} castShadow><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={color} roughness={.68}/></mesh>;
}
function Phone(){return <group><Box position={[0,.35,0]} scale={[.35,.65,.075]} color={colors.cream}/><Box position={[0,.35,.045]} scale={[.27,.50,.012]} color={colors.mint} emissive/><Box position={[0,.63,.055]} scale={[.07,.02,.01]} color={colors.dark}/></group>;}
function Courier({game,alpha,clock}:SceneProps){
 const root=useRef<THREE.Group>(null),body=useRef<THREE.Group>(null),left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),carry=useRef<THREE.Group>(null);
 useFrame(()=>{const s=game.value,a=alpha.value;if(!root.current)return;
  root.current.position.set(s.px+(s.x-s.px)*a,0,s.py+(s.y-s.py)*a);
  const moving=Math.hypot(s.vx,s.vy)>.05;
  const yaw=moving?Math.atan2(s.vx,s.vy):[0,-Math.PI/2,Math.PI,Math.PI/2][s.facing]!;
  root.current.rotation.y=yaw;
  const stride=moving?Math.sin(s.walked*9)*.55:0;
  if(left.current)left.current.rotation.x=stride;if(right.current)right.current.rotation.x=-stride;
  if(body.current){body.current.position.y=moving?Math.abs(Math.sin(s.walked*9))*.035:Math.sin(clock.value*2)*.012;body.current.rotation.x=s.dashLeft>0?.24:0;}
  if(carry.current)carry.current.visible=s.carrying;
 });
 return <group ref={root}><group ref={body}>
  <group ref={left} position={[-.16,.42,0]}><Box position={[0,-.15,0]} scale={[.19,.38,.2]} color={colors.dark}/><Box position={[0,-.35,.07]} scale={[.25,.14,.36]} color={colors.cream}/></group>
  <group ref={right} position={[.16,.42,0]}><Box position={[0,-.15,0]} scale={[.19,.38,.2]} color={colors.dark}/><Box position={[0,-.35,.07]} scale={[.25,.14,.36]} color={colors.cream}/></group>
  <Box position={[0,.72,0]} scale={[.58,.62,.34]} color={colors.dark}/>
  <Box position={[0,.55,.18]} scale={[.57,.055,.025]} color={colors.mint}/>
  <Ball position={[0,1.2,0]} scale={[.35,.36,.31]} color={colors.cream}/>
  <Box position={[0,1.22,.265]} scale={[.46,.17,.09]} color={colors.dark}/>
  <Box position={[0,1.235,.315]} scale={[.36,.055,.018]} color={colors.mint} emissive/>
  <Box position={[-.36,.72,.025]} scale={[.16,.47,.2]} color={colors.cream}/>
  <Box position={[.36,.72,.025]} scale={[.16,.47,.2]} color={colors.cream}/>
  <Box position={[0,.78,-.27]} scale={[.41,.43,.22]} color={colors.mint}/>
  <Box position={[0,.78,-.39]} scale={[.24,.10,.02]} color={colors.dark}/>
  <group ref={carry} position={[.26,.51,.36]} rotation={[.3,0,-.2]} scale={.65}><Phone/></group>
 </group></group>;
}
function Robot({index,game,alpha,clock,level}:SceneProps & {index:number}){
 const root=useRef<THREE.Group>(null),visor=useRef<THREE.MeshStandardMaterial>(null);
 useFrame(()=>{const g=game.value.guards[index];if(!root.current)return;root.current.visible=!!g;if(!g)return;const a=alpha.value;root.current.position.set(g.px+(g.x-g.px)*a,.02+Math.sin(clock.value*5+index)*.015,g.py+(g.y-g.py)*a);root.current.rotation.y=Math.PI/2-g.angle;if(visor.current)visor.current.color.set(g.exposure>0?'#ff7354':colors.mint);});
 if(level.patrols[index]?.kind==='scanner')return <group ref={root}><Box position={[0,.2,0]} scale={[.9,.4,.9]} color={colors.dark}/><Box position={[0,1,0]} scale={[.17,1.7,.17]} color={colors.cream}/><Box position={[0,1.6,0]} scale={[.72,.4,.46]} color={colors.cream}/><Box position={[0,1.6,.26]} scale={[.57,.21,.08]} color={colors.amber} emissive/><Ball position={[0,1.96,0]} scale={[.09,.09,.09]} color={colors.amber}/></group>;
 return <group ref={root}>
  <Box position={[0,.48,0]} scale={[.74,.53,.66]} color={colors.cream}/>
  <Box position={[0,.48,.35]} scale={[.56,.24,.045]} color={colors.dark}/>
  <mesh position={[0,.49,.38]}><boxGeometry args={[.36,.075,.02]}/><meshStandardMaterial ref={visor} color={colors.mint} emissive={colors.mint} emissiveIntensity={.5}/></mesh>
  <Box position={[0,.8,0]} scale={[.13,.16,.13]} color={colors.dark}/>
  <Ball position={[0,.91,0]} scale={[.08,.08,.08]} color={colors.amber}/>
  {[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={`${x}${z}`} position={[x*.39,.2,z*.22]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.18,.18,.14,12]}/><meshStandardMaterial color="#101b20" roughness={.9}/></mesh>))}
 </group>;
}
function Vision({index,game}:Pick<SceneProps,'game'> & {index:number}){
 const mesh=useRef<THREE.Mesh>(null);
 const geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(24*9),3));return g;},[]);
 useFrame(()=>{const guard=game.value.guards[index];if(!mesh.current)return;mesh.current.visible=!!guard;if(!guard)return;
  const positions=geometry.attributes.position!,level={...getLevel(game.value.mission),blockers:game.value.blockers};let k=0;
  for(let j=0;j<24;j++){
   positions.setXYZ(k++,guard.x,.025,guard.y);
   for(let e=0;e<2;e++){const angle=guard.angle-guard.halfAngle+(j+e)/24*guard.halfAngle*2,dx=Math.cos(angle),dy=Math.sin(angle),dist=sightDistance(guard.x,guard.y,dx,dy,guard.range,level);positions.setXYZ(k++,guard.x+dx*dist,.025,guard.y+dy*dist);}
  }positions.needsUpdate=true;
 });
 return <mesh ref={mesh} geometry={geometry} frustumCulled={false}><meshBasicMaterial color={colors.amber} transparent opacity={.19} depthWrite={false} side={THREE.DoubleSide}/></mesh>;
}
function Gate({index,game,level}:Pick<SceneProps,'game'|'level'>&{index:number}){
 const gate=level.gates![index]!,b=gate.box,bar=useRef<THREE.Mesh>(null),material=useRef<THREE.MeshStandardMaterial>(null);
 useFrame((_,dt)=>{const closed=game.value.closedGates[index];if(bar.current)bar.current.position.y=THREE.MathUtils.damp(bar.current.position.y,closed?.6:-.65,15,dt);if(material.current){material.current.color.set(closed?colors.amber:colors.mint);material.current.emissive.set(closed?colors.amber:colors.mint);}});
 return <group><mesh ref={bar} position={[b.x+b.w/2,.6,b.y+b.h/2]}><boxGeometry args={[b.w,1.2,b.h*.3]}/><meshStandardMaterial color={colors.dark} roughness={.5}/></mesh><mesh position={[b.x+b.w/2,.025,b.y+b.h/2]}><boxGeometry args={[b.w,.035,b.h]}/><meshStandardMaterial ref={material} color={colors.amber} emissive={colors.amber} emissiveIntensity={.5}/></mesh>{[b.x-.08,b.x+b.w+.08].map(x=><Box key={x} position={[x,.5,b.y+b.h/2]} scale={[.12,1,.2]} color={colors.cream}/>)}</group>;
}
const Warehouse=memo(function Warehouse({level}:{level:LevelDefinition}){return <group>
 <Box position={[6,-.3,10]} scale={[12,.6,20]} color={colors.edge}/>
 <Box position={[6,-.03,10]} scale={[11.9,.08,19.9]} color={level.floorColor}/>
 {Array.from({length:19},(_,z)=><Box key={`z${z}`} position={[6,.016,z+1]} scale={[10.6,.012,.025]} color="#425553"/>)}
 {Array.from({length:11},(_,x)=><Box key={`x${x}`} position={[x+1,.015,10]} scale={[.025,.012,18.6]} color="#364b49"/>)}
 {level.blockers.map((b,i)=>{
  const wall=b.kind==='wall',rack=b.kind==='rack',h=wall?.55:rack?1.5:.85;
  return <group key={i}><Box position={[b.x+b.w/2,h/2,b.y+b.h/2]} scale={[b.w,h,b.h]} color={wall?'#425853':rack?'#344447':'#657570'}/>
   {!wall&&<><Box position={[b.x+b.w/2,h+.025,b.y+b.h/2]} scale={[b.w+.04,.06,b.h+.04]} color={rack?'#82928b':'#9aa596'}/><Box position={[b.x+b.w/2,h/2,b.y-.018]} scale={[.08,h,.045]} color={colors.dark}/><Box position={[b.x+b.w/2,h/2,b.y+b.h+.018]} scale={[.08,h,.045]} color={colors.dark}/></>}
   {rack&&<Box position={[b.x+b.w/2,h-.25,b.y+b.h+.022]} scale={[b.w*.75,.08,.035]} color={colors.mint} emissive/>}
  </group>;
 })}
 <Box position={[level.exit.x+level.exit.w/2,.02,level.exit.y+level.exit.h/2]} scale={[level.exit.w,.025,level.exit.h]} color="#87cdb6" emissive/>
 <Box position={[level.exit.x+level.exit.w/2,1.45,level.exit.y]} scale={[level.exit.w+.25,.2,.22]} color={colors.mint} emissive/>
 {[level.exit.x-.1,level.exit.x+level.exit.w+.1].map(x=><Box key={x} position={[x,.75,level.exit.y]} scale={[.15,1.5,.18]} color={colors.cream}/>)}
 <Box position={[level.phone.x,.17,level.phone.y]} scale={[.8,.34,.8]} color={colors.dark}/>
 <Box position={[level.phone.x,.35,level.phone.y]} scale={[.85,.035,.85]} color={colors.mint} emissive/>
 </group>;});
function Objective({game,clock,level}:Pick<SceneProps,'game'|'clock'|'level'>){const ref=useRef<THREE.Group>(null);useFrame(()=>{if(ref.current){ref.current.visible=!game.value.carrying;ref.current.position.y=.55+Math.sin(clock.value*2)*.06;ref.current.rotation.y=clock.value*.5;}});return <group ref={ref} position={[level.phone.x,.6,level.phone.y]}><Phone/></group>;}
function FollowCamera({game}:Pick<SceneProps,'game'>){const {camera}=useThree();const target=useRef(new THREE.Vector3(6,0,13));useFrame((_,dt)=>{const s=game.value;const t=target.current;t.x=THREE.MathUtils.damp(t.x,THREE.MathUtils.clamp(s.x,4,8),3,dt);t.z=THREE.MathUtils.damp(t.z,THREE.MathUtils.clamp(s.y,5,15),3,dt);camera.position.set(t.x+6,18,t.z+11);camera.lookAt(t.x,0,t.z);});return null;}
export default function HeistScene(props:SceneProps){return <>
 <color attach="background" args={['#101c20']}/><fog attach="fog" args={['#101c20',32,65]}/>
 <hemisphereLight args={['#d1eee0','#273639',2.2]}/><directionalLight position={[-4,15,4]} intensity={3} color="#fff1d8" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={50} shadow-normalBias={.04}/>
 <Warehouse level={props.level}/>{props.level.gates?.map((_,index)=><Gate key={index} level={props.level} game={props.game} index={index}/>)}<Objective {...props}/><Courier {...props}/>
 {props.level.patrols.map((_,index)=><React.Fragment key={index}><Robot {...props} index={index}/><Vision game={props.game} index={index}/></React.Fragment>)}
 <FollowCamera game={props.game}/>
 </>;}
