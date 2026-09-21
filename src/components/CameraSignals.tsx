import React from 'react';
import {Group,Path,Skia} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {targetPhone,stateLevel} from '../game/simulation';
import {edgeMarker,type Camera} from '../camera/geometry';
export default function CameraSignals({camera,game,size}:{camera?:SharedValue<Camera>;game:SharedValue<GameState>;size:number}){
 const objective=useDerivedValue(()=>{
  const p=Skia.Path.Make();if(!camera||game.value.status!=='playing')return p;
  const s=game.value,l=stateLevel(s),target=s.carrying?{x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2}:targetPhone(s);
  const m=edgeMarker(target.x,target.y,size,camera.value);if(!m)return p;
  const dx=Math.cos(m.angle),dy=Math.sin(m.angle);p.moveTo(m.x+dx*8,m.y+dy*8);p.lineTo(m.x-dx*6-dy*6,m.y-dy*6+dx*6);p.lineTo(m.x-dx*6+dy*6,m.y-dy*6-dx*6);p.close();return p;
 });
 const threats=useDerivedValue(()=>{
  const p=Skia.Path.Make();if(!camera||game.value.status!=='playing')return p;
  for(const g of game.value.guards){if(!g.active||g.hp<=0||(!g.seesPlayer&&g.gunPhase!=='fire'))continue;
   const m=edgeMarker(g.x,g.y,size,camera.value);if(!m)continue;
   const dx=Math.cos(m.angle),dy=Math.sin(m.angle);p.moveTo(m.x-dx*5-dy*5,m.y-dy*5+dx*5);p.lineTo(m.x+dx*5,m.y+dy*5);p.lineTo(m.x-dx*5+dy*5,m.y-dy*5-dx*5);
  }return p;
 });
 return <Group><Path path={objective} color="#12221F" style="stroke" strokeWidth={4} strokeJoin="round"/><Path path={objective} color="#FFE096"/><Path path={threats} color="#0E171A" style="stroke" strokeWidth={6} strokeJoin="round"/><Path path={threats} color="#FF827A" style="stroke" strokeWidth={3} strokeJoin="round"/></Group>;
}
