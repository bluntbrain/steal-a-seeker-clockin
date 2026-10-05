import React,{useState,useCallback,useMemo} from 'react';import {Text,View} from 'react-native';
import BossEntrance from '../components/BossEntrance';import {HapticPressable as Pressable} from '../feedback/HapticPressable';import {BOSSES,type BossId} from '../../shared/campaign-levels';
export default function BossLab(){if(new URLSearchParams(window.location.search).has('presentation'))return <BossPresentation/>;return <EntranceLab/>;}
function EntranceLab(){const [boss,setBoss]=useState<BossId>('toly'),[run,setRun]=useState(0),[show,setShow]=useState(false),[reduced,setReduced]=useState(false);const done=useCallback(()=>setShow(false),[]);
return <View style={{flex:1,backgroundColor:'#142823',alignItems:'center',justifyContent:'center',gap:16}}><Text style={{color:'#D4F2E2'}}>Boss entrances and button corners</Text><View style={{flexDirection:'row',gap:6,flexWrap:'wrap',maxWidth:500}}>{BOSSES.map(n=><Pressable key={n} accessibilityRole="button" onPress={()=>{setBoss(n);setRun(v=>v+1);setShow(true);}} style={{padding:15,borderRadius:20,backgroundColor:'#BEDFCD'}}><Text>{n}</Text></Pressable>)}</View>
<Pressable accessibilityRole="button" spinner onPress={()=>{}} style={{width:280,padding:20,borderRadius:28,backgroundColor:'#C1EFDA'}}><Text>Test rounded loading button</Text></Pressable>
<Pressable accessibilityRole="button" spinner onPress={()=>{}} style={({pressed})=>({width:280,padding:20,borderTopLeftRadius:30,borderBottomRightRadius:30,borderTopRightRadius:10,borderBottomLeftRadius:10,backgroundColor:pressed?'#AACBBB':'#C1EFDA'})}><Text>Test mixed corners</Text></Pressable>
<Pressable accessibilityRole="button" onPress={()=>setReduced(!reduced)}><Text style={{color:'#D4F2E2'}}>{reduced?'Enable motion':'Reduce motion'}</Text></Pressable>
{show&&<BossEntrance key={run} boss={boss} reduced={reduced} onDone={done}/>}</View>;
}


// Local-only visual fixtures exercise the production components without writing progress or replay data.
import {Canvas,Group,Circle,useImage} from '@shopify/react-native-skia';
import {useSharedValue,useFrameCallback} from 'react-native-reanimated';
import {useWindowDimensions} from 'react-native';
import {BUNDLED_LEVELS} from '../campaign/levels';
import {initialState} from '../game/simulation';
import {bossTrait} from '../game/heist-guards-v17';
import {BOSS_MOTION} from '../components/bossMotionAssets';
import {BOSS_SPRITES,GUARD_SPRITES,DEFEAT_SPRITES} from '../components/enemy-presentation';
import GuardLayer from '../components/GuardLayer';
import BossHealthBand,{BossDownRibbon} from '../components/BossHealthBand';
function BossPresentation(){
 const [boss,setBoss]=useState<BossId>('toly'),[reduced,setReduced]=useState(false);
 return <View style={{flex:1,backgroundColor:'#20372E'}}>
  <BossFixture key={boss} boss={boss} reduced={reduced}/>
  <View style={{position:'absolute',top:8,left:8,right:8,flexDirection:'row',justifyContent:'center',gap:5}}>{BOSSES.map(id=><Pressable key={id} accessibilityRole="button" onPress={()=>setBoss(id)} style={{padding:6,backgroundColor:'#BEDFCD',borderRadius:8}}><Text style={{fontSize:10}}>{id}</Text></Pressable>)}</View>
  <Pressable accessibilityRole="button" onPress={()=>setReduced(!reduced)} style={{position:'absolute',bottom:8,alignSelf:'center',padding:10}}><Text style={{color:'#D4F2E2'}}>{reduced?'Enable effects':'Reduce effects'}</Text></Pressable>
 </View>;
}
function BossFixture({boss,reduced}:{boss:BossId;reduced:boolean}){
 const {width,height}=useWindowDimensions(),[entrance,setEntrance]=useState(false),[run,setRun]=useState(0);
 const level=useMemo(()=>BUNDLED_LEVELS.find(e=>e.boss===boss)!.definition,[boss]);
 const fresh=()=>{const state=initialState(level.mission,level);state.x=5;state.y=4;state.blockers=[];state.guards=state.guards.map((g,i)=>({...g,x:i?7:4,y:i?6:4,px:i?7:4,py:i?6:4,angle:0,seesPlayer:false,halfAngle:g.halfAngle*(bossTrait(level,i)?.cone??1)}));return state;};
 const game=useSharedValue(fresh()),alpha=useSharedValue(1),clock=useSharedValue(0);
 useFrameCallback(frame=>{clock.value+=(frame.timeSincePreviousFrame??0)/1000;});
 const index=level.patrols.findIndex(p=>p.boss===boss);
 const sheet=useImage(BOSS_MOTION[boss]),sprite=useImage(BOSS_SPRITES[boss]),guard=useImage(GUARD_SPRITES.guard),heavy=useImage(GUARD_SPRITES.heavy),defeat=useImage(DEFEAT_SPRITES.robots),dead=useImage(DEFEAT_SPRITES[boss]);
 const action=(mode:string)=>{if(mode==='Entrance'){setRun(v=>v+1);setEntrance(true);return;}const state=fresh(),g=state.guards[index]!;
  if(mode==='Tell'){g.seesPlayer=true;g.exposure=1;g.px=g.x-.2;g.gunPhase='fire';g.flash=boss==='vibhu'?.15:0;if(g.heist)g.heist.armorHit='front';}
  if(mode==='Low health'){g.hp=Math.round(g.maxHp*.35);state.x=g.x-1;}
  if(mode==='Defeat'){g.hp=0;g.active=false;}
  state.ticks=game.value.ticks+1;game.value=state;
 };
 return <>
  <Canvas style={{width,height}}><Group transform={[{translateX:width/2-4*42},{translateY:height*.48-4*42},{scale:42}]}><Circle cx={5} cy={4} r={.18} color="#D9F7E6"/><GuardLayer game={game} alpha={alpha} index={index} clock={clock} reduced={reduced} droneSprite={null} guardSprite={guard} heavySprite={heavy} bossSprite={sprite} bossWalk={sheet} defeatSprite={defeat} bossDefeat={dead}/></Group></Canvas>
  <BossHealthBand boss={boss} game={game}/><BossDownRibbon game={game} clock={clock} reduced={reduced}/>
  <View style={{position:'absolute',bottom:60,left:12,right:12,alignItems:'center',gap:10}}><Text style={{color:'#B5D4C5',fontSize:11}}>PRESENTATION FIXTURE · NO GAMEPLAY OR REWARDS</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:6,justifyContent:'center'}}>{['Reset','Entrance','Tell','Low health','Defeat'].map(label=><Pressable key={label} accessibilityRole="button" onPress={()=>action(label)} style={{padding:12,borderRadius:12,backgroundColor:'#BEDFCD'}}><Text>{label}</Text></Pressable>)}</View></View>
  {entrance&&<BossEntrance key={run} boss={boss} reduced={reduced} onDone={()=>setEntrance(false)}/>}
 </>;
}
