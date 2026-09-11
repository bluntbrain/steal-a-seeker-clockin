import React from 'react';
import {Circle,Group,Oval,Path,RoundedRect,Skia} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {getLevel} from '../game/level';
import {sightDistance} from '../game/guards';
import type {GameState} from '../game/simulation';
type Props={game:SharedValue<GameState>;alpha:SharedValue<number>;index:number};
export default function GuardLayer({game,alpha,index}:Props){
 const pose=useDerivedValue(()=>{const g=game.value.guards[index];return g?[{translateX:g.px+(g.x-g.px)*alpha.value},{translateY:g.py+(g.y-g.py)*alpha.value},{rotate:g.angle}]:[];});
 const visible=useDerivedValue(()=>game.value.guards[index]?1:0);
 const color=useDerivedValue(()=>game.value.guards[index]?.seesPlayer?'#ff8169':'#dba961');
 const opacity=useDerivedValue(()=>.14+(game.value.guards[index]?.exposure??0)*.25);
 const width=useDerivedValue(()=>(game.value.guards[index]?.exposure??0)*.9);
 const bar=useDerivedValue(()=>{const g=game.value.guards[index];return [{translateX:(g?.x??0)-.45},{translateY:(g?.y??0)-.72}];});
 const cone=useDerivedValue(()=>{
  const p=Skia.Path.Make(),g=game.value.guards[index];if(!g)return p;
  const x=g.px+(g.x-g.px)*alpha.value,y=g.py+(g.y-g.py)*alpha.value;p.moveTo(x,y);
  for(let i=0;i<=32;i++){
   const a=g.angle-g.halfAngle+2*g.halfAngle*i/32,dx=Math.cos(a),dy=Math.sin(a);
   const d=sightDistance(x,y,dx,dy,g.range,{...getLevel(game.value.mission),blockers:game.value.blockers});p.lineTo(x+dx*d,y+dy*d);
  }
  p.close();return p;
 });
 return <Group opacity={visible}>
  <Path path={cone} color={color} opacity={opacity}/>
  <Path path={cone} color={color} opacity={.4} style="stroke" strokeWidth={.025}/>
  <Group transform={pose}>
   <Oval x={-.35} y={-.27} width={.7} height={.65} color="#060c0f" opacity={.7}/>
   <RoundedRect x={-.23} y={-.34} width={.48} height={.16} r={.05} color="#465258"/>
   <RoundedRect x={-.23} y={.18} width={.48} height={.16} r={.05} color="#465258"/>
   <Circle cx={0} cy={0} r={.3} color="#d4dfdc"/>
   <Circle cx={0} cy={0} r={.22} color="#24363a"/>
   <RoundedRect x={.11} y={-.18} width={.13} height={.36} r={.035} color={color}/>
   <Circle cx={-.09} cy={0} r={.055} color="#9aaeb0"/>
  </Group>
  <Group transform={bar}>
   <RoundedRect x={0} y={0} width={.9} height={.10} r={.04} color="#152023"/>
   <RoundedRect x={0} y={0} width={width} height={.10} r={.04} color="#ff8169"/>
  </Group>
 </Group>;
}
