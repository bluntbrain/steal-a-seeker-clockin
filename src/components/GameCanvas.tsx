import React,{memo,useMemo} from 'react';
import {Canvas,Group,Picture,Image,Atlas,Circle,RoundedRect,Oval,Line,ColorMatrix,useImage,useRSXformBuffer} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {makeWarehouse} from '../game/art';
import {TUNING,type LevelDefinition} from '../game/level';
import type {GameState} from '../game/simulation';
import frames from '../../assets/courier.frames.json';
import GuardLayer from './GuardLayer';
type Props={size:number;game:SharedValue<GameState>;alpha:SharedValue<number>;clock:SharedValue<number>;level:LevelDefinition};
const cleanAlpha=[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1.5,-.5];
export default memo(function GameCanvas({size,game,alpha,clock,level}:Props){
 const world=useMemo(()=>makeWarehouse(level.mission!=='practice'&&level.mission!=='night-shift',level),[level]),fallbackWorld=useMemo(()=>makeWarehouse(true,level),[level]);
 const floor=useImage(require('../../assets/warehouse-floor-v1.png'));
 const sprite=useImage(require('../../assets/courier.png'));
 const x=useDerivedValue(()=>game.value.px+(game.value.x-game.value.px)*alpha.value);
 const y=useDerivedValue(()=>game.value.py+(game.value.y-game.value.py)*alpha.value);
 const frame=useDerivedValue(()=>{const s=game.value;return s.facing+(Math.hypot(s.vx,s.vy)>.1 && Math.floor(s.walked*3.5)%2===1?4:0);});
 const sprites=useDerivedValue(()=>[frames[frame.value]!]);
 const transforms=useRSXformBuffer(1,(transform)=>{
  'worklet';const f=frames[frame.value]!;const scale=1.62/f.height;const bob=Math.hypot(game.value.vx,game.value.vy)>.1?Math.abs(Math.sin(game.value.walked*11))*.045:Math.sin(clock.value*2)*.012;transform.set(scale,0,x.value-f.width*scale/2,y.value-f.height*scale+.12-bob);});
 const shadow=useDerivedValue(()=>({x:x.value-.36,y:y.value-.02,width:.72,height:.22}));
 const carry=useDerivedValue(()=>game.value.carrying?1:0);
 const target=useDerivedValue(()=>game.value.carrying?0:1);
 const phoneBob=useDerivedValue(()=>level.phone.y-.91+Math.sin(clock.value*2.6)*.07);
 const carriedTransform=useDerivedValue(()=>[{translateX:x.value+.29},{translateY:y.value-.61},{rotate:.12}]);
 const dash=useDerivedValue(()=>game.value.dashLeft>0?.30:0);
 const trail=useDerivedValue(()=>({x:x.value-game.value.dashX*.8-.18,y:y.value-game.value.dashY*.8-.12,width:.36,height:.24}));
 const glow=useDerivedValue(()=>.12+Math.sin(clock.value*2)*.035);
 const extract=useDerivedValue(()=>game.value.extraction/TUNING.extractHold*level.exit.w);
 const pickupWidth=useDerivedValue(()=>game.value.pickup/TUNING.pickupHold*1.1);
 return <Canvas style={{width:size,height:size*20/12}} accessible={false}>
  <Group transform={[{scale:size/12}]}>
   <Image image={floor} x={0} y={0} width={12} height={20} fit="fill"/>
   <Picture picture={floor?world:fallbackWorld}/>
   <RoundedRect x={level.exit.x} y={level.exit.y} width={level.exit.w} height={level.exit.h} r={.1} color="#b9e6d6" opacity={glow}/>
   <RoundedRect x={level.exit.x} y={level.exit.y+level.exit.h-.10} width={extract} height={.08} r={.02} color="#e3fff5"/>
   <Group opacity={target}>
    <Circle cx={level.phone.x} cy={level.phone.y-.13} r={.91} color="#a5e4d0" opacity={glow}/>
    <RoundedRect x={level.phone.x-.25} y={phoneBob} width={.5} height={.85} r={.07} color="#e5eee5"/>
    <RoundedRect x={level.phone.x-.20} y={useDerivedValue(()=>phoneBob.value+.07)} width={.40} height={.68} r={.04} color="#80cbb7"/>
    <Line p1={{x:level.phone.x-.09,y:level.phone.y-.82}} p2={{x:level.phone.x+.09,y:level.phone.y-.82}} color="#1f504b" strokeWidth={.04}/>
    <RoundedRect x={level.phone.x-.55} y={level.phone.y+.65} width={pickupWidth} height={.07} r={.025} color="#d9fff0"/>
   </Group>
   {level.patrols.map((_,index)=><GuardLayer key={index} game={game} alpha={alpha} index={index}/>)}
   <Oval rect={trail} color="#adf1db" opacity={dash}/>
   <Oval rect={shadow} color="#070c0d" opacity={.7}/>
   {sprite && <Atlas image={sprite} sprites={sprites} transforms={transforms}><ColorMatrix matrix={cleanAlpha}/></Atlas>}
   <Group transform={carriedTransform} opacity={carry}>
    <RoundedRect x={0} y={0} width={.26} height={.45} r={.04} color="#f1f5e9"/>
    <RoundedRect x={.03} y={.055} width={.20} height={.31} r={.025} color="#8cdac1"/>
   </Group>
  </Group>
 </Canvas>;
});
