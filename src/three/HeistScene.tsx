import React, {memo, useMemo, useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type {SharedValue} from 'react-native-reanimated';
import {targetPhone,type GameState} from '../game/simulation';
import {getLevel, type LevelDefinition} from '../game/level';
import {sightDistance} from '../game/guards';
import {courierPalette,type Appearance} from '../commerce/appearance';

export type SceneProps = {game:SharedValue<GameState>;alpha:SharedValue<number>;clock:SharedValue<number>;level:LevelDefinition;appearance?:Appearance};
const colors={floor:'#263938',edge:'#142425',mint:'#a8ecd7',cream:'#e8ebda',dark:'#17282d',amber:'#ffcb75'};
const unitBox=new THREE.BoxGeometry(1,1,1),roundedBox=new RoundedBoxGeometry(1,1,1,2,.1);
const materials=new Map<string,THREE.MeshStandardMaterial>();
function material(color:string,emissive=false){const key=color+emissive;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:emissive?.35:.74,metalness:emissive?.12:.08,emissive:emissive?color:'#000000',emissiveIntensity:emissive?.45:0}));return materials.get(key)!;}
function Box({position,scale,color,emissive,round=false}: {position:[number,number,number];scale:[number,number,number];color:string;emissive?:boolean;round?:boolean}) {
 return <mesh position={position} scale={scale} geometry={round?roundedBox:unitBox} material={material(color,emissive)} castShadow receiveShadow dispose={null}/>;
}
function Ball({position,scale,color}: {position:[number,number,number];scale:[number,number,number];color:string}) {
 return <mesh position={position} scale={scale} castShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={color} roughness={.5}/></mesh>;
}
function Phone(){return <group><Box position={[0,.35,0]} scale={[.36,.68,.09]} color={colors.cream} round/><Box position={[0,.35,.052]} scale={[.29,.55,.02]} color="#193f36" round/><Box position={[0,.35,.067]} scale={[.21,.38,.012]} color={colors.mint} emissive round/><Box position={[0,.63,.069]} scale={[.07,.017,.012]} color={colors.dark}/><Box position={[0,.12,.072]} scale={[.12,.014,.012]} color={colors.cream}/>{[.48,.58].map(y=><Ball key={y} position={[-.1,y,-.06]} scale={[.034,.034,.018]} color="#24352e"/>)}</group>;}
function ContactShadow({radius=.55}:{radius?:number}){return <mesh rotation={[-Math.PI/2,0,0]} position={[0,.023,0]}><circleGeometry args={[radius,24]}/><meshBasicMaterial color="#06120d" transparent opacity={.26} depthWrite={false}/></mesh>;}
function Courier({game,alpha,clock,appearance}:SceneProps){
 const colors=courierPalette(appearance?.outfit);
 const root=useRef<THREE.Group>(null),body=useRef<THREE.Group>(null),left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),carry=useRef<THREE.Group>(null);
 useFrame(()=>{const s=game.value,a=alpha.value;if(!root.current)return;
  root.current.position.set(s.px+(s.x-s.px)*a,0,s.py+(s.y-s.py)*a);
  const moving=Math.hypot(s.vx,s.vy)>.05;
  const yaw=moving?Math.atan2(s.vx,s.vy):[0,-Math.PI/2,Math.PI,Math.PI/2][s.facing]!;
  root.current.rotation.y=yaw;
  const stride=moving?Math.sin(s.walked*9)*.55:0;
  if(left.current)left.current.rotation.x=stride;if(right.current)right.current.rotation.x=-stride;
  if(body.current){body.current.position.y=appearance?.reducedEffects?0:moving?Math.abs(Math.sin(s.walked*9))*.035:Math.sin(clock.value*2)*.012;body.current.rotation.x=s.dashLeft>0?.24:0;}
  if(carry.current)carry.current.visible=s.carrying;
 });
 return <group ref={root}><ContactShadow/><group ref={body}>
  <group ref={left} position={[-.16,.42,0]}><Box position={[0,-.15,0]} scale={[.19,.38,.2]} color={colors.dark}/><Box position={[0,-.35,.07]} scale={[.25,.14,.36]} color={colors.cream} round/></group>
  <group ref={right} position={[.16,.42,0]}><Box position={[0,-.15,0]} scale={[.19,.38,.2]} color={colors.dark}/><Box position={[0,-.35,.07]} scale={[.25,.14,.36]} color={colors.cream} round/></group>
  <Box position={[0,.72,0]} scale={[.58,.62,.34]} color={colors.dark} round/>
  <Box position={[0,.55,.18]} scale={[.57,.055,.025]} color={colors.mint}/>
  <Ball position={[0,1.2,0]} scale={[.35,.36,.31]} color={colors.cream}/>
  <Box position={[0,1.22,.265]} scale={[.49,.22,.11]} color={colors.dark} round/>
  <Box position={[0,1.235,.315]} scale={[.36,.055,.018]} color={colors.mint} emissive/>
  <Box position={[-.36,.72,.025]} scale={[.16,.47,.2]} color={colors.cream}/>
  <Box position={[.36,.72,.025]} scale={[.16,.47,.2]} color={colors.cream}/>
  <Box position={[0,.78,-.27]} scale={[.44,.47,.26]} color={colors.mint} round/>
  {[-.22,.22].map(x=><Box key={x} position={[x,.79,.183]} scale={[.065,.48,.035]} color={colors.mint} round/>)}
  <Box position={[0,1.51,0]} scale={[.15,.06,.4]} color={colors.mint} round/>
  <Ball position={[-.34,1.22,0]} scale={[.06,.14,.14]} color={colors.dark}/><Ball position={[.34,1.22,0]} scale={[.06,.14,.14]} color={colors.dark}/>
  <Box position={[0,.78,-.39]} scale={[.24,.10,.02]} color={colors.dark}/>
  <group ref={carry} position={[.26,.51,.36]} rotation={[.3,0,-.2]} scale={.65}><Phone/></group>
 </group></group>;
}
function EscapeTrail({game,appearance}:Pick<SceneProps,'game'|'appearance'>){
 const root=useRef<THREE.Group>(null),last=useRef(-1),cursor=useRef(0),points=useRef(Array.from({length:12},()=>({x:0,y:0,t:-100})));
 useFrame(()=>{const state=game.value;if(!root.current)return;const on=appearance?.trail==='escape-trail'&&!appearance.reducedEffects;
  root.current.visible=on;if(!on)return;
  if(state.elapsed<last.current){for(const p of points.current)p.t=-100;last.current=-1;}
  if(state.carrying&&state.status==='playing'&&Math.hypot(state.vx,state.vy)>.2&&state.elapsed-last.current>.06){const p=points.current[cursor.current++%12]!;p.x=state.x;p.y=state.y;p.t=state.elapsed;last.current=state.elapsed;}
  root.current.children.forEach((object,i)=>{const p=points.current[i]!,age=state.elapsed-p.t,mesh=object as THREE.Mesh;mesh.visible=age>=0&&age<.75;mesh.position.set(p.x,.045,p.y);mesh.scale.setScalar(Math.max(.01,1-age/.75));(mesh.material as THREE.MeshBasicMaterial).opacity=Math.max(0,.45*(1-age/.75));});
 });
 return <group ref={root}>{points.current.map((_,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.19,8]}/><meshBasicMaterial color="#b2f3d8" transparent opacity={.4} depthWrite={false}/></mesh>)}</group>;
}
function Robot({index,game,alpha,clock,level,appearance}:SceneProps & {index:number}){
 const root=useRef<THREE.Group>(null),visor=useRef<THREE.MeshStandardMaterial>(null);
 useFrame(()=>{const g=game.value.guards[index];if(!root.current)return;root.current.visible=!!g;if(!g)return;const a=alpha.value;root.current.position.set(g.px+(g.x-g.px)*a,.02+(appearance?.reducedEffects?0:Math.sin(clock.value*5+index)*.015),g.py+(g.y-g.py)*a);root.current.rotation.y=Math.PI/2-g.angle;if(visor.current)visor.current.color.set(g.exposure>0?'#ff7354':colors.mint);});
 if(level.patrols[index]?.kind==='scanner')return <group ref={root}><Box position={[0,.2,0]} scale={[.9,.4,.9]} color={colors.dark}/><Box position={[0,1,0]} scale={[.17,1.7,.17]} color={colors.cream}/><Box position={[0,1.6,0]} scale={[.72,.4,.46]} color={colors.cream}/><Box position={[0,1.6,.26]} scale={[.57,.21,.08]} color={colors.amber} emissive/><Ball position={[0,1.96,0]} scale={[.09,.09,.09]} color={colors.amber}/></group>;
 return <group ref={root}><ContactShadow radius={.65}/>
  <Box position={[0,.48,0]} scale={[.74,.53,.66]} round color={level.patrols[index]?.kind==='warden'?'#72877c':colors.cream}/>{level.patrols[index]?.kind==='warden'&&<><Box position={[0,.78,0]} scale={[.78,.1,.7]} color={colors.amber}/><Box position={[0,.48,-.37]} scale={[.68,.42,.1]} color={colors.dark}/></>}
  <Box position={[0,.48,.35]} scale={[.56,.24,.045]} color={colors.dark}/>
  <mesh position={[0,.49,.38]}><boxGeometry args={[.36,.075,.02]}/><meshStandardMaterial ref={visor} color={colors.mint} emissive={colors.mint} emissiveIntensity={.5}/></mesh>
  {[-1,1].map(x=><group key={x}><Box position={[x*.38,.55,0]} scale={[.045,.23,.4]} color={colors.dark} round/>{[-.1,0,.1].map(z=><Box key={z} position={[x*.408,.55,z]} scale={[.018,.14,.028]} color='#82968b'/>)}</group>)}
  <Box position={[0,.8,0]} scale={[.13,.16,.13]} color={colors.dark}/>
  <Ball position={[0,.91,0]} scale={[.08,.08,.08]} color={colors.amber}/>
  {[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={`${x}${z}`} position={[x*.39,.2,z*.22]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.18,.18,.14,12]}/><meshStandardMaterial color="#101b20" roughness={.9}/></mesh>))}
 </group>;
}
function Vision({index,game}:Pick<SceneProps,'game'> & {index:number}){
 const mesh=useRef<THREE.Mesh>(null);
 const geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(24*9),3));return g;},[]);
 useFrame(()=>{const guard=game.value.guards[index];if(!mesh.current)return;mesh.current.visible=!!guard&&guard.active;if(!guard||!guard.active)return;
  const positions=geometry.attributes.position!,level={...getLevel(game.value.mission),blockers:game.value.blockers};let k=0;
  for(let j=0;j<24;j++){
   positions.setXYZ(k++,guard.x,.025,guard.y);
   for(let e=0;e<2;e++){const angle=guard.angle-guard.halfAngle+(j+e)/24*guard.halfAngle*2,dx=Math.cos(angle),dy=Math.sin(angle),dist=sightDistance(guard.x,guard.y,dx,dy,guard.range,level);positions.setXYZ(k++,guard.x+dx*dist,.025,guard.y+dy*dist);}
  }positions.needsUpdate=true;
 });
 return <mesh ref={mesh} geometry={geometry} frustumCulled={false}><meshBasicMaterial color={colors.amber} transparent opacity={.19} depthWrite={false} side={THREE.DoubleSide}/></mesh>;
}
function Decoy({game,appearance}:Pick<SceneProps,'game'|'appearance'>){const ref=useRef<THREE.Group>(null),ring=useRef<THREE.Mesh>(null),mat=useRef<THREE.MeshBasicMaterial>(null);useFrame(()=>{const d=game.value.decoy;if(ref.current){ref.current.visible=d.ttl>0;ref.current.position.set(d.x,.05,d.y);}if(ring.current)ring.current.scale.setScalar(appearance?.reducedEffects?1.5:1+(2.5-d.ttl)*.9);if(mat.current)mat.current.opacity=appearance?.reducedEffects?.4:d.ttl/2.5*.55;});return <group ref={ref}><Ball position={[0,.15,0]} scale={[.12,.15,.12]} color={colors.amber}/><mesh ref={ring} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.42,.47,24]}/><meshBasicMaterial ref={mat} color={colors.amber} transparent opacity={.5} depthWrite={false} side={THREE.DoubleSide}/></mesh></group>;}
function SwitchPad({index,game,level,appearance}:Pick<SceneProps,'game'|'level'|'appearance'>&{index:number}){
 const p=level.switches![index]!,mat=useRef<THREE.MeshStandardMaterial>(null),ring=useRef<THREE.Mesh>(null);
 useFrame(()=>{const state=game.value,on=p.kind==='power'?state.power===1:(state.relayTimers[p.channel??0]??0)>0;if(mat.current){mat.current.color.set(on?colors.mint:colors.amber);mat.current.emissive.set(on?colors.mint:colors.amber);}if(ring.current)ring.current.rotation.z=appearance?.reducedEffects?0:state.elapsed*.3;});
 return <group position={[p.x,.035,p.y]}><Box position={[0,0,0]} scale={[.76,.07,.76]} color={colors.dark}/><mesh><boxGeometry args={[.52,.09,.52]}/><meshStandardMaterial ref={mat} color={colors.amber} emissive={colors.amber} emissiveIntensity={.5}/></mesh><mesh ref={ring} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.64,.68,4]}/><meshBasicMaterial color={colors.mint} side={THREE.DoubleSide}/></mesh></group>;
}
function Gate({index,game,level}:Pick<SceneProps,'game'|'level'>&{index:number}){
 const gate=level.gates![index]!,b=gate.box,bar=useRef<THREE.Mesh>(null),material=useRef<THREE.MeshStandardMaterial>(null);
 useFrame((_,dt)=>{const closed=game.value.closedGates[index];if(bar.current)bar.current.position.y=THREE.MathUtils.damp(bar.current.position.y,closed?.6:-.65,15,dt);if(material.current){material.current.color.set(closed?colors.amber:colors.mint);material.current.emissive.set(closed?colors.amber:colors.mint);}});
 return <group><mesh ref={bar} position={[b.x+b.w/2,.6,b.y+b.h/2]}><boxGeometry args={[b.w,1.2,b.h*.3]}/><meshStandardMaterial color={colors.dark} roughness={.5}/></mesh><mesh position={[b.x+b.w/2,.025,b.y+b.h/2]}><boxGeometry args={[b.w,.035,b.h]}/><meshStandardMaterial ref={material} color={colors.amber} emissive={colors.amber} emissiveIntensity={.5}/></mesh>{[b.x-.08,b.x+b.w+.08].map(x=><Box key={x} position={[x,.5,b.y+b.h/2]} scale={[.12,1,.2]} color={colors.cream}/>)}</group>;
}
function FloorArrow({x,z,color=colors.mint}:{x:number;z:number;color?:string}){return <group position={[x,.033,z]}>{[-1,1].map(side=><group key={side} rotation={[0,side*.65,0]}><Box position={[side*.12,0,0]} scale={[.07,.013,.5]} color={color}/></group>)}</group>;}
const Warehouse=memo(function Warehouse({level}:{level:LevelDefinition}){
 const district=level.number<=4?0:level.number<=8?1:2;
 const palette=[{floor:'#516052',wall:'#89947c',crate:'#8b976c',trim:'#c5cc95',rack:'#45554b'}, {floor:'#3f565b',wall:'#809791',crate:'#748f91',trim:'#aed9c5',rack:'#394e55'}, {floor:'#44483c',wall:'#8e9071',crate:'#727c62',trim:'#d7c88d',rack:'#45493d'}][district]!;
 return <group>
 <Box position={[6,-.36,10]} scale={[12.3,.7,20.3]} color='#1a3027' round/>
 <Box position={[6,-.055,10]} scale={[12,.1,20]} color={palette.floor}/>
 {Array.from({length:19},(_,z)=><Box key={`z${z}`} position={[6,.006,z+1]} scale={[11.9,.012,.015]} color={district===1?'#526d70':'#60705c'}/>)}
 {Array.from({length:11},(_,x)=><Box key={`x${x}`} position={[x+1,.007,10]} scale={[.015,.012,19.9]} color={district===1?'#526d70':'#60705c'}/>)}
 {[.45,11.55].map(x=><group key={x}><Box position={[x,.02,10]} scale={[.07,.02,18.7]} color={palette.trim}/>{Array.from({length:9},(_,j)=><Box key={j} position={[x,.025,1.2+j*2.1]} scale={[.16,.025,.7]} color='#cbd5ad'/>)}</group>)}
 {level.blockers.map((b,i)=>{
  const wall=b.kind==='wall',rack=b.kind==='rack',h=wall?.48:rack?1.5:.85,cx=b.x+b.w/2,cz=b.y+b.h/2;
  if(wall)return <group key={i}><Box position={[cx,h/2,cz]} scale={[b.w,h,b.h]} color={palette.wall} round/><Box position={[cx,h+.015,cz]} scale={[b.w,.045,b.h*.8]} color={palette.trim}/></group>;
  if(rack)return <group key={i}><Box position={[cx,.74,cz]} scale={[b.w,1.46,b.h]} color={palette.rack} round/>
   {[.16,.65,1.16].map(y=><group key={y}><Box position={[cx,y,cz]} scale={[b.w+.025,.065,b.h+.025]} color={palette.trim}/>{[-1,1].map(side=><Box key={side} position={[cx,y+.23,cz+side*(b.h*.5+.013)]} scale={[b.w*.83,.31,.025]} color={y>.7?'#8b9c7c':'#667965'} round/>)}</group>)}
   {[-1,1].map(side=><Box key={side} position={[cx+side*b.w*.43,.8,cz]} scale={[.06,1.45,b.h+.04]} color='#b2b99e'/>)}
   <Box position={[cx,1.51,cz]} scale={[b.w+.05,.08,b.h+.05]} color='#a7b395' round/>
   {district===1&&<group position={[cx,1.61,cz]}><mesh rotation={[-Math.PI/2,0,0]}><cylinderGeometry args={[Math.min(b.w,b.h)*.3,Math.min(b.w,b.h)*.3,.07,16]}/><meshStandardMaterial color='#223e42' roughness={.8}/></mesh>{[0,1,2,3].map(n=><group key={n} rotation={[0,n*Math.PI/2,0]}><Box position={[0,.025,.12]} scale={[.12,.055,.32]} color='#8faba3' round/></group>)}</group>}
   {district===2&&[-.2,0,.2].map(x=><Box key={x} position={[cx+x,1.25,cz+b.h/2+.06]} scale={[.025,.2,.03]} color={colors.amber} emissive/>)}
   <Box position={[cx,1.36,cz+b.h/2+.03]} scale={[b.w*.55,.035,.025]} color={colors.mint} emissive/>
  </group>;
  return <group key={i}><Box position={[cx,.09,cz]} scale={[b.w,.18,b.h]} color='#344734'/><Box position={[cx,.5,cz]} scale={[b.w*.96,.78,b.h*.96]} color={district===0&&i%3===0?'#889c88':district===2&&i%3===0?'#636d60':palette.crate} round/>
   <Box position={[cx,.9,cz]} scale={[b.w,.09,b.h]} color={palette.trim} round/>
   {[-1,1].map(side=><group key={side}><Box position={[cx+side*b.w*.3,.52,cz]} scale={[.055,.84,b.h*.98]} color='#42543c'/><Box position={[cx+side*b.w*.3,.95,cz]} scale={[.06,.02,b.h*.98]} color='#42543c'/></group>)}
   <Box position={[cx,.53,cz+b.h/2+.005]} scale={[Math.min(.36,b.w*.25),.2,.018]} color='#e0dfb6'/><Box position={[cx,.53,cz+b.h/2+.017]} scale={[Math.min(.22,b.w*.17),.055,.01]} color='#62715c'/>
  </group>;
 })}
 <Box position={[level.exit.x+level.exit.w/2,.018,level.exit.y+level.exit.h/2]} scale={[level.exit.w,.025,level.exit.h]} color='#74aa8e'/>
 {[level.exit.x,level.exit.x+level.exit.w].map(x=><Box key={x} position={[x,.035,level.exit.y+level.exit.h/2]} scale={[.06,.03,level.exit.h]} color={colors.mint} emissive/>)}
 <Box position={[level.exit.x+level.exit.w/2,1.52,level.exit.y]} scale={[level.exit.w+.25,.25,.22]} color='#243d2e' round/><Box position={[level.exit.x+level.exit.w/2,1.54,level.exit.y+.13]} scale={[level.exit.w*.6,.065,.035]} color={colors.mint} emissive/>
 {[level.exit.x-.1,level.exit.x+level.exit.w+.1].map(x=><Box key={x} position={[x,.75,level.exit.y]} scale={[.15,1.5,.18]} color= {palette.trim} round/>)}
 {[.35,.85,1.35].map(z=><FloorArrow key={z} x={level.exit.x+level.exit.w/2} z={level.exit.y+z}/>)}
 {(level.targets??[level.phone]).map((p,i)=><group key={i}><Box position={[p.x,.14,p.y]} scale={[.9,.28,.9]} color='#243b2f' round/><Box position={[p.x,.3,p.y]} scale={[.78,.045,.78]} color={palette.trim} round/><mesh rotation={[-Math.PI/2,0,0]} position={[p.x,.034,p.y]}><ringGeometry args={[.63,.68,32]}/><meshBasicMaterial color={colors.mint} transparent opacity={.65}/></mesh></group>)}
 </group>;});
