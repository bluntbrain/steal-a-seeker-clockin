import React,{memo,useMemo} from 'react';
import {Canvas,Group,Picture,Image,Atlas,Circle,RoundedRect,Oval,Line,ColorMatrix,useImage,useRSXformBuffer} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {makeWarehouse} from '../game/art';
import {TUNING,type LevelDefinition} from '../game/level';
import {targetPhone,type GameState} from '../game/simulation';
import frames from '../../assets/courier.frames.json';
import GuardLayer from './GuardLayer';
type Props={size:number;game:SharedValue<GameState>;alpha:SharedValue<number>;clock:SharedValue<number>;level:LevelDefinition;appearance?:{outfit?:string;trail?:string;reducedEffects?:boolean}};
const cleanAlpha=[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1.5,-.5];
function GateLayer({game,level,index}:Pick<Props,'game'|'level'>&{index:number}){const b=level.gates![index]!.box,color=useDerivedValue(()=>game.value.closedGates[index]?'#edb768':'#99dfc4'),opacity=useDerivedValue(()=>game.value.closedGates[index]?.85:.2);return <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={.04} color={color} opacity={opacity}/>;}
function DecoyLayer({game}:Pick<Props,'game'>){const x=useDerivedValue(()=>game.value.decoy.x),y=useDerivedValue(()=>game.value.decoy.y),radius=useDerivedValue(()=>.45+(2.5-game.value.decoy.ttl)*.4),opacity=useDerivedValue(()=>game.value.decoy.ttl/2.5*.5);return <Circle cx={x} cy={y} r={radius} color="#ffc778" opacity={opacity}/>;}
function SwitchLayer({game,level,index}:Pick<Props,'game'|'level'>&{index:number}){const p=level.switches![index]!,color=useDerivedValue(()=>(p.kind==='power'?game.value.power===1:(game.value.relayTimers[p.channel??0]??0)>0)?'#a8ecd7':'#edb768');return <RoundedRect x={p.x-.4} y={p.y-.4} width={.8} height={.8} r={.06} color={color}/>;}
export default memo(function GameCanvas({size,game,alpha,clock,level,appearance={}}:Props){
 const world=useMemo(()=>makeWarehouse(false,level),[level]),fallbackWorld=useMemo(()=>makeWarehouse(true,level),[level]);
 const floor=useImage(level.number>=9?require('../../assets/visual-v2/vault-floor-v2.png'):level.number>=5?require('../../assets/visual-v2/rooftop-floor-v2.png'):require('../../assets/warehouse-floor-v1.png'));
 const cabinet=useImage(require('../../assets/visual-v2/cover-cabinet-v2.png'));
 const crate=useImage(require('../../assets/visual-v2/cover-crate-v2.png'));
 const sprite=useImage(require('../../assets/courier.png'));
 const reduced=!!appearance.reducedEffects;
 const costumeMatrix=useMemo(()=>appearance.outfit==='night-courier'?[.38,0,0,0,0,0,.43,0,0,.015,0,0,.49,0,.018,0,0,0,1.5,-.5]:cleanAlpha,[appearance.outfit]);
 const x=useDerivedValue(()=>game.value.px+(game.value.x-game.value.px)*alpha.value);
 const y=useDerivedValue(()=>game.value.py+(game.value.y-game.value.py)*alpha.value);
 const frame=useDerivedValue(()=>{const s=game.value;return s.facing+(Math.hypot(s.vx,s.vy)>.1 && Math.floor(s.walked*3.5)%2===1?4:0);});
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
 const trimTransform=useDerivedValue(()=>[{translateX:x.value},{translateY:y.value-.75}]);
 const trim=appearance.outfit==='signal-runner'?'#FD8F3A':'#CFE6E4';
 const glow=useDerivedValue(()=>reduced?.12:.12+Math.sin(clock.value*2)*.035);
 const extract=useDerivedValue(()=>game.value.extraction/TUNING.extractHold*level.exit.w);
 const pickupWidth=useDerivedValue(()=>game.value.pickup/TUNING.pickupHold*1.1);
 return <Canvas style={{width:size,height:size*20/12}} accessible={false}>
  <Group transform={[{scale:size/12}]}>
   <Image image={floor} x={0} y={0} width={12} height={20} fit="fill"/>
   <Picture picture={floor?world:fallbackWorld}/>
   {crate&&level.blockers.filter(b=>b.kind==='crate').map((b,i)=><Group key={`crate-${i}`} clip={{x:b.x,y:b.y,width:b.w,height:b.h}}><Image image={crate} x={b.x-b.w*.15} y={b.y-b.h*.15} width={b.w*1.3} height={b.h*1.3} fit="fill"/></Group>)}{cabinet&&level.blockers.filter(b=>b.kind==='rack').map((b,i)=><Group key={`rack-${i}`} clip={{x:b.x,y:b.y,width:b.w,height:b.h}}><Image image={cabinet} x={b.x-b.w*.46} y={b.y-b.h*.087} width={b.w*1.93} height={b.h*1.19} fit="fill"/></Group>)}
   {level.gates?.map((_,index)=><GateLayer key={index} game={game} level={level} index={index}/>)}
   <RoundedRect x={level.exit.x} y={level.exit.y} width={level.exit.w} height={level.exit.h} r={.1} color="#b9e6d6" opacity={glow}/>
   <RoundedRect x={level.exit.x} y={level.exit.y+level.exit.h-.10} width={extract} height={.08} r={.02} color="#e3fff5"/>
   <Group opacity={target} transform={phonePosition}>
    <Circle cx={0} cy={0-.13} r={.91} color="#a5e4d0" opacity={glow}/>
    <RoundedRect x={0-.25} y={phoneBob} width={.5} height={.85} r={.07} color="#e5eee5"/>
    <RoundedRect x={0-.20} y={useDerivedValue(()=>phoneBob.value+.07)} width={.40} height={.68} r={.04} color="#80cbb7"/>
    <Line p1={{x:0-.09,y:0-.82}} p2={{x:0+.09,y:0-.82}} color="#1f504b" strokeWidth={.04}/>
    <RoundedRect x={0-.55} y={0+.65} width={pickupWidth} height={.07} r={.025} color="#d9fff0"/>
   </Group>
   {level.patrols.map((_,index)=><GuardLayer key={index} game={game} alpha={alpha} index={index}/>)}
   {level.switches?.map((_,index)=><SwitchLayer key={index} game={game} level={level} index={index}/>)}
   <DecoyLayer game={game}/>
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
   {sprite && <Atlas image={sprite} sprites={sprites} transforms={transforms}><ColorMatrix matrix={costumeMatrix}/></Atlas>}
   {!!appearance.outfit&&<Group transform={trimTransform}><RoundedRect x={-.15} y={-.03} width={.3} height={.07} r={.02} color={trim}/></Group>}
   <Group transform={carriedTransform} opacity={carry}>
    <RoundedRect x={0} y={0} width={.26} height={.45} r={.04} color="#f1f5e9"/>
    <RoundedRect x={.03} y={.055} width={.20} height={.31} r={.025} color="#8cdac1"/>
   </Group>
  </Group>
 </Canvas>;
});
