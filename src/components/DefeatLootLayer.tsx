import React,{useMemo} from 'react';
import {Atlas,Circle,useRSXformBuffer,type SkImage} from '@shopify/react-native-skia';
import {useAnimatedReaction,useSharedValue,useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {addLoot,emptyLoot,newDefeats,lootCoin,lootPulse,LOOT_SLOTS,COINS_PER_DEFEAT} from './defeat-loot';

/** Fixed 80-sprite budget and one texture; no JS timers or React updates per coin. */
export default function DefeatLootLayer({game,clock,alpha,reduced,coin}:{game:SharedValue<GameState>;clock:SharedValue<number>;alpha:SharedValue<number>;reduced:boolean;coin:SkImage|null}){
 const pool=useSharedValue(emptyLoot());
 useAnimatedReaction(()=>({tick:game.value.ticks,hp:game.value.combat?game.value.guards.map(g=>g.hp):[]}), (next,previous)=>{
  // Restored corpses, canvas remounts and restart never replay their rewards.
  if(!previous||next.tick<previous.tick){pool.value=emptyLoot();return;}
  const ids=newDefeats(previous.hp,next.hp,previous.tick,next.tick);
  if(ids.length){const updated=pool.value.map(b=>({...b}));for(const id of ids){const g=game.value.guards[id]!;addLoot(updated,{started:clock.value,x:g.x,y:g.y,seed:id+next.tick%7});}pool.value=updated;}
 });
 const sprites=useMemo(()=>Array.from({length:LOOT_SLOTS*COINS_PER_DEFEAT},()=>({x:0,y:0,width:128,height:128})),[]);
 const transforms=useRSXformBuffer(LOOT_SLOTS*COINS_PER_DEFEAT,(transform,i)=>{
  'worklet';const s=game.value,p=lootCoin(pool.value[Math.floor(i/COINS_PER_DEFEAT)]!,i%COINS_PER_DEFEAT,clock.value,s.px+(s.x-s.px)*alpha.value,s.py+(s.y-s.py)*alpha.value,reduced);
  const scale=p.scale/128,a=Math.cos(p.angle)*scale,b=Math.sin(p.angle)*scale;
  transform.set(a,b,p.x-64*a+64*b,p.y-64*b-64*a);
 });
 const cx=useDerivedValue(()=>game.value.px+(game.value.x-game.value.px)*alpha.value);
 const cy=useDerivedValue(()=>game.value.py+(game.value.y-game.value.py)*alpha.value-.45);
 const pulse=useDerivedValue(()=>lootPulse(pool.value,clock.value,reduced));
 const pulseOpacity=useDerivedValue(()=>pulse.value.opacity),pulseRadius=useDerivedValue(()=>pulse.value.radius);
 return coin?<>
  <Circle cx={cx} cy={cy} r={pulseRadius} color="#FFE8A1" style="stroke" strokeWidth={.045} opacity={pulseOpacity}/>
  <Atlas image={coin} sprites={sprites} transforms={transforms}/>
 </>:null;
}
