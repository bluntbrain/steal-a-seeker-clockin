import React from 'react';
import {Circle,Group,Image,Path,Skia,type SkImage} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {droneReportTicks} from '../game/guard-pressure';

/** Shared transparent quadcopter art; local +X is forward, matching guard sight. */
export default function QuadDrone({game,index,clock,reduced,sprite}:{game:SharedValue<GameState>;index:number;clock:SharedValue<number>;reduced:boolean;sprite:SkImage|null}){
 const state=useDerivedValue(()=>{const h=game.value.guards[index]?.heist;return h?.broadcastUntil&&h.broadcastUntil>game.value.ticks?2:h?.charge?1:0;});
 const lamp=useDerivedValue(()=>state.value===2||game.value.combat?.hunt&&game.value.guards[index]?.heist?.hunting?'#FF9477':state.value===1?'#EAD083':'#A6E4D5');
 // A small hover, independent of navigation; reduced motion and defeats hold still.
 const hover=useDerivedValue(()=>[{scale:reduced||(game.value.guards[index]?.hp??0)<=0?1:1+Math.sin(clock.value*3+index)*.018}]);
 const charge=useDerivedValue(()=>{const p=Skia.Path.Make(),h=game.value.guards[index]?.heist,amount=(h?.charge??0)/(game.value.definition?droneReportTicks(game.value.definition):27);if(!amount)return p;
  for(let i=0;i<=24;i++){const a=-Math.PI/2+Math.PI*2*amount*i/24,x=Math.cos(a)*.86,y=Math.sin(a)*.86;if(i===0)p.moveTo(x,y);else p.lineTo(x,y);}return p;
 });
 const radio=useDerivedValue(()=>state.value===2?1:0);
 const ring=useDerivedValue(()=>reduced?1:.86+Math.max(0,21-((game.value.guards[index]?.heist?.broadcastUntil??0)-game.value.ticks))/21*.4);
 return <Group>
  <Group transform={hover}>
   <Image image={sprite} x={-.78} y={-.78} width={1.56} height={1.56} fit="contain"/>
   <Circle cx={.29} cy={-.015} r={.043} color={lamp}/>
  </Group>
  <Path path={charge} color="#EAD083" style="stroke" strokeWidth={.065} strokeCap="round"/>
  <Circle cx={0} cy={0} r={ring} color="#FF9477" style="stroke" strokeWidth={.045} opacity={radio}/>
 </Group>;
}
