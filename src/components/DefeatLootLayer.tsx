import React from 'react';
import {Atlas,Circle,Path,usePathValue,useRSXformBuffer,type SkImage} from '@shopify/react-native-skia';
import {useAnimatedReaction,useSharedValue,useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {addLoot,emptyLoot,newDefeats,lootCoin,lootPulse,LOOT_SLOTS,COINS_PER_DEFEAT} from './defeat-loot';
const COUNT=LOOT_SLOTS*COINS_PER_DEFEAT,HISTORY=6;
/** Bounded UI-thread particles, six actual previous positions per coin, two batched trail paths. */
export default function DefeatLootLayer({game,clock,alpha,reduced,coin}:{game:SharedValue<GameState>;clock:SharedValue<number>;alpha:SharedValue<number>;reduced:boolean;coin:SkImage|null}){
 const pool=useSharedValue(emptyLoot()),history=useSharedValue(Array(COUNT*HISTORY*2).fill(0)),births=useSharedValue(Array(COUNT).fill(-100));
 useAnimatedReaction(()=>({tick:game.value.ticks,hp:game.value.combat?game.value.guards.map(g=>g.hp):[]}), (next,previous)=>{
  if(!previous||next.tick<previous.tick){pool.value=emptyLoot();births.value=Array(COUNT).fill(-100);return;}
  const ids=newDefeats(previous.hp,next.hp,previous.tick,next.tick);
  if(ids.length){const updated=pool.value.map(b=>({...b}));for(const id of ids){const g=game.value.guards[id]!;addLoot(updated,{started:clock.value,x:g.x,y:g.y,seed:id+next.tick%7});}pool.value=updated;}
 });
 const poses=useDerivedValue(()=>{const s=game.value;return Array.from({length:COUNT},(_,i)=>lootCoin(pool.value[Math.floor(i/COINS_PER_DEFEAT)]!,i%COINS_PER_DEFEAT,clock.value,s.px+(s.x-s.px)*alpha.value,s.py+(s.y-s.py)*alpha.value,reduced));});
 useAnimatedReaction(()=>clock.value,(time,previous)=>{
  if(reduced||previous===time)return;
  history.modify(h=>{'worklet';for(let i=0;i<COUNT;i++){const p=poses.value[i]!,b=pool.value[Math.floor(i/COINS_PER_DEFEAT)]!,o=i*HISTORY*2;
   if(!p.scale||p.flight===0||births.value[i]!==b.started){for(let j=0;j<HISTORY;j++){h[o+j*2]=p.x;h[o+j*2+1]=p.y;}}
   else {for(let j=HISTORY-1;j>0;j--){h[o+j*2]=h[o+(j-1)*2];h[o+j*2+1]=h[o+(j-1)*2+1];}h[o]=p.x;h[o+1]=p.y;}
  }return h;});
  births.modify(b=>{'worklet';for(let i=0;i<COUNT;i++)b[i]=pool.value[Math.floor(i/COINS_PER_DEFEAT)]!.started;return b;});
 });
 const tail=usePathValue(path=>{'worklet';if(reduced)return;const h=history.value;for(let i=0;i<COUNT;i++){const p=poses.value[i]!;if(p.scale<=0||p.flight<=0||p.flight>=1)continue;const o=i*HISTORY*2;path.moveTo(h[o]!,h[o+1]!);for(let j=1;j<HISTORY;j++)path.lineTo(h[o+j*2]!,h[o+j*2+1]!);}});
 const core=usePathValue(path=>{'worklet';if(reduced)return;const h=history.value;for(let i=0;i<COUNT;i++){const p=poses.value[i]!;if(p.scale<=0||p.flight<=0||p.flight>=1)continue;const o=i*HISTORY*2;path.moveTo(p.x,p.y);path.lineTo(h[o+2]!,h[o+3]!);path.lineTo(h[o+4]!,h[o+5]!);}});
 const sprites=useDerivedValue(()=>poses.value.map(p=>({x:p.frame%3*128,y:Math.floor(p.frame/3)*128,width:128,height:128})));
 const transforms=useRSXformBuffer(COUNT,(transform,i)=>{'worklet';const p=poses.value[i]!,scale=p.scale/128,a=Math.cos(p.angle)*scale,b=Math.sin(p.angle)*scale;transform.set(a,b,p.x-64*a+64*b,p.y-64*b-64*a);});
 const cx=useDerivedValue(()=>game.value.px+(game.value.x-game.value.px)*alpha.value),cy=useDerivedValue(()=>game.value.py+(game.value.y-game.value.py)*alpha.value-.18);
 const pulse=useDerivedValue(()=>lootPulse(pool.value,clock.value,reduced)),opacity=useDerivedValue(()=>pulse.value.opacity),radius=useDerivedValue(()=>pulse.value.radius);
 return coin?<><Path path={tail} color="#E8B953" style="stroke" strokeWidth={.065} strokeCap="round" opacity={.38}/><Path path={core} color="#FFF3C4" style="stroke" strokeWidth={.035} strokeCap="round" opacity={.85}/><Circle cx={cx} cy={cy} r={radius} color="#BAF5D9" style="stroke" strokeWidth={.045} opacity={opacity}/><Atlas image={coin} sprites={sprites} transforms={transforms}/></>:null;
}
