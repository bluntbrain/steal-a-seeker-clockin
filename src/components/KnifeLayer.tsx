import React from 'react';
import {Group,Image,Path,Skia,useImage} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {knifeCombat} from '../game/melee';
/** One small shared texture for every skin; no extra animation loop or JS updates. */
export default function KnifeLayer({game,alpha,reduced=false,behind=false}:{game:SharedValue<GameState>;alpha:SharedValue<number>;reduced?:boolean;behind?:boolean}){
 const art=useImage(require('../../assets/weapons/knife-v1/knife.png'));
 const pose=useDerivedValue(()=>{const s=game.value,m=s.combat?.melee,age=m?s.ticks-m.started:100,active=age>=0&&age<11;
  const a=active?m!.angle:[Math.PI/2,Math.PI,-Math.PI/2,0][s.facing]!;
  const sweep=active&&!reduced?(age<4?-.65:age<7?-.65+(age-4)*.65:1.3-(age-7)*.325):0;
  const x=s.px+(s.x-s.px)*alpha.value,y=s.py+(s.y-s.py)*alpha.value;
  return {x:x+Math.cos(a)*.24-Math.sin(a)*.24,y:y-.48+Math.sin(a)*.12+Math.cos(a)*.07,a:a+sweep,active,age,visible:!!s.definition&&knifeCombat(s.definition)&&s.status==='playing'&&(behind?(Math.sin(a)<-.5):Math.sin(a)>=-.5)};
 });
 const opacity=useDerivedValue(()=>pose.value.visible?1:0),transform=useDerivedValue(()=>[{translateX:pose.value.x},{translateY:pose.value.y},{rotate:pose.value.a}]);
 const arc=useDerivedValue(()=>{const p=Skia.Path.Make(),v=pose.value;if(!v.active||v.age<4||v.age>8||reduced)return p;for(let i=0;i<12;i++){const a=-.9+i*.15,x=Math.cos(a)*.88,y=Math.sin(a)*.88;i?p.lineTo(x,y):p.moveTo(x,y);}return p;});
 return <Group opacity={opacity} transform={transform}><Path path={arc} color="#D3FFF0" style="stroke" strokeWidth={.09} strokeCap="round"/>{art&&<Image image={art} x={-.08} y={-.12} width={.82} height={.274} fit="contain"/>}</Group>;
}
