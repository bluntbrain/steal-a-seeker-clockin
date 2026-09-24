import React from 'react';
import {Circle,Group,Oval,Path,DashPathEffect,RoundedRect,Skia} from '@shopify/react-native-skia';
import {useAnimatedReaction,useSharedValue,useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {defeatPose} from './guard-defeat';
import QuadDrone from './QuadDrone';
import {stateLevel} from '../game/simulation';
import {sightDistance} from '../game/guards';
import type {GameState} from '../game/simulation';
type Props={game:SharedValue<GameState>;alpha:SharedValue<number>;index:number;clock:SharedValue<number>;reduced?:boolean};
export default function GuardLayer({game,alpha,index,clock,reduced=false}:Props){
 const kind=stateLevel(game.value).patrols[index]?.kind;
 const role=game.value.guards[index]?.combatRole,armor=role==='heavy'||role==='warden',drone=role==='drone'||!game.value.combat&&kind==='scanner';
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
 const color=useDerivedValue(()=>{const g=game.value.guards[index];return !live.value?'#31424A':drone?(g?.heist?.broadcastUntil??0)>game.value.ticks?'#FF9477':g?.heist?.charge?'#EAD083':'#92D7C9':g?.seesPlayer?'#ff8169':'#dba961';});
 const armorFront=useDerivedValue(()=>armor&&game.value.guards[index]?.heist?.armorHit==='front'?Math.min(1,(game.value.guards[index]?.flash??0)*7):0);
 const armorRear=useDerivedValue(()=>armor&&game.value.guards[index]?.heist?.armorHit==='rear'?Math.min(1,(game.value.guards[index]?.flash??0)*7):0);
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
 const alertOpacity=useDerivedValue(()=>{const g=game.value.guards[index];return g?.brain&&g.active&&g.hp>0&&(g.seesPlayer&&g.exposure>=1||g.mode==='investigate'||g.mode==='search')?1:0;});
 const alertColor=useDerivedValue(()=>game.value.guards[index]?.seesPlayer?'#FF886F':'#E1C381');
 const lurePath=useDerivedValue(()=>{const p=Skia.Path.Make(),g=game.value.guards[index];if(!g||!g.active||g.seesPlayer||game.value.decoy.ttl<=0||g.lureId!==game.value.decoy.id||g.mode!=='investigate')return p;p.moveTo(g.x,g.y);for(let i=g.pathIndex;i<g.path.length;i++)p.lineTo(g.path[i]!.x,g.path[i]!.y);return p;});
 const listening=useDerivedValue(()=>{const g=game.value.guards[index];return g&&g.active&&!g.seesPlayer&&game.value.decoy.ttl>0&&g.lureId===game.value.decoy.id&&(g.mode==='investigate'||g.mode==='search')?1:0;});
 return <Group>
  <Group opacity={visible}>
  <Path path={lurePath} color="#CFE6E4" style="stroke" strokeWidth={.035} opacity={.65}><DashPathEffect intervals={[.12,.12]}/></Path><Path path={cone} color={color} opacity={opacity}/>
  <Path path={cone} color={color} opacity={opacity} style="stroke" strokeWidth={.025}/>
  <Path path={aim} color="#FF886F" style="stroke" strokeWidth={.045}><DashPathEffect intervals={[.13,.08]}/></Path><Group transform={pose}>
   <Oval x={-.42} y={-.39} width={.84} height={.84} color="#06080B" opacity={.65}/>
   {drone?<QuadDrone game={game} index={index} clock={clock} reduced={reduced}/>:<>
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
   {armor&&(game.value.definition?.combat?.revision??0)>=10&&<>
    <Path path="M .27 -.42 Q .62 0 .27 .42" color="#D4B87A" style="stroke" strokeWidth={.105} strokeCap="round"/>
    <Path path="M .34 -.49 Q .78 0 .34 .49" color="#FFE2A4" style="stroke" strokeWidth={.09} opacity={armorFront}/>
    <RoundedRect x={-.4} y={-.14} width={.12} height={.28} r={.035} color="#A7F2D5"/>
    <Circle cx={-.39} cy={0} r={.3} color="#C8FFE2" opacity={armorRear}/>
   </>}
  </Group>
  <Group transform={bar} opacity={live}><Group opacity={alertOpacity}><Circle cx={.45} cy={-.32} r={.19} color="#14221F"/><RoundedRect x={.425} y={-.45} width={.05} height={.16} r={.02} color={alertColor}/><Circle cx={.45} cy={-.22} r={.03} color={alertColor}/></Group><Circle cx={.45} cy={-.18} r={.13} color="#CFE6E4" opacity={listening}/><Circle cx={.45} cy={-.18} r={.065} color="#243F48" opacity={listening}/>
   <RoundedRect x={0} y={0} width={.9} height={.10} r={.04} color="#152023"/>
   <RoundedRect x={0} y={0} width={width} height={.10} r={.04} color={game.value.combat?'#BAE8CD':'#ff8169'}/>
  </Group>
 </Group>
 <Group transform={burstPose} opacity={burst}><Circle cx={0} cy={0} r={radius} color="#BDEADB" style="stroke" strokeWidth={.035}/><Path path={sparks} color={armor?'#E9C77D':'#CCF7E7'} style="stroke" strokeWidth={.065} strokeCap="round"/></Group>
 </Group>;
}
