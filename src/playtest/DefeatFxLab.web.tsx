import React,{useState,useMemo} from 'react';
import {View,Text,Pressable} from 'react-native';
import {Canvas,Group,Atlas,Skia,useImage} from '@shopify/react-native-skia';
import {useSharedValue,useDerivedValue,useFrameCallback} from 'react-native-reanimated';
import {initialState} from '../game/simulation';
import {combatLevel} from '../game/combat-levels';
import GuardLayer from '../components/GuardLayer';
import DefeatLootLayer from '../components/DefeatLootLayer';
import {BOSS_SPRITES,GUARD_SPRITES,DEFEAT_SPRITES} from '../components/enemy-presentation';
import {useLootAudio} from '../audio/useLootAudio';
const roles=['guard','heavy','drone','toly','mert','chase','lily','vibhu','akshay','beeman'];
function Scene({role,stop,speed,reduced,mute}:{role:string;stop:number;speed:number;reduced:boolean;mute:boolean}){
 const boss=roles.indexOf(role)>2;
 const initial=useMemo(()=>{const level=combatLevel('practice'),s=initialState('practice',level);s.guards=s.guards.slice(0,1);const g=s.guards[0]!;g.x=g.px=4;g.y=g.py=3;g.hp=50;g.maxHp=50;g.combatRole=(boss?'heavy':role) as typeof g.combatRole;g.angle=0;g.active=true;g.range=0;g.halfAngle=0;
  s.definition={...level,patrols:[{...level.patrols[0]!,boss:boss?role as NonNullable<typeof level.patrols[0]>['boss']:undefined}]};s.x=s.px=4;s.y=s.py=5.4;return s;},[role]);
 const game=useSharedValue(initial),clock=useSharedValue(0),alpha=useSharedValue(1);
 const coin=useImage(require('../../assets/loot-v2/coin-spin.png')),robots=useImage(DEFEAT_SPRITES.robots),guard=useImage(GUARD_SPRITES.guard),heavy=useImage(GUARD_SPRITES.heavy),drone=useImage(require('../../assets/drones-v2/scout.webp')),bossArt=useImage(boss?BOSS_SPRITES[role]??null:null),bossDead=useImage(boss?DEFEAT_SPRITES[role as keyof typeof DEFEAT_SPRITES]:null),courier=useImage(require('../../assets/courier-topdown-v2/default.webp'));
 const ready=!!(coin&&robots&&guard&&heavy&&drone&&courier&&(!boss||bossArt&&bossDead));
 useLootAudio(game,clock,!mute&&ready,.6);
 useFrameCallback(frame=>{if(!ready||clock.value>=stop)return;const t=Math.min(stop,clock.value+Math.min((frame.timeSincePreviousFrame??16)/1000,.035)*speed);clock.value=t;const s=game.value;game.value={...s,ticks:s.ticks+1,x:4+Math.sin(t*2)*.8,px:4+Math.sin(t*2)*.8,guards:[{...s.guards[0]!,hp:t>=.18?0:50,active:t<.18}]};});
 const move=useDerivedValue(()=>[{translateX:game.value.x},{translateY:game.value.y}]);
 const ct=useMemo(()=>[Skia.RSXform(1.1/256,0,-.55,-.55)],[]);
 return <Canvas style={{width:360,height:450,backgroundColor:'#243B34'}}><Group transform={[{scale:45}]}>
  <GuardLayer game={game} clock={clock} alpha={alpha} index={0} reduced={reduced} guardSprite={guard} heavySprite={heavy} droneSprite={drone} bossSprite={bossArt} defeatSprite={robots} bossDefeat={bossDead}/>
  <Group transform={move}><Atlas image={courier} sprites={[{x:0,y:0,width:256,height:256}]} transforms={ct}/></Group>
  <DefeatLootLayer game={game} clock={clock} alpha={alpha} reduced={reduced} coin={coin}/>
 </Group></Canvas>;
}
/** Local-only inspection of the real production layers. No API, progress, wallet or rewards. */
export default function DefeatFxLab(){
 const [role,setRole]=useState('guard'),[run,setRun]=useState(0),[stop,setStop]=useState(3),[speed,setSpeed]=useState(1),[reduced,setReduced]=useState(false),[mute,setMute]=useState(true);
 const button=(label:string,onPress:()=>void)=><Pressable key={label} accessibilityRole="button" onPress={onPress} style={{backgroundColor:'#BEDFCD',padding:9,borderRadius:8}}><Text style={{color:'#15372A',fontWeight:'700'}}>{label}</Text></Pressable>;
 return <View style={{flex:1,alignItems:'center',backgroundColor:'#101E19',padding:16,gap:12}}><Text style={{color:'#D9EEE2',fontSize:18}}>Defeat + collection · {role}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:6,maxWidth:620}}>{roles.map(r=>button(r,()=>{setRole(r);setRun(v=>v+1);} ))}</View>
  <Scene key={run+role+reduced} role={role} stop={stop} speed={speed} reduced={reduced} mute={mute}/>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:7,maxWidth:620}}>{[['Replay',3],['Impact',.22],['Scatter',.32],['Flight',.57],['Collected',1.1]].map(([name,time])=>button(String(name),()=>{setStop(Number(time));setRun(v=>v+1);} ))}{button(speed===1?'Slow motion':'Normal speed',()=>{setSpeed(v=>v===1?.2:1);setRun(v=>v+1);})}{button(reduced?'Full effects':'Reduced effects',()=>{setReduced(v=>!v);setRun(v=>v+1);})}{button(mute?'Enable sound':'Mute',()=>setMute(v=>!v))}</View>
 </View>;
}
