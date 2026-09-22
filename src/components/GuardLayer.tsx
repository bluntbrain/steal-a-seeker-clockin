import React from 'react';
import {Circle,Group,Oval,Path,DashPathEffect,RoundedRect,Skia} from '@shopify/react-native-skia';
import {useAnimatedReaction,useSharedValue,useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {defeatPose} from './guard-defeat';
import {stateLevel} from '../game/simulation';
import {sightDistance} from '../game/guards';
import type {GameState} from '../game/simulation';
type Props={game:SharedValue<GameState>;alpha:SharedValue<number>;index:number;clock:SharedValue<number>;reduced?:boolean};
export default function GuardLayer({game,alpha,index,clock,reduced=false}:Props){
 const kind=stateLevel(game.value).patrols[index]?.kind;
 const role=game.value.guards[index]?.combatRole,armor=role==='heavy'||role==='warden',drone=role==='drone'||kind==='scanner';
 const death=useSharedValue({started:-100,x:0,y:0,angle:0,dx:0,dy:0});
 useAnimatedReaction(()=>{const g=game.value.guards[index];return {dead:!!game.value.combat&&!!g&&g.hp<=0,tick:game.value.ticks};},(next,previous)=>{
  if(!next.dead){if(death.value.started!==-100)death.value={...death.value,started:-100};return;}
  // Do not replay old deaths when restoring a scene or returning to its canvas.
  if(previous&&!previous.dead&&next.tick>=previous.tick){const g=game.value.guards[index]!;const dx=g.x-game.value.x,dy=g.y-game.value.y,d=Math.hypot(dx,dy)||1;death.value={started:clock.value,x:g.x,y:g.y,angle:g.angle,dx:dx/d,dy:dy/d};}
 });
 const fx=useDerivedValue(()=>defeatPose(clock.value-death.value.started,armor,drone,reduced));
 const live=useDerivedValue(()=>{const g=game.value.guards[index];return g&&(!game.value.combat||g.hp>0&&g.active)?1:0;});
 const visible=useDerivedValue(()=>live.value?1:fx.value.opacity);
 const pose=useDerivedValue(()=>{
  const g=game.value.guards[index];if(!g)return [];
  if(!live.value){const d=death.value,f=fx.value;return [{translateX:d.x+d.dx*f.recoil},{translateY:d.y+d.dy*f.recoil},{rotate:d.angle+f.rotation*(index%2?1:-1)},{scaleX:f.scaleX},{scaleY:f.scaleY}];}
  return [{translateX:g.px+(g.x-g.px)*alpha.value},{translateY:g.py+(g.y-g.py)*alpha.value},{rotate:g.angle}];
 });
 const burst=useDerivedValue(()=>!live.value?fx.value.burst:0),radius=useDerivedValue(()=>fx.value.radius);
 const burstPose=useDerivedValue(()=>[{translateX:death.value.x},{translateY:death.value.y}]);
 const sparks=useDerivedValue(()=>{const p=Skia.Path.Make();if(live.value||fx.value.burst<=0)return p;const r=fx.value.radius;for(let i=0;i<6;i++){const a=i*Math.PI/3+index*.7;p.moveTo(Math.cos(a)*r,Math.sin(a)*r);p.lineTo(Math.cos(a)*(r+.10),Math.sin(a)*(r+.10));}return p;});
 const aim=useDerivedValue(()=>{const p=Skia.Path.Make(),g=game.value.guards[index];if(!game.value.combat||!g?.active||g.hp<=0||g.gunPhase!=='aim')return p;const d=sightDistance(g.x,g.y,Math.cos(g.shotAngle),Math.sin(g.shotAngle),g.range,{...stateLevel(game.value),blockers:game.value.blockers});p.moveTo(g.x,g.y);p.lineTo(g.x+Math.cos(g.shotAngle)*d,g.y+Math.sin(g.shotAngle)*d);return p;});
 const color=useDerivedValue(()=>!live.value?'#31424A':game.value.guards[index]?.seesPlayer?'#ff8169':'#dba961');
 const opacity=useDerivedValue(()=>game.value.combat&&role==='drone'&&(game.value.definition?.combat?.revision??0)<7?0:game.value.guards[index]?.active?.14+(game.value.guards[index]?.exposure??0)*.25:0);
 const width=useDerivedValue(()=>game.value.combat?(game.value.guards[index]?.hp??0)/(game.value.guards[index]?.maxHp??1)*.9:(game.value.guards[index]?.exposure??0)*.9);
 const hitFlash=useDerivedValue(()=>live.value?Math.min(1,(game.value.guards[index]?.flash??0)*5):fx.value.flash);
 const bar=useDerivedValue(()=>{const g=game.value.guards[index];return [{translateX:(g?.x??0)-.45},{translateY:(g?.y??0)-.72}];});
 const cone=useDerivedValue(()=>{
  const p=Skia.Path.Make(),g=game.value.guards[index];if(!g||!live.value)return p;
  const x=g.px+(g.x-g.px)*alpha.value,y=g.py+(g.y-g.py)*alpha.value;p.moveTo(x,y);
  for(let i=0;i<=32;i++){
   const a=g.angle-g.halfAngle+2*g.halfAngle*i/32,dx=Math.cos(a),dy=Math.sin(a);
   const d=sightDistance(x,y,dx,dy,g.range,{...stateLevel(game.value),blockers:game.value.blockers});p.lineTo(x+dx*d,y+dy*d);
  }
  p.close();return p;
 });
 const lurePath=useDerivedValue(()=>{const p=Skia.Path.Make(),g=game.value.guards[index];if(!g||!g.active||g.seesPlayer||game.value.decoy.ttl<=0||g.lureId!==game.value.decoy.id||g.mode!=='investigate')return p;p.moveTo(g.x,g.y);for(let i=g.pathIndex;i<g.path.length;i++)p.lineTo(g.path[i]!.x,g.path[i]!.y);return p;});
 const listening=useDerivedValue(()=>{const g=game.value.guards[index];return g&&g.active&&!g.seesPlayer&&game.value.decoy.ttl>0&&g.lureId===game.value.decoy.id&&(g.mode==='investigate'||g.mode==='search')?1:0;});
 return <Group>
  <Group opacity={visible}>
  <Path path={lurePath} color="#CFE6E4" style="stroke" strokeWidth={.035} opacity={.65}><DashPathEffect intervals={[.12,.12]}/></Path><Path path={cone} color={color} opacity={opacity}/>
  <Path path={cone} color={color} opacity={opacity} style="stroke" strokeWidth={.025}/>
  <Path path={aim} color="#FF886F" style="stroke" strokeWidth={.045}><DashPathEffect intervals={[.13,.08]}/></Path><Group transform={pose}>
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
    {(kind==='warden'||armor)&&<>
     <RoundedRect x={-.16} y={-.55} width={.48} height={.23} r={.08} color="#9DAAAF"/>
     <RoundedRect x={-.16} y={.32} width={.48} height={.23} r={.08} color="#9DAAAF"/>
     <RoundedRect x={.15} y={-.56} width={.21} height={.22} r={.07} color="#333E47"/>
     <RoundedRect x={.15} y={.34} width={.21} height={.22} r={.07} color="#333E47"/>
    </>}
    <RoundedRect x={-.29} y={-.29} width={.6} height={.58} r={.12} color="#87969D"/>
    <RoundedRect x={-.28} y={-.3} width={.52} height={.58} r={.1} color={role==='sentry'?'#C9A579':armor?'#7D919A':'#DBE0DF'}/>
    <RoundedRect x={-.21} y={-.23} width={.26} height={.46} r={.07} color="#EDF0EB"/>
    <RoundedRect x={.04} y={-.23} width={.28} height={.46} r={.08} color="#111B20"/>
    <RoundedRect x={.16} y={-.15} width={.08} height={.1} r={.035} color={color}/>
    <RoundedRect x={.16} y={.05} width={.08} height={.1} r={.035} color={color}/>
    <RoundedRect x={-.16} y={-.06} width={.13} height={.12} r={.025} color="#AACFCC"/>
    {kind!=='warden'&&<Circle cx={-.32} cy={0} r={.05} color={color}/>}
   </>}
   <Circle cx={0} cy={0} r={.43} color="#F2FFDA" opacity={hitFlash}/>
  </Group>
  <Group transform={bar} opacity={live}><Circle cx={.45} cy={-.18} r={.13} color="#CFE6E4" opacity={listening}/><Circle cx={.45} cy={-.18} r={.065} color="#243F48" opacity={listening}/>
   <RoundedRect x={0} y={0} width={.9} height={.10} r={.04} color="#152023"/>
   <RoundedRect x={0} y={0} width={width} height={.10} r={.04} color={game.value.combat?'#BAE8CD':'#ff8169'}/>
  </Group>
 </Group>
 <Group transform={burstPose} opacity={burst}><Circle cx={0} cy={0} r={radius} color="#BDEADB" style="stroke" strokeWidth={.035}/><Path path={sparks} color={armor?'#E9C77D':'#CCF7E7'} style="stroke" strokeWidth={.065} strokeCap="round"/></Group>
 </Group>;
}
