import React from 'react';
import {Circle,Group,Line,Path,RoundedRect} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import type {LevelDefinition} from '../game/level';

/** Movement-triggered noisy metal, deliberately distinct from solid wall art. */
export default function EncounterFloor({level,game,reduced}:{level:LevelDefinition;game:SharedValue<GameState>;reduced:boolean}){
 const pulse=useDerivedValue(()=>{const n=game.value.combat?.grateNoise;return n?Math.max(0,(n.until-game.value.ticks)/30):0;});
 const x=useDerivedValue(()=>game.value.combat?.grateNoise?.x??0),y=useDerivedValue(()=>game.value.combat?.grateNoise?.y??0);
 const radius=useDerivedValue(()=>reduced?.8:.4+(1-pulse.value)*2.2);
 return <Group>
  {(level.encounter?.grates??[]).map((r,i)=><Group key={i}>
   <RoundedRect x={r.x-.06} y={r.y-.06} width={r.w+.12} height={r.h+.12} r={.08} color="#566E73"/>
   <RoundedRect x={r.x} y={r.y} width={r.w} height={r.h} r={.04} color="#142126"/>
   {Array.from({length:Math.max(3,Math.floor(r.h/.16))},(_,j)=><Line key={j} p1={{x:r.x+.08,y:r.y+.10+j*.16}} p2={{x:r.x+r.w-.08,y:r.y+.10+j*.16}} color="#8A9F9E" strokeWidth={.065}/>)}
   <Path path={`M${r.x+.05} ${r.y-.18} L${r.x+.23} ${r.y-.35} L${r.x+.40} ${r.y-.18}`} color="#D4BD84" style="stroke" strokeWidth={.05}/>
  </Group>)}
  <Circle cx={x} cy={y} r={radius} color="#E5CA89" style="stroke" strokeWidth={.04} opacity={pulse}/>
 </Group>;
}
