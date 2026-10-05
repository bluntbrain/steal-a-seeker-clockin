import React,{useMemo} from 'react';
import {Skia,Atlas,Circle,Group,Image,Path,DashPathEffect,RoundedRect,Oval,Rect,usePathValue,type SkImage} from '@shopify/react-native-skia';
import {useAnimatedReaction,useSharedValue,useDerivedValue,type SharedValue} from 'react-native-reanimated';
import {wallActorClip} from '../art/wall-depth';
import type {WallOcclusion} from '../art/wall-depth-art';
import {defeatPose} from './guard-defeat';
import QuadDrone from './QuadDrone';
import {bossWalkFrame,bossFlash} from './boss-motion';
import {bossTrait} from '../game/heist-guards-v17';
import {ENEMY_ART_SCALE} from './enemy-presentation';
import {stateLevel} from '../game/simulation';
import {sightDistance} from '../game/guards';
import type {GameState} from '../game/simulation';
type Props={wallOcclusion?:WallOcclusion;game:SharedValue<GameState>;alpha:SharedValue<number>;index:number;clock:SharedValue<number>;reduced?:boolean;droneSprite:SkImage|null;guardSprite:SkImage|null;heavySprite:SkImage|null;bossSprite?:SkImage|null;bossWalk?:SkImage|null;defeatSprite:SkImage|null;bossDefeat?:SkImage|null};
export default function GuardLayer({game,alpha,index,clock,reduced=false,droneSprite,guardSprite,heavySprite,bossSprite=null,bossWalk=null,defeatSprite,bossDefeat=null,wallOcclusion}:Props){
 const kind=stateLevel(game.value).patrols[index]?.kind,boss=!!stateLevel(game.value).patrols[index]?.boss&&!!bossSprite;
 const role=game.value.guards[index]?.combatRole,armor=role==='heavy'||role==='warden',drone=role==='drone'||!game.value.combat&&kind==='scanner';
 const artScale=drone?ENEMY_ART_SCALE.drone:boss?ENEMY_ART_SCALE.guard*1.5:armor||kind==='warden'?ENEMY_ART_SCALE.heavy:ENEMY_ART_SCALE.guard;
 const wallClip=useDerivedValue(()=>{const g=game.value.guards[index];return wallActorClip(wallOcclusion,g?g.py+(g.y-g.py)*alpha.value:0,drone||!g);});
 const barWidth=.9*artScale,barLift=(drone?.90:armor||kind==='warden'?.75:.56)*artScale+.14;
 const travelled=useSharedValue(0);
 useAnimatedReaction(()=>{const g=game.value.guards[index];return {x:g?.x??0,y:g?.y??0,tick:game.value.ticks};},(now,old)=>{if(!old||now.tick<old.tick){travelled.value=0;return;}if(now.tick!==old.tick)travelled.value+=Math.hypot(now.x-old.x,now.y-old.y);});
 const walkFrame=useDerivedValue(()=>{const g=game.value.guards[index],moving=!!g&&Math.hypot(g.x-g.px,g.y-g.py)>.001;return [{x:bossWalkFrame(travelled.value,moving)*256,y:0,width:256,height:256}];});
 const breathing=useDerivedValue(()=>{const g=game.value.guards[index];return boss&&!reduced&&g&&g.hp>0&&Math.hypot(g.x-g.px,g.y-g.py)<.001?1+Math.sin(clock.value*2)*.02:1;});
 const actorScale=useDerivedValue(()=>[{scale:artScale*breathing.value}]);
 const walkTransform=useMemo(()=>[Skia.RSXform(1.5/256,0,-.75,-.75)],[]);
 const death=useSharedValue({started:-100,x:0,y:0,angle:0,dx:0,dy:0});
 useAnimatedReaction(()=>{const g=game.value.guards[index];return {dead:!!game.value.combat&&!!g&&g.hp<=0,tick:game.value.ticks};},(next,previous)=>{
  if(!next.dead){if(death.value.started!==-100)death.value={...death.value,started:-100};return;}
  // Do not replay old deaths when restoring a scene or returning to its canvas.
  if(previous&&!previous.dead&&next.tick>=previous.tick){const g=game.value.guards[index]!;const dx=g.x-game.value.x,dy=g.y-game.value.y,d=Math.hypot(dx,dy)||1;death.value={started:clock.value,x:g.x,y:g.y,angle:g.angle,dx:dx/d,dy:dy/d};}
  // a scene restored with a dead guard shows the body where it fell, without the fall animation
  else if(death.value.started===-100){const g=game.value.guards[index]!;death.value={started:-1000,x:g.x,y:g.y,angle:g.angle,dx:0,dy:0};}
 });
 const fx=useDerivedValue(()=>defeatPose(clock.value-death.value.started,armor,drone,reduced));
 const live=useDerivedValue(()=>{const g=game.value.guards[index];return g&&(!game.value.combat||g.hp>0&&g.active)?1:0;});
 // in combat the body stays on the floor after the fall so other guards can find it
 const visible=useDerivedValue(()=>live.value?1:Math.max(fx.value.opacity,game.value.combat?.68:0));
 const fallen=useDerivedValue(()=>live.value?0:1);
 const deathFrames=useDerivedValue(()=>{const f=fx.value.frame;return [{x:(boss&&bossDefeat?f%2:f)*256,y:(boss&&bossDefeat?Math.floor(f/2):drone?2:armor||kind==='warden'?1:0)*256,width:256,height:256}];});
 const deathSize=drone?1.85:boss?1.72:armor||kind==='warden'?1.42:1.28;
 const deathTransforms=useMemo(()=>[Skia.RSXform(deathSize/256,0,-deathSize/2,-deathSize/2)],[deathSize]);
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
 const winded=useDerivedValue(()=>boss&&!reduced&&stateLevel(game.value).patrols[index]?.boss==='akshay'&&game.value.guards[index]?.gunPhase==='recover'&&live.value?.24:0);
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
 const questionOpacity=useDerivedValue(()=>{const g=game.value.guards[index];if(!g?.brain||!g.active||g.hp<=0||g.seesPlayer&&g.exposure>=1||g.heist?.hunting)return 0;return g.seesPlayer&&g.exposure>0||g.mode==='investigate'||g.mode==='search'||!!(g.heist as {suspicious?:boolean}|undefined)?.suspicious?1:0;});
 const questionMark=usePathValue(p=>{'worklet';const cx=barWidth/2,cy=-.33;p.moveTo(cx-.085,cy-.07);p.quadTo(cx-.085,cy-.17,cx,cy-.17);p.quadTo(cx+.09,cy-.17,cx+.09,cy-.08);p.quadTo(cx+.09,cy-.01,cx+.01,cy);p.lineTo(cx,cy+.035);});
 const lurePath=usePathValue(p=>{'worklet';const g=game.value.guards[index];if(!g||!g.active||g.seesPlayer||game.value.decoy.ttl<=0||g.lureId!==game.value.decoy.id||g.mode!=='investigate')return;p.moveTo(g.x,g.y);for(let i=g.pathIndex;i<g.path.length;i++)p.lineTo(g.path[i]!.x,g.path[i]!.y);});
 const listening=useDerivedValue(()=>{const g=game.value.guards[index];return g&&g.active&&!g.seesPlayer&&game.value.decoy.ttl>0&&g.lureId===game.value.decoy.id&&(g.mode==='investigate'||g.mode==='search')?1:0;});
 return <Group>
  {boss&&<BossSignature game={game} index={index} clock={clock} reduced={reduced} sheet={bossWalk}/>}
  <Group opacity={visible}>
  <Path path={lurePath} color="#CFE6E4" style="stroke" strokeWidth={.035} opacity={.65}><DashPathEffect intervals={[.12,.12]}/></Path><Path path={cone} color={color} opacity={opacity}/>
  <Path path={cone} color={color} opacity={opacity} style="stroke" strokeWidth={.025}/>
  <Path path={aim} color="#FF886F" style="stroke" strokeWidth={.045}><DashPathEffect intervals={[.13,.08]}/></Path><Group clip={wallClip}><Group transform={pose}><Group transform={actorScale}>
   {boss&&<Group opacity={live}><Oval x={-.62} y={-.38} width={1.24} height={.76} color="#061310" opacity={.06}/><Oval x={-.5} y={-.3} width={1} height={.6} color="#061310" opacity={.1}/></Group>}
   <Group opacity={live}>{boss&&bossWalk?<Atlas image={bossWalk} sprites={walkFrame} transforms={walkTransform}/>:drone?<QuadDrone game={game} index={index} clock={clock} reduced={reduced} sprite={droneSprite}/>:<Image image={boss?bossSprite:armor||kind==='warden'?heavySprite:guardSprite} x={boss||armor||kind==='warden'?-.59:-.52} y={boss||armor||kind==='warden'?-.59:-.52} width={boss||armor||kind==='warden'?1.18:1.04} height={boss||armor||kind==='warden'?1.18:1.04} fit="contain"/>}</Group>
   <Group opacity={fallen}><Atlas image={boss&&bossDefeat?bossDefeat:defeatSprite} sprites={deathFrames} transforms={deathTransforms}/></Group>
   <Oval x={-.6} y={-.55} width={1.2} height={1.1} color="#071B16" opacity={winded}/>
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


const GHOST_FRAMES=[{x:256,y:0,width:256,height:256}];
const GHOST_TRANSFORMS=[Skia.RSXform(1.5/256,0,-.75,-.75)];
const BURST_MARKS=['M .67 -.27 Q .89 -.3 1.08 -.24','M .72 0 L 1.18 0','M .67 .27 Q .89 .3 1.08 .24'];
/** Signature cues are display-only Skia nodes. Paths reuse storage and no frame reaches React state. */
function BossSignature({game,index,clock,reduced,sheet}:{game:Props['game'];index:number;clock:Props['clock'];reduced:boolean;sheet:SkImage|null}){
 const id=stateLevel(game.value).patrols[index]!.boss;
 const trait=useDerivedValue(()=>bossTrait(stateLevel(game.value),index));
 const live=useDerivedValue(()=>{const g=game.value.guards[index];return !reduced&&g?.active&&g.hp>0?1:0;});
 const seenAt=useSharedValue(-100),rearAt=useSharedValue(-100);
 useAnimatedReaction(()=>game.value.guards[index]?.seesPlayer??false,(seen,previous)=>{if(seen&&previous===false)seenAt.value=clock.value;});
 useAnimatedReaction(()=>game.value.guards[index]?.hp??0,(hp,previous)=>{if(previous!==null&&hp<previous){const s=game.value,g=s.guards[index]!;if(Math.cos(Math.atan2(s.y-g.y,s.x-g.x)-g.angle)<0)rearAt.value=clock.value;}});
 const anchor=useDerivedValue(()=>{const g=game.value.guards[index]!;return [{translateX:g.x},{translateY:g.y},{rotate:g.angle}];});
 const phase=useDerivedValue(()=>(clock.value%.9)/.9),radius=useDerivedValue(()=>phase.value*Math.min(8,trait.value?.radio??8));
 const radiusB=useDerivedValue(()=>((phase.value+.5)%1)*Math.min(8,trait.value?.radio??8));
 const radio=useDerivedValue(()=>live.value&&game.value.guards[index]?.seesPlayer?(1-phase.value)*.3:0);
 const radioB=useDerivedValue(()=>live.value&&game.value.guards[index]?.seesPlayer?(1-(phase.value+.5)%1)*.3:0);
 const roomFlash=useDerivedValue(()=>live.value*.35*bossFlash(clock.value-seenAt.value,.25,reduced));
 const sprint=useDerivedValue(()=>{const g=game.value.guards[index]!,spec=stateLevel(game.value).patrols[index]!;return live.value&&Math.hypot(g.x-g.px,g.y-g.py)*30>spec.speed*1.08?.24:0;});
 const front=useDerivedValue(()=>live.value&&game.value.guards[index]?.heist?.armorHit==='front'?Math.min(1,(game.value.guards[index]?.flash??0)*8):0);
 const gold=useDerivedValue(()=>live.value*(.15+front.value*.7));
 const rear=useDerivedValue(()=>live.value*bossFlash(clock.value-rearAt.value,.23,reduced));
 const burst=useDerivedValue(()=>live.value&&!!trait.value?.burst&&game.value.guards[index]?.gunPhase==='fire'?1:0);
 const recovery=useDerivedValue(()=>live.value&&game.value.guards[index]?.gunPhase==='recover'?.32:0);
 const sweep=useDerivedValue(()=>live.value*(.08+.08*(.5+.5*Math.sin(clock.value*1.1))));
 const narrowEdge=usePathValue(p=>{'worklet';if(!live.value||id!=='chase')return;const s=game.value,g=s.guards[index]!,l={...stateLevel(s),blockers:s.blockers};for(let side=-1;side<=1;side+=2){const a=g.angle+g.halfAngle*side,dx=Math.cos(a),dy=Math.sin(a),d=sightDistance(g.x,g.y,dx,dy,g.range,l);p.moveTo(g.x,g.y);p.lineTo(g.x+dx*d,g.y+dy*d);}});
 const wideCone=usePathValue(p=>{'worklet';if(!live.value||id!=='lily')return;const s=game.value,g=s.guards[index]!,l={...stateLevel(s),blockers:s.blockers};p.moveTo(g.x,g.y);for(let i=0;i<=16;i++){const a=g.angle-g.halfAngle+i*g.halfAngle/8,dx=Math.cos(a),dy=Math.sin(a),d=sightDistance(g.x,g.y,dx,dy,g.range,l);p.lineTo(g.x+dx*d,g.y+dy*d);}p.close();});
 const sweepLine=usePathValue(p=>{'worklet';if(!live.value||id!=='lily')return;const s=game.value,g=s.guards[index]!,a=g.angle+Math.sin(clock.value*.8)*g.halfAngle,dx=Math.cos(a),dy=Math.sin(a),d=sightDistance(g.x,g.y,dx,dy,g.range,{...stateLevel(s),blockers:s.blockers});p.moveTo(g.x,g.y);p.lineTo(g.x+dx*d,g.y+dy*d);});
 const links=usePathValue(p=>{'worklet';if(!live.value||!trait.value?.escortSight)return;const s=game.value,g=s.guards[index]!;let sight=g.seesPlayer;for(let i=0;i<s.guards.length;i++)if(s.guards[i]!.active&&s.guards[i]!.hp>0&&s.guards[i]!.seesPlayer)sight=true;if(!sight)return;for(let i=0;i<s.guards.length;i++){const escort=s.guards[i]!;if(i!==index&&escort.active&&escort.hp>0){p.moveTo(g.x,g.y);p.lineTo(escort.x,escort.y);}}});
 const sparks=usePathValue(p=>{'worklet';if(rear.value<=0)return;for(let i=0;i<5;i++){const a=2+i*.5;p.moveTo(Math.cos(a)*.8,Math.sin(a)*.8);p.lineTo(Math.cos(a)*1.1,Math.sin(a)*1.1);}});
 const level=stateLevel(game.value);
 return <Group>
  {id==='mert'&&<Rect x={0} y={0} width={level.width} height={level.height} color="#FFFFFF" opacity={roomFlash}/>}
  {id==='chase'&&<Path path={narrowEdge} color="#C6FFE9" style="stroke" strokeWidth={.035} opacity={live}/>}
  {id==='lily'&&<><Path path={wideCone} color="#C9EBD8" opacity={sweep}/><Path path={sweepLine} color="#DCFFDE" style="stroke" strokeWidth={.065} opacity={sweep}/></>}
  {id==='beeman'&&<Path path={links} color="#9EEFE2" style="stroke" strokeWidth={.035} opacity={live}><DashPathEffect intervals={[.12,.16]}/></Path>}
  <Group transform={anchor}>
   {id==='toly'&&<><Circle cx={0} cy={0} r={radius} color="#ADEDD3" style="stroke" strokeWidth={.045} opacity={radio}/><Circle cx={0} cy={0} r={radiusB} color="#ADEDD3" style="stroke" strokeWidth={.035} opacity={radioB}/></>}
   {id==='chase'&&sheet&&<Group opacity={sprint}>{[3,2,1].map(n=><Group key={n} transform={[{translateX:-n*.32},{scale:ENEMY_ART_SCALE.guard*1.5}]} opacity={1-n*.22}><Atlas image={sheet} sprites={GHOST_FRAMES} transforms={GHOST_TRANSFORMS}/></Group>)}</Group>}
   {id==='vibhu'&&<><Oval x={-.9} y={-.77} width={1.8} height={1.54} color="#E8C976" style="stroke" strokeWidth={.045} opacity={gold}/><Path path={sparks} color="#F9E3A0" style="stroke" strokeWidth={.075} strokeCap="round" opacity={rear}/></>}
   {id==='akshay'&&<><Group opacity={burst}>{BURST_MARKS.map((path,i)=><Path key={i} path={path} color="#FFDB98" style="stroke" strokeWidth={.055} opacity={1-i*.2}/>)}</Group><Oval x={-.72} y={-.65} width={1.44} height={1.3} color="#19372F" opacity={recovery}/></>}
  </Group>
 </Group>;
}
