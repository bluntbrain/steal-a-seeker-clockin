import React from 'react';
import {Circle,Group,Line,Path,RoundedRect,Skia} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {DRONE_REPORT_TICKS} from '../game/heist-guards';

const ROTORS=[[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]] as const;
/** Four ducted fans, rigid arms and a forward camera. Local +X is forward. */
export default function QuadDrone({game,index,clock,reduced}:{game:SharedValue<GameState>;index:number;clock:SharedValue<number>;reduced:boolean}){
 const state=useDerivedValue(()=>{const h=game.value.guards[index]?.heist;return h?.broadcastUntil&&h.broadcastUntil>game.value.ticks?2:h?.charge?1:0;});
 const lamp=useDerivedValue(()=>state.value===2||game.value.combat?.hunt&&game.value.guards[index]?.heist?.hunting?'#FF9477':state.value===1?'#EAD083':'#A6E4D5');
 const fans=useDerivedValue(()=>{
  const p=Skia.Path.Make(),alive=(game.value.guards[index]?.hp??0)>0;
  for(let i=0;i<ROTORS.length;i++){const [x,y]=ROTORS[i]!,angle=(reduced||!alive)? .6:clock.value*(i%2?-23:23);
   for(let j=0;j<3;j++){const a=angle+j*Math.PI*2/3;p.moveTo(x+Math.cos(a)*.055,y+Math.sin(a)*.055);p.lineTo(x+Math.cos(a+.18)*.165,y+Math.sin(a+.18)*.165);}
  }
  return p;
 });
 const charge=useDerivedValue(()=>{const p=Skia.Path.Make(),h=game.value.guards[index]?.heist,amount=(h?.charge??0)/DRONE_REPORT_TICKS;if(!amount)return p;
  for(let i=0;i<=24;i++){const a=-Math.PI/2+Math.PI*2*amount*i/24,x=Math.cos(a)*.79,y=Math.sin(a)*.79;if(i===0)p.moveTo(x,y);else p.lineTo(x,y);}return p;
 });
 const radio=useDerivedValue(()=>state.value===2?1:0);
 const ring=useDerivedValue(()=>reduced?.88:.76+Math.max(0,21-((game.value.guards[index]?.heist?.broadcastUntil??0)-game.value.ticks))/21*.4);
 return <Group>
  {ROTORS.map(([x,y],i)=><Group key={i}>
   <Line p1={{x:0,y:0}} p2={{x,y}} color="#101E25" strokeWidth={.22} strokeCap="round"/>
   <Line p1={{x:0,y:0}} p2={{x,y}} color="#7A999E" strokeWidth={.105} strokeCap="round"/>
   <Circle cx={x} cy={y+.04} r={.26} color="#080F14"/>
   <Circle cx={x} cy={y} r={.255} color="#91AFB2"/>
   <Circle cx={x} cy={y} r={.211} color="#14232A"/>
   <Circle cx={x} cy={y} r={.165} color="#385056"/>
  </Group>)}
  <Path path={fans} color="#CDDFDB" style="stroke" strokeWidth={.06} strokeCap="round"/>
  {ROTORS.map(([x,y],i)=><Circle key={i} cx={x} cy={y} r={.055} color="#CBE7DE"/>)}
  <RoundedRect x={-.33} y={-.25} width={.67} height={.50} r={.16} color="#12232B"/>
  <RoundedRect x={-.32} y={-.245} width={.56} height={.44} r={.14} color="#D0DFDB"/>
  <RoundedRect x={-.20} y={-.15} width={.34} height={.3} r={.08} color="#4C686D"/>
  <RoundedRect x={-.15} y={-.055} width={.22} height={.11} r={.035} color={lamp}/>
  <RoundedRect x={.23} y={-.14} width={.20} height={.28} r={.08} color="#152B32"/>
  <Circle cx={.34} cy={0} r={.082} color={lamp}/>
  <Circle cx={.355} cy={-.014} r={.035} color="#EDFFF2"/>
  <Path path={charge} color="#EAD083" style="stroke" strokeWidth={.065} strokeCap="round"/>
  <Circle cx={0} cy={0} r={ring} color="#FF9477" style="stroke" strokeWidth={.045} opacity={radio}/>
 </Group>;
}