function Objective({game,clock,level,appearance}:Pick<SceneProps,'game'|'clock'|'level'|'appearance'>){const ref=useRef<THREE.Group>(null);useFrame(()=>{if(ref.current){const state=game.value,phone=targetPhone(state);ref.current.visible=!state.carrying&&state.status!=='won';ref.current.position.set(phone.x,.55+(appearance?.reducedEffects?0:Math.sin(clock.value*2)*.06),phone.y);ref.current.rotation.y=appearance?.reducedEffects?0:clock.value*.5;}});return <group ref={ref} position={[level.phone.x,.6,level.phone.y]}><Phone/></group>;}
function FollowCamera({game}:Pick<SceneProps,'game'>){const {camera,size}=useThree();const target=useRef(new THREE.Vector3(6,0,10));useFrame((_,dt)=>{const s=game.value,wide=size.width/size.height>1.1,t=target.current;t.x=THREE.MathUtils.damp(t.x,wide?6:THREE.MathUtils.clamp(s.x,4,8),4,dt);t.z=THREE.MathUtils.damp(t.z,wide?10:THREE.MathUtils.clamp(s.y,5,15),4,dt);camera.position.set(t.x+6,wide?23:14,t.z+11);camera.lookAt(t.x,0,t.z);});return null;}
export default function HeistScene(props:SceneProps){return <>
 <color attach="background" args={['#13251c']}/><fog attach="fog" args={['#13251c',36,70]}/>
 <hemisphereLight args={['#e3edd3','#293c2f',1.5]}/><directionalLight position={[10,8,-8]} intensity={1.1} color='#a0d9ca'/><directionalLight position={[-5,12,6]} intensity={2.6} color="#fff1d8" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={50} shadow-normalBias={.04}/>
 <Warehouse level={props.level}/>{props.level.gates?.map((_,index)=><Gate key={index} level={props.level} game={props.game} index={index}/>)}{props.level.switches?.map((_,index)=><SwitchPad key={index} level={props.level} game={props.game} appearance={props.appearance} index={index}/>)}<Objective {...props}/><Courier {...props}/><EscapeTrail {...props}/><Decoy game={props.game} appearance={props.appearance}/>
 {props.level.patrols.map((_,index)=><React.Fragment key={index}><Robot {...props} index={index}/><Vision game={props.game} index={index}/></React.Fragment>)}
 <FollowCamera game={props.game}/>
 </>;}
