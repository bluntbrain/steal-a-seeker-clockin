import DefeatLootLayer from './DefeatLootLayer';
import {meleeAtlas} from './meleeAssets';
import {MELEE_FRAMES,meleeFrame} from './melee-presentation';
import {knifeCombat} from '../game/melee';
import ActorHealthBars from './ActorHealthBars';
import React,{memo,useMemo,useEffect} from 'react';
import {Canvas,Group,Picture,Image,Atlas,Circle,RoundedRect,Oval,Line,Path,Skia,DashPathEffect,useImage,useRSXformBuffer} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {makeWarehouse} from '../game/art';
import {currentWallStyle} from '../art/wall-style';
import {interiorWalls,wallActorClip,type WallStyle} from '../art/wall-depth';
import {makeWallOcclusion} from '../art/wall-depth-art';
import {districtFor,environmentFor} from '../game/environment';
import {TUNING,SECURITY,type LevelDefinition} from '../game/level';
import {targetPhone,decoyLanding,type GameState,type Input} from '../game/simulation';
import {editionIndex} from '../game/collection';
import phoneAtlas from '../../assets/world-v3/phones.frames.json';
import frames from '../../assets/costumes-v4/frames.json';
import {costumeAtlas} from './costumeAssets';
import {costumeFrame} from '../../shared/costumes';
import GuardLayer from './GuardLayer';
import {GUARD_SPRITES} from './enemy-presentation';
import CameraSignals from './CameraSignals';
import type {Camera} from '../camera/geometry';
import CombatLayer from './CombatLayer';
import EncounterFloor from './EncounterFloor';
import {GateAsset,SwitchAsset,PowerCable} from './GateMechanism';
type Props={wallStyle?:WallStyle;onReady?:()=>void;onLoadError?:()=>void;camera?:SharedValue<Camera>;size:number;height?:number;input:SharedValue<Input>;game:SharedValue<GameState>;alpha:SharedValue<number>;clock:SharedValue<number>;level:LevelDefinition;appearance?:{outfit?:string;trail?:string;reducedEffects?:boolean}};
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
export default memo(function GameCanvas({camera,size,height=size*20/12,input,game,alpha,clock,level,appearance={},onReady,onLoadError,wallStyle=currentWallStyle()}:Props){
 const cameraTransform=useDerivedValue(()=>{const c=camera?.value??{x:0,y:0,zoom:1},scale=size/12*c.zoom;return [{translateX:-c.x*scale},{translateY:-c.y*scale},{scale}];});
 const district=districtFor(level.number),environment=environmentFor(level);
 const wallTexture=useImage(district==='rooftops'?require('../../assets/walls-v5/rooftop-cap.jpg'):district==='powerworks'?require('../../assets/walls-v5/vault-cap.jpg'):require('../../assets/walls-v5/warehouse-cap.jpg'),onLoadError);
 const world=useMemo(()=>wallTexture?makeWarehouse(false,level,wallTexture,wallStyle):null,[level,wallTexture,wallStyle]);
 const wallOcclusion=useMemo(()=>makeWallOcclusion(interiorWalls(level.blockers,level.width,level.height),wallStyle),[level,wallStyle]);
 const courierClip=useDerivedValue(()=>wallActorClip(wallOcclusion,game.value.py+(game.value.y-game.value.py)*alpha.value));
 const floor=useImage(district==='rooftops'?require('../../assets/world-v4/rooftop-floor.webp'):district==='powerworks'?require('../../assets/world-v4/powerworks-floor.webp'):require('../../assets/world-v3/floor.webp'),onLoadError);
 const phones=useImage(require('../../assets/world-v3/phones.webp'),onLoadError);
 const droneSprite=useImage(require('../../assets/drones-v2/scout.webp'),onLoadError);
 const guardSprite=useImage(GUARD_SPRITES.guard,onLoadError),heavySprite=useImage(GUARD_SPRITES.heavy,onLoadError);
 const phoneIndex=editionIndex(level.mission),phoneFrame=phoneAtlas.frames[phoneIndex]!;
 const phoneScale=1.18/phoneFrame.height;
 const phoneSprites=useMemo(()=>[phoneFrame],[phoneIndex]);
 const phoneTransforms=useMemo(()=>[Skia.RSXform(phoneScale,0,-phoneFrame.width/2*phoneScale,0)],[phoneIndex]);
 const carryTransforms=useMemo(()=>[Skia.RSXform(.48/phoneFrame.height,0,0,0)],[]);
 const knifeMode=knifeCombat(level),actorFrames=knifeMode?MELEE_FRAMES:frames;
 const lootCoin=useImage(require('../../assets/loot-v1/coin.png'),onLoadError);
 const sprite=useImage(knifeMode?meleeAtlas(appearance.outfit):costumeAtlas(appearance.outfit),onLoadError);
 // Each scene is keyed by the parent. Never acknowledge a previous district's
 // retained image while a new source is decoding. Let the new canvas paint first.
 useEffect(()=>{
  if(!lootCoin||!wallTexture||!floor||!phones||!sprite||!droneSprite||!guardSprite||!heavySprite)return;
  let second=0;const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>onReady?.());});
  return()=>{cancelAnimationFrame(first);cancelAnimationFrame(second);};
 },[lootCoin,wallTexture,floor,phones,sprite,droneSprite,guardSprite,heavySprite,onReady]);
 const reduced=!!appearance.reducedEffects;
 const x=useDerivedValue(()=>game.value.px+(game.value.x-game.value.px)*alpha.value);
 const y=useDerivedValue(()=>game.value.py+(game.value.y-game.value.py)*alpha.value);
 const attack=useDerivedValue(()=>{const s=game.value,m=s.combat?.melee;return knifeMode&&m&&s.status==='playing'?meleeFrame(s.ticks-m.started,m.angle):-1;});
 const frame=useDerivedValue(()=>{const s=game.value;if(attack.value>=0)return attack.value;return costumeFrame(s.facing,Math.hypot(s.vx,s.vy)>.1 && Math.floor(s.walked*3.5)%2===1);});
 const sprites=useDerivedValue(()=>[actorFrames[frame.value]!]);
 const transforms=useRSXformBuffer(1,(transform)=>{
  'worklet';const f=actorFrames[frame.value]!;const scale=1.62/f.height;const bob=reduced||attack.value>=0?0:Math.hypot(game.value.vx,game.value.vy)>.1?Math.abs(Math.sin(game.value.walked*11))*.045:Math.sin(clock.value*2)*.012;transform.set(scale,0,x.value-f.width*scale/2,y.value-f.height*scale+.12-bob);});
 const shadow=useDerivedValue(()=>({x:x.value-.36,y:y.value-.02,width:.72,height:.22}));
 const carry=useDerivedValue(()=>game.value.carrying?1:0);
 const target=useDerivedValue(()=>game.value.carrying||game.value.delivered>=(level.targets?.length??1)?0:1);
 const phonePosition=useDerivedValue(()=>[{translateX:targetPhone(game.value).x},{translateY:targetPhone(game.value).y}]);
 const phoneGlow=useDerivedValue(()=>reduced?.34:.22+.22*(.5+.5*Math.sin(clock.value*2.2)));
 const phoneHalo=useDerivedValue(()=>reduced?.85:.80+.12*(.5+.5*Math.sin(clock.value*2.2)));
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
 return <Canvas style={{width:size,height}} accessible={false} opaque>
  <Group transform={cameraTransform}>
   {district==='warehouse'?Array.from({length:16},(_,i)=><Image key={i} image={floor} x={(i%4)*3} y={Math.floor(i/4)*5} width={3} height={5} fit="fill"/>):<Image image={floor} x={0} y={0} width={12} height={20} fit="fill"/>}
   <RoundedRect x={0} y={0} width={12} height={20} r={0} color={environment.tint}/>
   {world&&<Picture picture={world}/>}
   {!!level.encounter&&<EncounterFloor level={level} game={game} reduced={reduced}/>}
   {level.gates?.map((_,index)=><PowerCable key={index} game={game} level={level} index={index} clock={clock} reduced={reduced}/>)}
   {level.gates?.map((_,index)=><GateAsset key={index} game={game} level={level} index={index} clock={clock} reduced={reduced}/>)}
   <RoundedRect x={level.exit.x} y={level.exit.y} width={level.exit.w} height={level.exit.h} r={.1} color="#b9e6d6" opacity={glow}/>
   <RoundedRect x={level.exit.x} y={level.exit.y+level.exit.h-.10} width={extract} height={.08} r={.02} color="#e3fff5"/>
   <Group opacity={target} transform={phonePosition}>
    <Circle cx={0} cy={-.13} r={1.12} color="#FFD15C" opacity={useDerivedValue(()=>phoneGlow.value*.25)}/><Circle cx={0} cy={-.13} r={phoneHalo} color="#FFD978" opacity={phoneGlow}/><Circle cx={0} cy={-.13} r={phoneHalo} color="#FFE5A0" style="stroke" strokeWidth={.035} opacity={phoneGlow}/>
    <Group transform={useDerivedValue(()=>[{translateY:phoneBob.value}])}><Atlas image={phones} sprites={phoneSprites} transforms={phoneTransforms}/></Group>
    <RoundedRect x={0-.55} y={0+.65} width={pickupWidth} height={.07} r={.025} color="#d9fff0"/>
   </Group>
   {level.patrols.map((_,index)=><GuardLayer key={index} game={game} alpha={alpha} index={index} clock={clock} reduced={reduced} droneSprite={droneSprite} guardSprite={guardSprite} heavySprite={heavySprite} wallOcclusion={wallOcclusion}/>)}
   {level.switches?.map((_,index)=><SwitchAsset key={index} game={game} level={level} index={index} clock={clock} reduced={reduced}/>)}
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

   <Group clip={courierClip}>
   <Oval rect={shadow} color="#070c0d" opacity={.7}/>
   {sprite && <Atlas image={sprite} sprites={sprites} transforms={transforms}/>}
   <Group transform={carriedTransform} opacity={carry}>
    <Atlas image={phones} sprites={phoneSprites} transforms={carryTransforms}/>
   </Group>
   </Group>
   {!!level.combat&&<CombatLayer game={game} alpha={alpha} input={input} reduced={reduced}/>}
   {!!level.combat&&<DefeatLootLayer game={game} clock={clock} alpha={alpha} reduced={reduced} coin={lootCoin}/>}
   {!!level.combat&&<ActorHealthBars game={game} alpha={alpha}/>}
  </Group>
  <CameraSignals camera={camera} game={game} size={size} height={height}/>
 </Canvas>;
});
