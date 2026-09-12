import React from 'react';
import {Circle,Group,Oval,Path,DashPathEffect,RoundedRect,Skia} from '@shopify/react-native-skia';
import {useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {getLevel} from '../game/level';
import {sightDistance} from '../game/guards';
import type {GameState} from '../game/simulation';
type Props={game:SharedValue<GameState>;alpha:SharedValue<number>;index:number};
export default function GuardLayer({game,alpha,index}:Props){
 const pose=useDerivedValue(()=>{const g=game.value.guards[index];return g?[{translateX:g.px+(g.x-g.px)*alpha.value},{translateY:g.py+(g.y-g.py)*alpha.value},{rotate:g.angle}]:[];});
 const kind=getLevel(game.value.mission).patrols[index]?.kind;
 const visible=useDerivedValue(()=>game.value.guards[index]?1:0);
 const color=useDerivedValue(()=>game.value.guards[index]?.seesPlayer?'#ff8169':'#dba961');
 const opacity=useDerivedValue(()=>game.value.guards[index]?.active?.14+(game.value.guards[index]?.exposure??0)*.25:0);
 const width=useDerivedValue(()=>(game.value.guards[index]?.exposure??0)*.9);
 const bar=useDerivedValue(()=>{const g=game.value.guards[index];return [{translateX:(g?.x??0)-.45},{translateY:(g?.y??0)-.72}];});
 const cone=useDerivedValue(()=>{
  const p=Skia.Path.Make(),g=game.value.guards[index];if(!g)return p;
  const x=g.px+(g.x-g.px)*alpha.value,y=g.py+(g.y-g.py)*alpha.value;p.moveTo(x,y);
  for(let i=0;i<=32;i++){
   const a=g.angle-g.halfAngle+2*g.halfAngle*i/32,dx=Math.cos(a),dy=Math.sin(a);
   const d=sightDistance(x,y,dx,dy,g.range,{...getLevel(game.value.mission),blockers:game.value.blockers});p.lineTo(x+dx*d,y+dy*d);
  }
  p.close();return p;
 });
 const lurePath=useDerivedValue(()=>{const p=Skia.Path.Make(),g=game.value.guards[index];if(!g||!g.active||g.seesPlayer||game.value.decoy.ttl<=0||g.lureId!==game.value.decoy.id||g.mode!=='investigate')return p;p.moveTo(g.x,g.y);for(let i=g.pathIndex;i<g.path.length;i++)p.lineTo(g.path[i]!.x,g.path[i]!.y);return p;});
 const listening=useDerivedValue(()=>{const g=game.value.guards[index];return g&&g.active&&!g.seesPlayer&&game.value.decoy.ttl>0&&g.lureId===game.value.decoy.id&&(g.mode==='investigate'||g.mode==='search')?1:0;});
 return <Group opacity={visible}>
  <Path path={lurePath} color="#CFE6E4" style="stroke" strokeWidth={.035} opacity={.65}><DashPathEffect intervals={[.12,.12]}/></Path><Path path={cone} color={color} opacity={opacity}/>
  <Path path={cone} color={color} opacity={opacity} style="stroke" strokeWidth={.025}/>
  <Group transform={pose}>
   <Oval x={-.42} y={-.39} width={.84} height={.84} color="#06080B" opacity={.65}/>
   {kind==='scanner'?<>
    <RoundedRect x={-.14} y={-.45} width={.28} height={.15} r={.065} color="#A7C9CC"/>
    <RoundedRect x={-.14} y={.30} width={.28} height={.15} r={.065} color="#A7C9CC"/>
    <Circle cx={0} cy={0} r={.34} color="#CED5D8"/>
    <Circle cx={.07} cy={0} r={.25} color="#181E25"/>
    <Circle cx={.09} cy={0} r={.14} color={color}/>
    <Circle cx={.09} cy={0} r={.075} color="#161618"/>
    <Circle cx={.11} cy={-.06} r={.04} color="#F6F6F5"/>
   </>:<>
    <RoundedRect x={-.28} y={-.39} width={.47} height={.19} r={.075} color="#11151C"/>
    <RoundedRect x={-.28} y={.2} width={.47} height={.19} r={.075} color="#11151C"/>
    {kind==='warden'&&<>
     <RoundedRect x={-.16} y={-.55} width={.48} height={.23} r={.08} color="#9DAAAF"/>
     <RoundedRect x={-.16} y={.32} width={.48} height={.23} r={.08} color="#9DAAAF"/>
     <RoundedRect x={.15} y={-.56} width={.21} height={.22} r={.07} color="#333E47"/>
     <RoundedRect x={.15} y={.34} width={.21} height={.22} r={.07} color="#333E47"/>
    </>}
    <RoundedRect x={-.29} y={-.29} width={.6} height={.58} r={.12} color="#87969D"/>
    <RoundedRect x={-.28} y={-.3} width={.52} height={.58} r={.1} color="#DBE0DF"/>
    <RoundedRect x={-.21} y={-.23} width={.26} height={.46} r={.07} color="#EDF0EB"/>
    <RoundedRect x={.04} y={-.23} width={.28} height={.46} r={.08} color="#111B20"/>
    <RoundedRect x={.16} y={-.15} width={.08} height={.1} r={.035} color={color}/>
    <RoundedRect x={.16} y={.05} width={.08} height={.1} r={.035} color={color}/>
    <RoundedRect x={-.16} y={-.06} width={.13} height={.12} r={.025} color="#AACFCC"/>
    {kind!=='warden'&&<Circle cx={-.32} cy={0} r={.05} color={color}/>}
   </>}
  </Group>
  <Group transform={bar}><Circle cx={.45} cy={-.18} r={.13} color="#CFE6E4" opacity={listening}/><Circle cx={.45} cy={-.18} r={.065} color="#243F48" opacity={listening}/>
   <RoundedRect x={0} y={0} width={.9} height={.10} r={.04} color="#152023"/>
   <RoundedRect x={0} y={0} width={width} height={.10} r={.04} color="#ff8169"/>
  </Group>
 </Group>;
}
