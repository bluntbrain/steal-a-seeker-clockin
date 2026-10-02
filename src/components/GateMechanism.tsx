import React from 'react';
import {Circle,Group,Line,Path,RoundedRect} from '@shopify/react-native-skia';
import {useAnimatedReaction,useDerivedValue,useSharedValue,withTiming,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import type {LevelDefinition} from '../game/level';
import {gateSwitchIndex} from '../controls/mechanisms';
type Props={game:SharedValue<GameState>;level:LevelDefinition;index:number;reduced:boolean;clock:SharedValue<number>};
const AMBER='#F2C16C',MINT='#AFE5D0';
/** Crisp, scalable mechanical assets. Their lights follow actual collision state. */
export function GateAsset({game,level,index,reduced}:Props){
 const box=level.gates![index]!.box,horizontal=box.w>=box.h,w=Math.max(box.w,box.h),d=Math.min(box.w,box.h);
 // one timing animation per state change; a derived withTiming would restart every simulation tick
 const open=useSharedValue(game.value.closedGates[index]?0:1);
 useAnimatedReaction(()=>game.value.closedGates[index],(closed,previous)=>{if(previous!==null&&closed!==previous)open.value=withTiming(closed?0:1,{duration:reduced?0:300});},[index,reduced]);
 const color=useDerivedValue(()=>game.value.closedGates[index]?AMBER:MINT);
 const panelWidth=useDerivedValue(()=>(w/2-.12)*(1-open.value)+.07),right=useDerivedValue(()=>w/2-.08-panelWidth.value);
 const locked=useDerivedValue(()=>1-open.value);
 return <Group transform={[{translateX:box.x+box.w/2},{translateY:box.y+box.h/2},{rotate:horizontal?0:Math.PI/2}]}>
  <RoundedRect x={-w/2-.09} y={-d/2+.10} width={w+.18} height={d+.12} r={.08} color="#05090DD9"/>
  <RoundedRect x={-w/2} y={-d/2} width={w} height={d} r={.08} color="#0A1318"/>
  <RoundedRect x={-w/2} y={-d/2} width={w} height={.10} r={.025} color="#71878A"/>
  <RoundedRect x={-w/2} y={d/2-.10} width={w} height={.10} r={.025} color="#526C70"/>
  <Group opacity={open}><Path path={`M-.24 ${d*.14} L0 ${-d*.12} L.24 ${d*.14}`} style="stroke" strokeWidth={.075} strokeCap="round" strokeJoin="round" color={MINT}/></Group>
  <RoundedRect x={-w/2+.08} y={-d/2+.12} width={panelWidth} height={Math.max(.05,d-.24)} r={.04} color="#3A4B52"/>
  <RoundedRect x={right} y={-d/2+.12} width={panelWidth} height={Math.max(.05,d-.24)} r={.04} color="#304048"/>
  <Group opacity={locked}>
   {[-.19,0,.19].map((y,i)=><Line key={i} p1={{x:-w/2+.19,y}} p2={{x:w/2-.19,y}} strokeWidth={.025} color="#758A8D" opacity={.5}/>)}
   <RoundedRect x={-.24} y={-.23} width={.48} height={.51} r={.07} color="#111F25"/>
   <Path path="M-.105 -.035 V-.11 A.105 .105 0 0 1 .105 -.11 V-.035" style="stroke" strokeWidth={.05} color={AMBER}/>
   <RoundedRect x={-.15} y={-.04} width={.3} height={.2} r={.035} color={AMBER}/>
   <Circle cx={0} cy={.045} r={.027} color="#233239"/>
  </Group>
  {[-1,1].map(side=><Group key={side}><RoundedRect x={side<0?-w/2-.08:w/2-.12} y={-d/2-.08} width={.2} height={d+.16} r={.055} color="#40585B"/><RoundedRect x={side<0?-w/2-.025:w/2-.065} y={-d*.26} width={.09} height={d*.52} r={.02} color={color}/></Group>)}
 </Group>;
}
export function SwitchAsset({game,level,index,clock,reduced}:Props){
 const p=level.switches![index]!;
 const on=useDerivedValue(()=>p.kind==='power'?game.value.power===1:(game.value.relayTimers[p.channel??0]??0)>0);
 const color=useDerivedValue(()=>on.value?MINT:AMBER);
 const pulse=useDerivedValue(()=>(reduced||on.value) ? .22 : .13+.16*(.5+.5*Math.sin(clock.value*2.5)));
 return <Group transform={[{translateX:p.x},{translateY:p.y}]}>
  <Circle cx={0} cy={0} r={.72} color={color} opacity={pulse}/>
  <RoundedRect x={-.48} y={-.40} width={.96} height={1.08} r={.15} color="#080E13BB"/>
  <RoundedRect x={-.48} y={-.56} width={.96} height={1.03} r={.12} color="#4C656B"/>
  <RoundedRect x={-.40} y={-.48} width={.80} height={.86} r={.08} color="#1B2A31"/>
  <RoundedRect x={-.24} y={-.40} width={.48} height={.07} r={.02} color={color}/>
  <Circle cx={0} cy={.01} r={.31} color="#080F15"/>
  <Circle cx={0} cy={-.025} r={.285} color={color}/>
  <Circle cx={0} cy={-.025} r={.225} color="#243D41"/>
  <Path path="M-.108 -.12 A.165 .165 0 1 0 .108 -.12 M0 -.21 V-.025" color={color} style="stroke" strokeWidth={.05} strokeCap="round"/>
  {[-1,1].flatMap(x=>[-1,1].map(y=><Circle key={`${x}:${y}`} cx={x*.335} cy={y*.31-.04} r={.025} color="#B9C9C4"/>))}
 </Group>;
}
export function PowerCable({game,level,index}:Props){
 const link=gateSwitchIndex(level,index),b=level.gates![index]!.box,p=level.switches?.[link];
 const color=useDerivedValue(()=>game.value.closedGates[index]?'#B78D51':MINT);
 if(!p)return null;const x=b.x+b.w/2,y=b.y+b.h+.14;
 const path=`M${p.x} ${p.y+.35} L${p.x} ${p.y+.75} L${x} ${p.y+.75} L${x} ${y}`;
 return <Group><Path path={path} color="#09161D" style="stroke" strokeWidth={.13} strokeJoin="round"/><Path path={path} color={color} style="stroke" strokeWidth={.045} strokeJoin="round" opacity={.7}/></Group>;
}
