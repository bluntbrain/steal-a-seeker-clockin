import React from 'react';
import {Circle,Path,usePathValue} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {Input,GameState} from '../game/simulation';
import {roundedRoute,TAP_RADIUS} from './routeGeometry';
export default function CombatLayer({game,alpha,input,reduced=false}:{game:SharedValue<GameState>;alpha:SharedValue<number>;input:SharedValue<Input>;reduced?:boolean}){
 // corner rounding checks every blocker, so it runs once per simulation tick from the tick position;
 // only the first point is interpolated per frame
 const geometry=useDerivedValue(()=>{const s=game.value,c=s.combat;return roundedRoute({x:s.x,y:s.y},s.status==='playing'?c?.path??[]:[],c?.pathIndex??0,s.blockers);});
 const route=usePathValue(p=>{'worklet';const s=game.value,g=geometry.value;p.moveTo(s.px+(s.x-s.px)*alpha.value,s.py+(s.y-s.py)*alpha.value);for(const segment of g.segments){if(segment.kind==='curve')p.quadTo(segment.control.x,segment.control.y,segment.to.x,segment.to.y);else p.lineTo(segment.to.x,segment.to.y);}});
 const arrow=usePathValue(p=>{'worklet';const points=geometry.value.arrow;if(points.length===3){p.moveTo(points[0]!.x,points[0]!.y);p.lineTo(points[1]!.x,points[1]!.y);p.lineTo(points[2]!.x,points[2]!.y);p.close();}});
 const shots=(enemy:boolean)=>usePathValue(p=>{'worklet';for(const b of game.value.combat?.projectiles??[]){if((b.owner>=0)!==enemy)continue;const x=b.px+(b.x-b.px)*alpha.value,y=b.py+(b.y-b.py)*alpha.value;p.moveTo(x,y);p.lineTo(x-b.vx*.018,y-b.vy*.018);}});
 const friendly=shots(false),hostile=shots(true);
 const target=useDerivedValue(()=>{const s=game.value,c=s.combat,o=(input.value.command&&(input.value.command.seq>(c?.commandSeen??0))?input.value.command:c?.order);if(!o||s.status!=='playing')return {x:0,y:0,opacity:0,attack:false};const g=o.kind==='attack'?s.guards[o.target]:null;return {x:g?g.px+(g.x-g.px)*alpha.value:o.x,y:g?g.py+(g.y-g.py)*alpha.value:o.y,opacity:g&&(!g.active||g.hp<=0)?0:1,attack:!!g};});
 // the route starts under the courier; only the destination dot fades before arrival
 const courierCenter=useDerivedValue(()=>{const s=game.value;return {x:s.px+(s.x-s.px)*alpha.value,y:s.py+(s.y-s.py)*alpha.value-((s.definition?.combat?.revision??0)>=15?0:.7)};});
 const tx=useDerivedValue(()=>target.value.x),ty=useDerivedValue(()=>target.value.y);
 const opacity=useDerivedValue(()=>{
  const t=target.value,c=courierCenter.value;
  // Fade out before arrival instead of leaving the destination dot over the character.
  return t.attack?0:t.opacity*Math.max(0,Math.min(1,(Math.hypot(t.x-c.x,t.y-c.y)-1.3)/.3));
 });
 const reticle=usePathValue(p=>{
  'worklet';const t=target.value;if(!t.attack||!t.opacity)return;
  const pulse=reduced?0:Math.sin(game.value.elapsed*7)*.035;
  for(let i=0;i<4;i++){
   const angle=Math.PI/4+i*Math.PI/2,dx=Math.cos(angle),dy=Math.sin(angle);
   const tip=.66+pulse,base=.98+pulse,half=.16;
   p.moveTo(t.x+dx*tip,t.y+dy*tip);
   p.lineTo(t.x+dx*base-dy*half,t.y+dy*base+dx*half);
   p.lineTo(t.x+dx*base+dy*half,t.y+dy*base-dx*half);p.close();
  }
 });
 const routeColor=useDerivedValue(()=>target.value.attack?'#FFB52E':'#92D9C3');
 const flash=useDerivedValue(()=>Math.max(0,game.value.combat?.flash??0)*2.5);
 const px=useDerivedValue(()=>game.value.px+(game.value.x-game.value.px)*alpha.value),py=useDerivedValue(()=>game.value.py+(game.value.y-game.value.py)*alpha.value-.5);
 return <>
  <Path path={route} color="#091A19" style="stroke" strokeWidth={.23} strokeCap="round" strokeJoin="round" opacity={.9}/>
  <Path path={route} color={routeColor} style="stroke" strokeWidth={.12} strokeCap="round" strokeJoin="round"/>
  <Path path={route} color="#E0FFF1" style="stroke" strokeWidth={.035} strokeCap="round" strokeJoin="round"/>
  <Path path={arrow} color="#091A19" style="stroke" strokeWidth={.085} strokeJoin="round"/>
  <Path path={arrow} color="#CCF8E6"/>
  <Circle cx={tx} cy={ty} r={TAP_RADIUS} color="#122B26" opacity={opacity}/>
  <Circle cx={tx} cy={ty} r={TAP_RADIUS} color="#D4FBE9" style="stroke" strokeWidth={.055} opacity={opacity}/>
  <Circle cx={tx} cy={ty} r={.055} color="#D4FBE9" opacity={opacity}/>
  <Path path={reticle} color="#5E3304" style="stroke" strokeWidth={.075} strokeJoin="round"/><Path path={reticle} color="#FFB52E"/>
  <Path path={friendly} color="#D9FFE9" style="stroke" strokeWidth={.12}/><Path path={hostile} color="#FF9F60" style="stroke" strokeWidth={.12}/><Circle cx={px} cy={py} r={.7} color="#F87164" opacity={flash}/>
 </>;
}
