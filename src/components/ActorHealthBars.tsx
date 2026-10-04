import React,{useMemo} from 'react';
import {Group,RoundedRect,Text,useFont,type SkFont} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {stateLevel} from '../game/simulation';
import {BOSS_NAMES,type BossId} from '../../shared/campaign-levels';
type Props={game:SharedValue<GameState>;alpha:SharedValue<number>};
function Bar({game,alpha,index,font}:{game:Props['game'];alpha:Props['alpha'];index:number;font:SkFont}){
 const courier=index<0,g=game.value.guards[index],armored=g?.combatRole==='heavy'||g?.combatRole==='warden',bossId=courier?undefined:stateLevel(game.value).patrols[index]?.boss as BossId|undefined;
 const bossName=bossId?(BOSS_NAMES[bossId]??bossId).toUpperCase():'';
 const width=courier?1.22:armored?1.36:1.14;
 const lift=courier?.58:g?.combatRole==='drone'?.60:armored?.76:.55;
 // position interpolates every frame; health, label and text layout only change on simulation ticks
 const transform=useDerivedValue(()=>{const s=game.value,a=index<0?s:s.guards[index];if(!a)return [];return [{translateX:a.px+(a.x-a.px)*alpha.value-width/2},{translateY:a.py+(a.y-a.py)*alpha.value+lift}];});
 const state=useDerivedValue(()=>{
  const s=game.value,a=index<0?s:s.guards[index];
  if(!a)return {hp:0,max:1,opacity:0};
  return {hp:index<0?s.combat?.hp??0:s.guards[index]!.hp,max:index<0?100:s.guards[index]!.maxHp,
   opacity:index<0?(s.combat?1:0):s.guards[index]!.active&&s.guards[index]!.hp>0?1:0};
 });
 const opacity=useDerivedValue(()=>state.value.opacity),fill=useDerivedValue(()=>Math.max(0,Math.min(1,state.value.hp/state.value.max))*(width-.08));
 const label=useDerivedValue(()=>String(Math.max(0,Math.ceil(state.value.hp))));
 const digitWidths=useMemo(()=>font.getGlyphWidths(font.getGlyphIDs('0123456789')),[font]);
 const nameWidth=useMemo(()=>bossName?font.getGlyphWidths(font.getGlyphIDs(bossName)).reduce((a,b)=>a+b,0)*.0115:0,[font,bossName]);
 const textTransform=useDerivedValue(()=>[{translateX:width/2-label.value.split('').reduce((sum,d)=>sum+(digitWidths[Number(d)]??0),0)*.0125/2},{translateY:.025},{scale:.0125}]);
 return <Group transform={transform} opacity={opacity}>
  <RoundedRect x={-.04} y={-.015} width={width+.08} height={.20} r={.085} color="#071009"/>
  <RoundedRect x={0} y={.025} width={width} height={.12} r={.05} color="#35473A"/>
  <RoundedRect x={.04} y={.035} width={fill} height={.10} r={.045} color="#43F25D"/>
  <Group transform={textTransform}>
   <Text text={label} x={0} y={0} font={font} color="#080D09" style="stroke" strokeWidth={5.6} strokeJoin="round"/>
   <Text text={label} x={0} y={0} font={font} color="#FFFFFF"/>
  </Group>
  {!!bossName&&<Group transform={[{translateX:width/2-nameWidth/2},{translateY:.42},{scale:.0115}]}>
   <Text text={bossName} x={0} y={0} font={font} color="#1A0708" style="stroke" strokeWidth={5.2} strokeJoin="round"/>
   <Text text={bossName} x={0} y={0} font={font} color="#FFB3A6"/>
  </Group>}
 </Group>;
}
/** A single bundled font works identically in Skia on Android and CanvasKit. */
export default function ActorHealthBars({game,alpha}:Props){
 const font=useFont(require('../../assets/fonts/Barlow-Bold.ttf'),24);
 if(!font)return null;
 return <><Bar game={game} alpha={alpha} index={-1} font={font}/>{game.value.guards.map((_,index)=><Bar key={index} game={game} alpha={alpha} index={index} font={font}/>)}</>;
}
