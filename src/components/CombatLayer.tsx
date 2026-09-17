import React from 'react';
import {Circle,Path,Skia} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {Input,GameState} from '../game/simulation';
import {roundedRoute,TAP_RADIUS} from './routeGeometry';
export default function CombatLayer({game,alpha,input}:{game:SharedValue<GameState>;alpha:SharedValue<number>;input:SharedValue<Input>}){
 const geometry=useDerivedValue(()=>{const s=game.value,c=s.combat;return roundedRoute({x:s.px+(s.x-s.px)*alpha.value,y:s.py+(s.y-s.py)*alpha.value},s.status==='playing'?c?.path??[]:[],c?.pathIndex??0,s.blockers);});
 const route=useDerivedValue(()=>{const p=Skia.Path.Make(),g=geometry.value;p.moveTo(g.start.x,g.start.y);for(const segment of g.segments){if(segment.kind==='curve')p.quadTo(segment.control.x,segment.control.y,segment.to.x,segment.to.y);else p.lineTo(segment.to.x,segment.to.y);}return p;});
 const arrow=useDerivedValue(()=>{const p=Skia.Path.Make(),points=geometry.value.arrow;if(points.length===3){p.moveTo(points[0]!.x,points[0]!.y);p.lineTo(points[1]!.x,points[1]!.y);p.lineTo(points[2]!.x,points[2]!.y);p.close();}return p;});
 const shots=(enemy:boolean)=>useDerivedValue(()=>{const p=Skia.Path.Make();for(const b of game.value.combat?.projectiles??[]){if((b.owner>=0)!==enemy)continue;const x=b.px+(b.x-b.px)*alpha.value,y=b.py+(b.y-b.py)*alpha.value;p.moveTo(x,y);p.lineTo(x-b.vx*.018,y-b.vy*.018);}return p;});
 const friendly=shots(false),hostile=shots(true);
 const target=useDerivedValue(()=>{const s=game.value,c=s.combat,o=(input.value.command&&(input.value.command.seq>(c?.commandSeen??0))?input.value.command:c?.order);if(!o||s.status!=='playing')return {x:0,y:0,opacity:0};const g=o.kind==='attack'?s.guards[o.target]:null;return {x:g?.x??o.x,y:g?.y??o.y,opacity:1};});
 const tx=useDerivedValue(()=>target.value.x),ty=useDerivedValue(()=>target.value.y),opacity=useDerivedValue(()=>target.value.opacity);
 const flash=useDerivedValue(()=>Math.max(0,game.value.combat?.flash??0)*2.5);
 const px=useDerivedValue(()=>game.value.px+(game.value.x-game.value.px)*alpha.value),py=useDerivedValue(()=>game.value.py+(game.value.y-game.value.py)*alpha.value-.5);
 return <>
  <Path path={route} color="#091A19" style="stroke" strokeWidth={.23} strokeCap="round" strokeJoin="round" opacity={.9}/>
  <Path path={route} color="#92D9C3" style="stroke" strokeWidth={.12} strokeCap="round" strokeJoin="round"/>
  <Path path={route} color="#E0FFF1" style="stroke" strokeWidth={.035} strokeCap="round" strokeJoin="round"/>
  <Path path={arrow} color="#091A19" style="stroke" strokeWidth={.085} strokeJoin="round"/>
  <Path path={arrow} color="#CCF8E6"/>
  <Circle cx={tx} cy={ty} r={TAP_RADIUS} color="#122B26" opacity={opacity}/>
  <Circle cx={tx} cy={ty} r={TAP_RADIUS} color="#D4FBE9" style="stroke" strokeWidth={.055} opacity={opacity}/>
  <Circle cx={tx} cy={ty} r={.055} color="#D4FBE9" opacity={opacity}/>
  <Path path={friendly} color="#D9FFE9" style="stroke" strokeWidth={.12}/><Path path={hostile} color="#FF9F60" style="stroke" strokeWidth={.12}/><Circle cx={px} cy={py} r={.7} color="#F87164" opacity={flash}/>
 </>;
}
