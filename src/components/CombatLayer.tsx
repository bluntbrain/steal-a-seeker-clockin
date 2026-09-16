import React from 'react';
import {Circle,Path,Skia,DashPathEffect} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
export default function CombatLayer({game}:{game:SharedValue<GameState>}){
 const route=useDerivedValue(()=>{const p=Skia.Path.Make(),s=game.value,c=s.combat;if(!c)return p;p.moveTo(s.x,s.y);for(let i=c.pathIndex;i<c.path.length;i++)p.lineTo(c.path[i]!.x,c.path[i]!.y);return p;});
 const shots=(enemy:boolean)=>useDerivedValue(()=>{const p=Skia.Path.Make();for(const b of game.value.combat?.projectiles??[]){if((b.owner>=0)!==enemy)continue;p.moveTo(b.x,b.y);p.lineTo(b.x-b.vx*.018,b.y-b.vy*.018);}return p;});
 const friendly=shots(false),hostile=shots(true);
 const target=useDerivedValue(()=>{const s=game.value,c=s.combat,o=c?.order;if(!o)return {x:0,y:0,opacity:0};const g=o.kind==='attack'?s.guards[o.target]:null;return {x:g?.x??o.x,y:g?.y??o.y,opacity:1};});
 const tx=useDerivedValue(()=>target.value.x),ty=useDerivedValue(()=>target.value.y),opacity=useDerivedValue(()=>target.value.opacity);
 const flash=useDerivedValue(()=>Math.max(0,game.value.combat?.flash??0)*2.5);
 const px=useDerivedValue(()=>game.value.x),py=useDerivedValue(()=>game.value.y-.5);
 return <><Path path={route} color="#BCEAD3" style="stroke" strokeWidth={.045} opacity={.5}><DashPathEffect intervals={[.13,.13]}/></Path><Circle cx={tx} cy={ty} r={.5} color="#C5F5D6" style="stroke" strokeWidth={.055} opacity={opacity}/><Path path={friendly} color="#D9FFE9" style="stroke" strokeWidth={.12}/><Path path={hostile} color="#FF9F60" style="stroke" strokeWidth={.12}/><Circle cx={px} cy={py} r={.7} color="#F87164" opacity={flash}/></>;
}
