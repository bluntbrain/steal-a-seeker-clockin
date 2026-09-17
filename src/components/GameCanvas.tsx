import React,{memo,useMemo} from 'react';
import {Canvas,Group,Picture,Image,Atlas,Circle,RoundedRect,Oval,Line,Path,Skia,DashPathEffect,useImage,useRSXformBuffer} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {makeWarehouse} from '../game/art';
import {districtFor,environmentFor} from '../game/environment';
import {TUNING,SECURITY,type LevelDefinition} from '../game/level';
import {targetPhone,decoyLanding,type GameState,type Input} from '../game/simulation';
import {editionIndex} from '../game/collection';
import phoneAtlas from '../../assets/world-v3/phones.frames.json';
import frames from '../../assets/costumes-v4/frames.json';
import {costumeAtlas} from './costumeAssets';
import {costumeFrame} from '../../shared/costumes';
import GuardLayer from './GuardLayer';
import CombatLayer from './CombatLayer';
type Props={size:number;input:SharedValue<Input>;game:SharedValue<GameState>;alpha:SharedValue<number>;clock:SharedValue<number>;level:LevelDefinition;appearance?:{outfit?:string;trail?:string;reducedEffects?:boolean}};
function GateLayer({game,level,index}:Pick<Props,'game'|'level'>&{index:number}){const b=level.gates![index]!.box,color=useDerivedValue(()=>game.value.closedGates[index]?'#edb768':'#99dfc4'),opacity=useDerivedValue(()=>game.value.closedGates[index]?.85:.2);return <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={.04} color={color} opacity={opacity}/>;}
function DecoyLayer({game,input,reduced}:{game:SharedValue<GameState>;input:SharedValue<Input>;reduced:boolean}){
 const landing=useDerivedValue(()=>decoyLanding(game.value,input.value));
 const aim=useDerivedValue(()=>{const p=Skia.Path.Make();p.moveTo(game.value.x,game.value.y);p.lineTo(landing.value.x,landing.value.y);return p;});
 const aimOpacity=useDerivedValue(()=>game.value.status==='playing'&&game.value.decoysLeft>0&&game.value.decoy.ttl===0?.38:0);
 const aimColor=useDerivedValue(()=>landing.value.distance>=.6?'#CFE6E4':'#FF827A');
 const aimX=useDerivedValue(()=>landing.value.x),aimY=useDerivedValue(()=>landing.value.y);
 const x=useDerivedValue(()=>game.value.decoy.x),y=useDerivedValue(()=>game.value.decoy.y);
 const radius=useDerivedValue(()=>reduced?.8:.35+((SECURITY.decoySeconds-game.value.decoy.ttl)%1)*2.1);
 const opacity=useDerivedValue(()=>game.value.decoy.ttl>0?1:0);
 return <>
 <Group opacity={aimOpacity}><Path path={aim} color={aimColor} style="stroke" strokeWidth={.035}><DashPathEffect intervals={[.14,.12]}/></Path><Circle cx={aimX} cy={aimY} r={.23} style="stroke" strokeWidth={.035} color={aimColor}/></Group>
 <Group opacity={opacity}><Circle cx={x} cy={y} r={radius} style="stroke" strokeWidth={.045} color="#CFE6E4" opacity={.65}/><Circle cx={x} cy={y} r={.26} color="#152D37"/><Circle cx={x} cy={y} r={.18} color="#CFE6E4"/><Circle cx={x} cy={y} r={.07} color="#304E56"/></Group>
 </>;
}
function SwitchLayer({game,level,index}:Pick<Props,'game'|'level'>&{index:number}){const p=level.switches![index]!,color=useDerivedValue(()=>(p.kind==='power'?game.value.power===1:(game.value.relayTimers[p.channel??0]??0)>0)?'#a8ecd7':'#edb768');return <RoundedRect x={p.x-.4} y={p.y-.4} width={.8} height={.8} r={.06} color={color}/>;}
export default memo(function GameCanvas({size,input,game,alpha,clock,level,appearance={}}:Props){
 const district=districtFor(level.number),environment=environmentFor(level);
 const wallTexture=useImage(district==='rooftops'?require('../../assets/walls-v5/rooftop-cap.jpg'):district==='powerworks'?require('../../assets/walls-v5/vault-cap.jpg'):require('../../assets/walls-v5/warehouse-cap.jpg'));
 const world=useMemo(()=>makeWarehouse(false,level,wallTexture),[level,wallTexture]),fallbackWorld=useMemo(()=>makeWarehouse(true,level,wallTexture),[level,wallTexture]);
 const floor=useImage(district==='rooftops'?require('../../assets/world-v4/rooftop-floor.png'):district==='powerworks'?require('../../assets/world-v4/powerworks-floor.png'):require('../../assets/world-v3/floor.png'));
 const phones=useImage(require('../../assets/world-v3/phones.png'));
 const phoneIndex=editionIndex(level.mission),phoneFrame=phoneAtlas.frames[phoneIndex]!;
 const phoneScale=1.18/phoneFrame.height;
 const phoneSprites=useMemo(()=>[phoneFrame],[phoneIndex]);
 const phoneTransforms=useMemo(()=>[Skia.RSXform(phoneScale,0,-phoneFrame.width/2*phoneScale,0)],[phoneIndex]);
 const carryTransforms=useMemo(()=>[Skia.RSXform(.48/phoneFrame.height,0,0,0)],[]);
 const sprite=useImage(costumeAtlas(appearance.outfit));
 const reduced=!!appearance.reducedEffects;
 const x=useDerivedValue(()=>game.value.px+(game.value.x-game.value.px)*alpha.value);
 const y=useDerivedValue(()=>game.value.py+(game.value.y-game.value.py)*alpha.value);
 const frame=useDerivedValue(()=>{const s=game.value;return costumeFrame(s.facing,Math.hypot(s.vx,s.vy)>.1 && Math.floor(s.walked*3.5)%2===1);});
 const sprites=useDerivedValue(()=>[frames[frame.value]!]);
 const transforms=useRSXformBuffer(1,(transform)=>{
  'worklet';const f=frames[frame.value]!;const scale=1.62/f.height;const bob=reduced?0:Math.hypot(game.value.vx,game.value.vy)>.1?Math.abs(Math.sin(game.value.walked*11))*.045:Math.sin(clock.value*2)*.012;transform.set(scale,0,x.value-f.width*scale/2,y.value-f.height*scale+.12-bob);});
 const shadow=useDerivedValue(()=>({x:x.value-.36,y:y.value-.02,width:.72,height:.22}));
 const carry=useDerivedValue(()=>game.value.carrying?1:0);
 const target=useDerivedValue(()=>game.value.carrying?0:1);
 const phonePosition=useDerivedValue(()=>[{translateX:targetPhone(game.value).x},{translateY:targetPhone(game.value).y}]);
 const phoneBob=useDerivedValue(()=>-.91+(reduced?0:Math.sin(clock.value*2.6)*.07));
 const carriedTransform=useDerivedValue(()=>[{translateX:x.value+.29},{translateY:y.value-.61},{rotate:.12}]);
 // The burst survives the 0.2s movement impulse, without changing replay physics.
 const burst=useDerivedValue(()=>reduced?0:Math.max(0,1-(TUNING.dashCooldown-game.value.cooldown)/.48));
 const burstTransform=useDerivedValue(()=>[{translateX:x.value},{translateY:y.value-.05},{rotate:Math.atan2(game.value.dashY,game.value.dashX)}]);
 const footRadius=useDerivedValue(()=>.3+(1-burst.value)*.8);
 const escapeOpacity=useDerivedValue(()=>!reduced&&appearance.trail==='escape-trail'&&game.value.carrying&&Math.hypot(game.value.vx,game.value.vy)>.1?.48:0);
 const escapeTransform=useDerivedValue(()=>[{translateX:x.value},{translateY:y.value},{rotate:Math.atan2(game.value.vy,game.value.vx)}]);
 const glow=useDerivedValue(()=>reduced?.12:.12+Math.sin(clock.value*2)*.035);
 const extract=useDerivedValue(()=>game.value.extraction/TUNING.extractHold*level.exit.w);
 const pickupWidth=useDerivedValue(()=>game.value.pickup/TUNING.pickupHold*1.1);
 return <Canvas style={{width:size,height:size*20/12}} accessible={false}>
  <Group transform={[{scale:size/12}]}>
   {district==='warehouse'?Array.from({length:16},(_,i)=><Image key={i} image={floor} x={(i%4)*3} y={Math.floor(i/4)*5} width={3} height={5} fit="fill"/>):<Image image={floor} x={0} y={0} width={12} height={20} fit="fill"/>}
   <RoundedRect x={0} y={0} width={12} height={20} r={0} color={environment.tint}/>
   <Picture picture={floor?world:fallbackWorld}/>
   {level.gates?.map((_,index)=><GateLayer key={index} game={game} level={level} index={index}/>)}
   <RoundedRect x={level.exit.x} y={level.exit.y} width={level.exit.w} height={level.exit.h} r={.1} color="#b9e6d6" opacity={glow}/>
   <RoundedRect x={level.exit.x} y={level.exit.y+level.exit.h-.10} width={extract} height={.08} r={.02} color="#e3fff5"/>
   <Group opacity={target} transform={phonePosition}>
    <Circle cx={0} cy={0-.13} r={.91} color="#a5e4d0" opacity={glow}/>
    <Group transform={useDerivedValue(()=>[{translateY:phoneBob.value}])}><Atlas image={phones} sprites={phoneSprites} transforms={phoneTransforms}/></Group>
    <RoundedRect x={0-.55} y={0+.65} width={pickupWidth} height={.07} r={.025} color="#d9fff0"/>
   </Group>
   {level.patrols.map((_,index)=><GuardLayer key={index} game={game} alpha={alpha} index={index}/>)}
   {level.switches?.map((_,index)=><SwitchLayer key={index} game={game} level={level} index={index}/>)}
   {!level.combat&&<DecoyLayer game={game} input={input} reduced={reduced}/>}
   <Group transform={escapeTransform} opacity={escapeOpacity}>
    <RoundedRect x={-.9} y={-.045} width={.7} height={.09} r={.045} color="#CFE6E4"/>
    <Circle cx={-1.05} cy={0} r={.045} color="#CFE6E4"/>
   </Group>
   <Group transform={burstTransform} opacity={burst}>
    <RoundedRect x={-2.2} y={-.09} width={2} height={.18} r={.09} color="#CFE6E4"/>
    <RoundedRect x={-1.8} y={-.31} width={1.3} height={.07} r={.035} color="#90CBCB"/>
    <RoundedRect x={-1.5} y={.24} width={1.1} height={.07} r={.035} color="#90CBCB"/>
   </Group>
   <Circle cx={x} cy={y} r={footRadius} color="#CFE6E4" style="stroke" strokeWidth={.055} opacity={burst}/>

   <Oval rect={shadow} color="#070c0d" opacity={.7}/>
   {sprite && <Atlas image={sprite} sprites={sprites} transforms={transforms}/>}
   {!!level.combat&&<CombatLayer game={game} alpha={alpha} input={input}/>}
   <Group transform={carriedTransform} opacity={carry}>
    <Atlas image={phones} sprites={phoneSprites} transforms={carryTransforms}/>
   </Group>
  </Group>
 </Canvas>;
});
