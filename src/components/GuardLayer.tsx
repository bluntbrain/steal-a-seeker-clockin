import React from 'react';
import {Circle,Group,Image,Oval,Path,DashPathEffect,RoundedRect,usePathValue,type SkImage} from '@shopify/react-native-skia';
import {useAnimatedReaction,useSharedValue,useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {wallActorClip} from '../art/wall-depth';
import type {WallOcclusion} from '../art/wall-depth-art';
import {defeatPose} from './guard-defeat';
import QuadDrone from './QuadDrone';
import {ENEMY_ART_SCALE} from './enemy-presentation';
import {stateLevel} from '../game/simulation';
import {sightDistance} from '../game/guards';
import type {GameState} from '../game/simulation';
type Props={wallOcclusion?:WallOcclusion;game:SharedValue<GameState>;alpha:SharedValue<number>;index:number;clock:SharedValue<number>;reduced?:boolean;droneSprite:SkImage|null;guardSprite:SkImage|null;heavySprite:SkImage|null};
export default function GuardLayer({game,alpha,index,clock,reduced=false,droneSprite,guardSprite,heavySprite,wallOcclusion}:Props){
 const kind=stateLevel(game.value).patrols[index]?.kind;
 const role=game.value.guards[index]?.combatRole,armor=role==='heavy'||role==='warden',drone=role==='drone'||!game.value.combat&&kind==='scanner';
 const artScale=drone?ENEMY_ART_SCALE.drone:armor||kind==='warden'?ENEMY_ART_SCALE.heavy:ENEMY_ART_SCALE.guard;
 const wallClip=useDerivedValue(()=>{const g=game.value.guards[index];return wallActorClip(wallOcclusion,g?g.py+(g.y-g.py)*alpha.value:0,drone||!g);});
 const barWidth=.9*artScale,barLift=(drone?.90:armor||kind==='warden'?.75:.56)*artScale+.14;
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
 // paths are reused through usePathValue; sparks only draw during a defeat burst
 const sparks=usePathValue(p=>{'worklet';if(live.value||fx.value.burst<=0)return;const r=fx.value.radius;for(let i=0;i<6;i++){const a=i*Math.PI/3+index*.7;p.moveTo(Math.cos(a)*r,Math.sin(a)*r);p.lineTo(Math.cos(a)*(r+.10),Math.sin(a)*(r+.10));}});
 const aim=usePathValue(p=>{'worklet';const g=game.value.guards[index];if(!game.value.combat||!g?.active||g.hp<=0||g.gunPhase!=='aim')return;const d=sightDistance(g.x,g.y,Math.cos(g.shotAngle),Math.sin(g.shotAngle),g.range,{...stateLevel(game.value),blockers:game.value.blockers});p.moveTo(g.x,g.y);p.lineTo(g.x+Math.cos(g.shotAngle)*d,g.y+Math.sin(g.shotAngle)*d);});
 const color=useDerivedValue(()=>{const g=game.value.guards[index];return !live.value?'#31424A':drone?(g?.heist?.broadcastUntil??0)>game.value.ticks?'#FF9477':g?.heist?.charge?'#EAD083':'#92D7C9':g?.seesPlayer?'#ff8169':'#dba961';});
 const armorFront=useDerivedValue(()=>armor&&game.value.guards[index]?.heist?.armorHit==='front'?Math.min(1,(game.value.guards[index]?.flash??0)*7):0);
 const armorRear=useDerivedValue(()=>armor&&game.value.guards[index]?.heist?.armorHit==='rear'?Math.min(1,(game.value.guards[index]?.flash??0)*7):0);
 const opacity=useDerivedValue(()=>game.value.combat&&role==='drone'&&(game.value.definition?.combat?.revision??0)<7?0:game.value.guards[index]?.active?.14+(game.value.guards[index]?.exposure??0)*.25:0);
 const width=useDerivedValue(()=>game.value.combat?(game.value.guards[index]?.hp??0)/(game.value.guards[index]?.maxHp??1)*barWidth:(game.value.guards[index]?.exposure??0)*barWidth);
 const hitFlash=useDerivedValue(()=>live.value?Math.min(1,(game.value.guards[index]?.flash??0)*5):fx.value.flash);
 const bar=useDerivedValue(()=>{const g=game.value.guards[index];return [{translateX:(g?.x??0)-barWidth/2},{translateY:(g?.y??0)-barLift}];});
 // the cone is cast once per simulation tick from the guard's tick position and drawn from there. it reads only
 // `game`, so it does not rerun on interpolation frames, and a wall-clipped shape is never shifted off its clip.
 // the apex trails the interpolated sprite by at most one tick of movement.
 const cone=usePathValue(p=>{
  'worklet';const s=game.value,g=s.guards[index];if(!g||!live.value)return;
  const level={...stateLevel(s),blockers:s.blockers},x=g.x,y=g.y;p.moveTo(x,y);
  for(let i=0;i<=32;i++){
   const a=g.angle-g.halfAngle+2*g.halfAngle*i/32,dx=Math.cos(a),dy=Math.sin(a);
   const d=sightDistance(x,y,dx,dy,g.range,level);p.lineTo(x+dx*d,y+dy*d);
  }
  p.close();
 });
 // "?" while the guard is turning toward a glimpse or walking to a noise, "!" once the courier is confirmed or the guard hunts
 const exclaimOpacity=useDerivedValue(()=>{const g=game.value.guards[index];return g?.brain&&g.active&&g.hp>0&&(g.seesPlayer&&g.exposure>=1||!!g.heist?.hunting)?1:0;});
 const questionOpacity=useDerivedValue(()=>{const g=game.value.guards[index];if(!g?.brain||!g.active||g.hp<=0||g.seesPlayer&&g.exposure>=1||g.heist?.hunting)return 0;return g.seesPlayer&&g.exposure>0||g.mode==='investigate'||g.mode==='search'?1:0;});
 const questionMark=usePathValue(p=>{'worklet';const cx=barWidth/2,cy=-.33;p.moveTo(cx-.085,cy-.07);p.quadTo(cx-.085,cy-.17,cx,cy-.17);p.quadTo(cx+.09,cy-.17,cx+.09,cy-.08);p.quadTo(cx+.09,cy-.01,cx+.01,cy);p.lineTo(cx,cy+.035);});
 const lurePath=usePathValue(p=>{'worklet';const g=game.value.guards[index];if(!g||!g.active||g.seesPlayer||game.value.decoy.ttl<=0||g.lureId!==game.value.decoy.id||g.mode!=='investigate')return;p.moveTo(g.x,g.y);for(let i=g.pathIndex;i<g.path.length;i++)p.lineTo(g.path[i]!.x,g.path[i]!.y);});
 const listening=useDerivedValue(()=>{const g=game.value.guards[index];return g&&g.active&&!g.seesPlayer&&game.value.decoy.ttl>0&&g.lureId===game.value.decoy.id&&(g.mode==='investigate'||g.mode==='search')?1:0;});
 return <Group>
  <Group opacity={visible}>
  <Path path={lurePath} color="#CFE6E4" style="stroke" strokeWidth={.035} opacity={.65}><DashPathEffect intervals={[.12,.12]}/></Path><Path path={cone} color={color} opacity={opacity}/>
  <Path path={cone} color={color} opacity={opacity} style="stroke" strokeWidth={.025}/>
  <Path path={aim} color="#FF886F" style="stroke" strokeWidth={.045}><DashPathEffect intervals={[.13,.08]}/></Path><Group clip={wallClip}><Group transform={pose}><Group transform={[{scale:artScale}]}>
   <Oval x={-.42} y={-.39} width={.84} height={.84} color="#06080B" opacity={.65}/>
   {drone?<QuadDrone game={game} index={index} clock={clock} reduced={reduced} sprite={droneSprite}/>:<Image image={armor||kind==='warden'?heavySprite:guardSprite} x={armor||kind==='warden'?-.59:-.52} y={armor||kind==='warden'?-.59:-.52} width={armor||kind==='warden'?1.18:1.04} height={armor||kind==='warden'?1.18:1.04} fit="contain"/>}
   <Circle cx={0} cy={0} r={.43} color="#F2FFDA" opacity={hitFlash}/>
   {armor&&(game.value.definition?.combat?.revision??0)>=10&&<>
    <Path path="M .34 -.49 Q .78 0 .34 .49" color="#FFE2A4" style="stroke" strokeWidth={.09} opacity={armorFront}/>
    <Circle cx={-.39} cy={0} r={.3} color="#C8FFE2" opacity={armorRear}/>
   </>}
  </Group></Group></Group>
  <Group transform={bar} opacity={live}><Group opacity={exclaimOpacity}><Circle cx={barWidth/2} cy={-.32} r={.19} color="#14221F"/><RoundedRect x={barWidth/2-.03} y={-.45} width={.06} height={.16} r={.025} color="#FF6B5A"/><Circle cx={barWidth/2} cy={-.21} r={.035} color="#FF6B5A"/></Group><Group opacity={questionOpacity}><Circle cx={barWidth/2} cy={-.32} r={.19} color="#14221F"/><Path path={questionMark} color="#F2C96B" style="stroke" strokeWidth={.045} strokeCap="round" strokeJoin="round"/><Circle cx={barWidth/2} cy={-.22} r={.032} color="#F2C96B"/></Group><Circle cx={barWidth/2} cy={-.18} r={.13} color="#CFE6E4" opacity={listening}/><Circle cx={barWidth/2} cy={-.18} r={.065} color="#243F48" opacity={listening}/>
   {!game.value.combat&&<RoundedRect x={0} y={0} width={barWidth} height={.10} r={.04} color="#152023"/>}
   {!game.value.combat&&<RoundedRect x={0} y={0} width={width} height={.10} r={.04} color="#ff8169"/>}
  </Group>
 </Group>
 <Group transform={burstPose} opacity={burst}><Circle cx={0} cy={0} r={radius} color="#BDEADB" style="stroke" strokeWidth={.035}/><Path path={sparks} color={armor?'#E9C77D':'#CCF7E7'} style="stroke" strokeWidth={.065} strokeCap="round"/></Group>
 </Group>;
}
