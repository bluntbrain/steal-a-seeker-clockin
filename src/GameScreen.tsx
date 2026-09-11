import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform,Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider,SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import {Gesture,GestureDetector,GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated,{runOnJS,useAnimatedStyle,useFrameCallback,useSharedValue} from 'react-native-reanimated';
import {useAudioPlayer} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import GameCanvas from './components/GameCanvas';
import GameCanvas3D from './components/GameCanvas3D';
import MissionMap from './components/MissionMap';
import {useProgress} from './progress/useProgress';
import {starsFor} from './progress/model';
import WalletProvider from './wallet/WalletProvider';
import WalletPanel from './wallet/WalletPanel';
import {screenToWorld} from './three/camera';
import {initialState,idleInput,step,nearPhone,type GameState} from './game/simulation';
import {LEVEL,getLevel,TUNING,MISSIONS,type MissionId} from './game/level';
type Stats={fps:number;p95:number;frames:number;slow:number};
const zeroStats={fps:0,p95:0,frames:0,slow:0};
const emptyState=initialState();
const time=(n:number)=>`${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
export default function GameScreen(){return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><WalletProvider><Game/></WalletProvider></SafeAreaProvider></GestureHandlerRootView>;}
function Game(){
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets();
 const size=Math.max(120,Math.min(width-30,(height-insets.top-insets.bottom-(Platform.OS==='web'?355:335))*.6,414));
 const view3D=useSharedValue(true);
 const [threeD,setThreeD]=useState(true),[walletOpen,setWalletOpen]=useState(false),[mapOpen,setMapOpen]=useState(false);
 const game=useSharedValue(initialState()),input=useSharedValue(idleInput()),alpha=useSharedValue(0),clock=useSharedValue(0),accumulator=useSharedValue(0),suspended=useSharedValue(false);
 const samples=useSharedValue<number[]>([]),reportClock=useSharedValue(0),hudClock=useSharedValue(0),frameTotal=useSharedValue(0),slowTotal=useSharedValue(0);
 const [hud,setHud]=useState<GameState>(emptyState),[stats,setStats]=useState<Stats>(zeroStats),[paused,setPaused]=useState(false),[muted,setMuted]=useState(false),[details,setDetails]=useState(false),[mission,setMission]=useState<MissionId>('practice');
 const level=getLevel(mission);
 const progress=useProgress(),recorded=useRef(false);
 useEffect(()=>{if(hud.status==='won'&&!recorded.current&&progress.ready){recorded.current=true;progress.complete(hud);}},[hud,progress.ready,progress.complete]);
 const latest=useRef<GameState>(emptyState),latestStats=useRef<Stats>(zeroStats),mutedRef=useRef(false);
 const pickupAudio=useAudioPlayer(require('../assets/pickup.wav')),dashAudio=useAudioPlayer(require('../assets/dash.wav')),successAudio=useAudioPlayer(require('../assets/success.wav'));
 const publish=useCallback((snapshot:GameState)=>{latest.current=snapshot;setHud(snapshot);},[]);
 const publishStats=useCallback((value:Stats)=>{latestStats.current=value;setStats(value);},[]);
 const event=useCallback((kind:'pickup'|'dash'|'success'|'caught')=>{
   if(!mutedRef.current&&kind!=='caught'){const player=kind==='pickup'?pickupAudio:kind==='dash'?dashAudio:successAudio;player.seekTo(0).then(()=>player.play()).catch(()=>{});}
   if(Platform.OS!=='web'&&kind==='caught')Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(()=>{});
   else if(Platform.OS!=='web')Haptics.impactAsync(kind==='success'?Haptics.ImpactFeedbackStyle.Medium:Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
 },[pickupAudio,dashAudio,successAudio]);
 useFrameCallback(frame=>{
   const raw=frame.timeSincePreviousFrame;if(raw===null)return;
   if(suspended.value){accumulator.value=0;return;}
   const dt=Math.min(raw/1000,.1);clock.value+=dt;
   frameTotal.value++;if(raw>25)slowTotal.value++;
   samples.modify(v=>{v.push(raw);if(v.length>120)v.shift();return v;});reportClock.value+=raw;
   if(reportClock.value>=1000){
     const sorted=[...samples.value].sort((a,b)=>a-b);const mean=samples.value.reduce((a,b)=>a+b,0)/Math.max(1,samples.value.length);
     runOnJS(publishStats)({fps:1000/mean,p95:sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]??0,frames:frameTotal.value,slow:slowTotal.value});reportClock.value=0;
   }
   const previousCarry=game.value.carrying,previousDashes=game.value.dashes,previousStatus=game.value.status;
   accumulator.value=Math.min(accumulator.value+dt,TUNING.step*3);
   game.modify(s=>{while(accumulator.value+1e-9>=TUNING.step){const controls=input.value;const direction=view3D.value?screenToWorld(controls.x,controls.y):controls;step(s,{...controls,x:direction.x,y:direction.y});accumulator.value-=TUNING.step;}return s;},true);
   alpha.value=accumulator.value/TUNING.step;
   if(game.value.carrying&&!previousCarry)runOnJS(event)('pickup');
   if(game.value.dashes>previousDashes)runOnJS(event)('dash');
   if(game.value.status==='won'&&previousStatus!=='won')runOnJS(event)('success');
   if(game.value.status==='caught'&&previousStatus!=='caught')runOnJS(event)('caught');
   hudClock.value+=dt;
   if(hudClock.value>=.12||previousCarry!==game.value.carrying||previousStatus!==game.value.status||previousDashes!==game.value.dashes){runOnJS(publish)({...game.value});hudClock.value=0;}
 });
 const pause=useCallback((value:boolean)=>{suspended.value=value;input.value=idleInput();game.modify(s=>{'worklet';s.vx=0;s.vy=0;s.px=s.x;s.py=s.y;s.dashSeen=0;return s;});setPaused(value);},[suspended,input,game]);
 const restart=useCallback((next:MissionId=game.value.mission)=>{recorded.current=false;setMission(next);game.value=initialState(next);input.value=idleInput();accumulator.value=0;alpha.value=0;clock.value=0;samples.value=[];frameTotal.value=0;slowTotal.value=0;reportClock.value=0;hudClock.value=0;setHud(initialState(next));latest.current=initialState(next);suspended.value=false;setPaused(false);setStats(zeroStats);},[game,input,accumulator,alpha,clock,samples,frameTotal,slowTotal,reportClock,hudClock,suspended]);
 useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{if(state!=='active')pause(true);});return()=>subscription.remove();},[pause]);
 useEffect(()=>{
   if(Platform.OS!=='web')return;
   const keys=new Set<string>();
   const sync=()=>{const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));const y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));input.modify(v=>{v.x=x;v.y=y;v.interact=keys.has('e');return v;});};
   const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' ','escape','r'].includes(k))e.preventDefault();keys.add(k);sync();if(k===' '&&!e.repeat)input.modify(v=>{v.dash++;return v;});if(k==='escape'&&!e.repeat)pause(!suspended.value);if(k==='r'&&!e.repeat){keys.clear();restart();}};
   const up=(e:KeyboardEvent)=>{keys.delete(e.key.toLowerCase());sync();};
   const blur=()=>{keys.clear();pause(true);};
   window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
   const visibility=()=>{if(document.hidden)blur();};document.addEventListener('visibilitychange',visibility);
   // Read-only diagnostics for reproducible local playtests. No teleport, score or win hooks.
   (window as unknown as {__SEEKER_MVP__:unknown}).__SEEKER_MVP__={snapshot:()=>({...game.value,guards:game.value.guards.map(g=>({...g}))}),metrics:()=>({...latestStats.current}),get level(){return getLevel(game.value.mission);}};
   return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
 },[input,pause,restart,suspended]);
 const joystick=Gesture.Pan().minDistance(0).onBegin(e=>{const dx=(e.x-54)/36,dy=(e.y-54)/36,m=Math.max(1,Math.hypot(dx,dy));input.modify(v=>{v.x=dx/m;v.y=dy/m;return v;});}).onUpdate(e=>{const dx=(e.x-54)/36,dy=(e.y-54)/36,m=Math.max(1,Math.hypot(dx,dy));input.modify(v=>{v.x=dx/m;v.y=dy/m;return v;});}).onFinalize(()=>{input.modify(v=>{v.x=0;v.y=0;return v;});});
 const take=Gesture.LongPress().minDuration(0).maxDistance(100).onBegin(()=>{input.modify(v=>{v.interact=true;return v;});}).onFinalize(()=>{input.modify(v=>{v.interact=false;return v;});});
 const dash=Gesture.Tap().onBegin(()=>{input.modify(v=>{v.dash++;return v;});});
 const stickStyle=useAnimatedStyle(()=>({transform:[{translateX:input.value.x*31},{translateY:input.value.y*31}]}));
 const activeTake=nearPhone(hud)&&hud.status==='playing',activeDash=hud.carrying&&hud.battery>=20&&hud.cooldown<=.05&&hud.status==='playing';
 const hint=paused?'Take your time. Resume when you’re ready.':hud.status==='won'?'The Seeker is safe. Try a cleaner route?':hud.status==='caught'?'Spotted. Use cover and wait for the patrol to turn.':hud.status==='timeout'?'Time ran out. The next attempt is one tap away.':hud.alert>0?'They can see you. Get behind a crate!':hud.carrying?(hud.extraction>0?'Hold the exit for one second…':'Bring it to EXIT. Dash spends 20 charge.'):activeTake?'Stop here and hold TAKE to collect it.':(mission==='practice'?'Find the glowing Seeker. Drag the stick to move.':'Watch the amber cones. Crates block their view.');
 const toggleSound=()=>{mutedRef.current=!mutedRef.current;setMuted(mutedRef.current);};
 return <SafeAreaView style={s.screen} edges={['top','bottom']}><StatusBar style="light"/><MissionMap visible={mapOpen} current={mission} progress={progress.progress} onClose={()=>setMapOpen(false)} onStart={id=>{setMapOpen(false);restart(id);}}/><WalletPanel visible={walletOpen} onClose={()=>setWalletOpen(false)}/><View style={[s.shell,{width:Math.max(size+30,Math.min(width,460))}]}>
   <View style={s.header}><View><Text style={s.wordmark}>STEAL A SEEKER</Text><Text style={s.subtitle}>{level.number?String(level.number).padStart(2,'0'):'LAB'} <Text style={{color:'#566766'}}> / </Text> {level.title.toUpperCase()}</Text></View><View style={s.headerButtons}><Pressable accessibilityRole="button" accessibilityLabel="Open devnet wallet" style={s.iconButton} onPress={()=>{pause(true);setWalletOpen(true);}}><Text style={[s.iconText,{fontSize:14}]}>◈</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={threeD?'Switch to 2D view':'Switch to 3D view'} style={s.iconButton} onPress={()=>{view3D.value=!threeD;setThreeD(!threeD);}}><Text style={[s.iconText,{fontSize:12}]}>{threeD?'3D':'2D'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={muted?'Enable sound':'Mute sound'} onPress={toggleSound} style={s.iconButton}><Text style={s.iconText}>{muted?'♪̸':'♪'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={paused?'Resume game':'Pause game'} onPress={()=>pause(!paused)} style={s.iconButton}><Text style={s.iconText}>{paused?'▷':'Ⅱ'}</Text></Pressable></View></View>
   <View style={[s.missions,{width:size}]}><Pressable accessibilityRole="button" accessibilityLabel="Open mission map" onPress={()=>{pause(true);setMapOpen(true);}} style={[s.missionButton,s.missionSelected]}><Text style={s.missionText}>MISSION MAP ↗</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Play practice mission" onPress={()=>restart('practice')} style={s.missionButton}><Text style={s.missionText}>PRACTICE</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Play night shift mission" onPress={()=>restart('night-shift')} style={s.missionButton}><Text style={s.missionText}>PATROL LAB</Text></Pressable></View>
   <View style={[s.hud,{width:size}]}><View style={s.stage}><View style={[s.dot,{backgroundColor:hud.alert>0?'#ff8169':hud.carrying?'#cfe6e4':'#abac8c'}]}/><Text style={s.stageText}>{hud.alert>0?'SPOTTED '+Math.round(hud.alert*100)+'%':hud.carrying?'EXTRACT':'FIND THE PHONE'}</Text></View><Text style={s.timer}>{time(hud.elapsed)}</Text><View style={s.batteryGroup}><View style={s.battery}><View style={[s.batteryFill,{width:hud.carrying?`${hud.battery}%`:'0%'}]}/></View><Text style={s.charge}>{hud.carrying?hud.battery+'%':'—'}</Text></View></View>
   <View style={[s.board,{width:size+2,height:size*20/12+2}]}>
    {threeD?<GameCanvas3D size={size} game={game} alpha={alpha} clock={clock} level={level}/>:<GameCanvas size={size} game={game} alpha={alpha} clock={clock} level={level}/>}
    {!threeD&&<View pointerEvents="none" style={StyleSheet.absoluteFill}><Text style={[s.mapLabel,{top:size/12*(level.exit.y+.23),left:size/12*level.exit.x,width:size/12*level.exit.w,color:'#d6f4e4'}]}>EXIT</Text><Text style={[s.mapLabel,{top:size/12*18.94,left:size/12*1.2,width:size/12*2.2,color:'#8b927b',fontSize:Math.max(6,size/43)}]}>ENTRY</Text></View>}
    {(paused||hud.status!=='playing')&&<View style={s.scrim}><View style={s.resultCard}><View style={s.resultMark}><Text style={s.resultSymbol}>{paused?'Ⅱ':hud.status==='won'?'✓':'↻'}</Text></View><Text style={s.resultEyebrow}>{paused?'RUN PAUSED':hud.status==='won'?'EXTRACTION COMPLETE':hud.status==='caught'?'CAUGHT BY PATROL '+(hud.caughtBy+1):'TIME LIMIT'}</Text><Text style={s.resultTitle}>{paused?'Catch your breath.':hud.status==='won'?'Clean getaway.':hud.status==='caught'?'They spotted you.':'One more try?'}</Text>{hud.status==='won'&&!paused?<><Text style={s.score}>{hud.score.toLocaleString()}</Text><Text style={s.resultBody}>{time(hud.elapsed)}  ·  {hud.battery}% charge  ·  {hud.dashes} dashes</Text><Text style={s.stars}>{'★'.repeat(starsFor(hud))+'☆'.repeat(3-starsFor(hud))}</Text></>:<Text style={s.resultBody}>{paused?'Your run is frozen. Movement resets when you return.':hud.status==='caught'?'Break the guard’s line of sight before the alert fills. Wait behind crates, then cross when they turn away.':'Reach the Seeker, hold TAKE, then carry it to the mint exit.'}</Text>}<Pressable accessibilityRole="button" accessibilityLabel={paused?'Resume run':'Retry level'} style={s.primary} onPress={()=>paused?pause(false):restart()}><Text style={s.primaryText}>{paused?'RESUME RUN':'PLAY AGAIN'}  ↗</Text></Pressable>{hud.status==='won'&&!paused&&<Pressable accessibilityRole="button" accessibilityLabel="View next mission" onPress={()=>{pause(true);setMapOpen(true);}} style={{padding:12}}><Text style={s.secondaryText}>Next mission ↗</Text></Pressable>}{paused&&<Pressable accessibilityRole="button" accessibilityLabel="Restart level" onPress={()=>restart()} style={{padding:12}}><Text style={s.secondaryText}>Restart level</Text></Pressable>}</View></View>}
   </View>
   <Text style={[s.hint,{width:size+8}]} numberOfLines={2}>{hint}</Text>
   <View style={[s.controls,{width:Math.max(size,300)}]}>
    <GestureDetector gesture={joystick}><Animated.View accessible accessibilityRole="adjustable" accessibilityLabel="Movement joystick. Drag in any direction." testID="joystick" style={s.joystick}><View style={s.stickRing}/><View style={s.crossH}/><View style={s.crossV}/><Animated.View style={[s.knob,stickStyle]}><View style={s.knobCenter}/></Animated.View></Animated.View></GestureDetector>
    <View style={s.controlRight}><GestureDetector gesture={take}><View accessible accessibilityRole="button" accessibilityLabel="Hold to take Seeker" testID="take-button" style={[s.take,activeTake&&s.takeActive]}><Text style={[s.takeIcon,{color:activeTake?'#d8eee4':'#687c75'}]}>▣</Text><Text style={[s.actionLabel,{color:activeTake?'#d8eee4':'#687c75'}]}>{hud.carrying?'TAKEN':'TAKE'}</Text><Text style={s.actionSub}>HOLD</Text></View></GestureDetector><GestureDetector gesture={dash}><View accessible accessibilityRole="button" accessibilityLabel="Dash. Costs twenty battery." testID="dash-button" style={[s.dash,activeDash&&s.dashActive]}><Text style={[s.dashIcon,{color:activeDash?'#12221f':'#688378'}]}>ϟ</Text><Text style={[s.actionLabel,{color:activeDash?'#12221f':'#688378'}]}>DASH</Text><Text style={[s.actionSub,{color:activeDash?'#415f53':'#5d756b'}]}>{hud.cooldown>.05?`${hud.cooldown.toFixed(1)}s`:'−20 CHARGE'}</Text></View></GestureDetector></View>
   </View>
   <View style={[s.footer,{width:Math.max(size,300)}]}><Pressable accessibilityRole="button" accessibilityLabel="Toggle frame statistics" onPress={()=>setDetails(!details)}><Text style={s.stats}>{stats.fps?`${Math.round(stats.fps)} FPS`:'MEASURING…'} <Text style={{color:'#5c7069'}}> / </Text>{details?`p95 ${stats.p95.toFixed(1)}ms · ${stats.slow} slow frames`:(level.title.toUpperCase()+' ↗')}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Restart level immediately" onPress={()=>restart()}><Text style={s.restart}>↻ RESET</Text></Pressable></View>
   {!!progress.error&&<Pressable accessibilityRole="button" onPress={()=>void progress.retrySave()}><Text style={s.hint}>{progress.error}</Text></Pressable>}
   {Platform.OS==='web'&&<Text style={s.keyboard}>WASD / arrows  ·  E hold to take  ·  Space dash  ·  R reset</Text>}
 </View></SafeAreaView>;
}
const s=StyleSheet.create({
 screen:{flex:1,backgroundColor:'#0c0c0e',alignItems:'center',justifyContent:'center'},shell:{alignItems:'center',paddingHorizontal:15},
 missions:{height:36,flexDirection:'row',gap:8,marginBottom:4},missionButton:{flex:1,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#293b35',borderRadius:9},missionSelected:{backgroundColor:'#243a33',borderColor:'#88ad9d'},missionText:{color:'#819b90',fontSize:11,fontWeight:'600'},
 header:{width:'100%',height:66,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},wordmark:{color:'#eff0e8',fontWeight:'900',fontSize:16,letterSpacing:.8},subtitle:{color:'#a8b5ac',fontSize:10,letterSpacing:2.1,marginTop:6,fontWeight:'600'},headerButtons:{flexDirection:'row',gap:5},iconButton:{height:32,width:32,borderRadius:10,borderWidth:1,borderColor:'#293b35',backgroundColor:'#161c1d',alignItems:'center',justifyContent:'center'},iconText:{color:'#bccfc3',fontSize:20},
 hud:{height:33,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},stage:{flexDirection:'row',alignItems:'center',gap:6},dot:{width:5,height:5,borderRadius:3},stageText:{color:'#b7c6bc',fontSize:9,fontWeight:'700',letterSpacing:1},timer:{color:'#e2e8dc',fontVariant:['tabular-nums'],fontSize:13,fontWeight:'600'},batteryGroup:{flexDirection:'row',alignItems:'center',gap:5},battery:{width:20,height:10,borderRadius:2,borderWidth:1,borderColor:'#a9c3b4',padding:1},batteryFill:{height:'100%',backgroundColor:'#cce1d1'},charge:{color:'#c2d7c9',fontSize:10,minWidth:29,textAlign:'right',fontVariant:['tabular-nums']},board:{borderWidth:1,borderColor:'#42534c',borderRadius:14,overflow:'hidden',backgroundColor:'#1b2424'},mapLabel:{position:'absolute',textAlign:'center',fontWeight:'800',fontSize:9,letterSpacing:1.8},
 hint:{color:'#acbcb0',fontSize:11,textAlign:'center',height:32,lineHeight:16,marginTop:10},controls:{height:110,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},joystick:{width:108,height:108,borderRadius:54,borderWidth:1,borderColor:'#34473d',backgroundColor:'#111719',alignItems:'center',justifyContent:'center'},stickRing:{position:'absolute',width:82,height:82,borderRadius:41,borderWidth:1,borderColor:'#273638'},crossH:{position:'absolute',width:91,height:1,backgroundColor:'#233336'},crossV:{position:'absolute',width:1,height:91,backgroundColor:'#233336'},knob:{width:47,height:47,borderRadius:24,backgroundColor:'#cfe6e4',borderWidth:2,borderColor:'#f6f6f5',alignItems:'center',justifyContent:'center',shadowColor:'#a2d4b6',shadowOffset:{width:0,height:0},shadowOpacity:.1,shadowRadius:8},knobCenter:{width:8,height:8,borderWidth:1,borderColor:'#7ea38c',borderRadius:4},controlRight:{flexDirection:'row',alignItems:'center',gap:15},take:{width:61,height:77,borderRadius:18,backgroundColor:'#14201b',borderWidth:1,borderColor:'#2b4435',alignItems:'center',justifyContent:'center'},takeActive:{borderColor:'#cfe6e4',backgroundColor:'#2a4435'},takeIcon:{fontSize:22,lineHeight:26},actionLabel:{fontSize:10,fontWeight:'800',letterSpacing:.8},actionSub:{fontSize:7,letterSpacing:.6,color:'#718578',marginTop:4},dash:{width:88,height:88,borderRadius:44,borderWidth:1,borderColor:'#344c3c',backgroundColor:'#172325',alignItems:'center',justifyContent:'center'},dashActive:{backgroundColor:'#cfe6e4',borderColor:'#edf4e4'},dashIcon:{fontSize:31,lineHeight:32,fontWeight:'800'},
 footer:{height:25,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:5},stats:{color:'#91ad9c',fontSize:8,fontVariant:['tabular-nums'],letterSpacing:.3},restart:{color:'#b0c2b3',fontSize:9,fontWeight:'600',letterSpacing:1},keyboard:{fontSize:9,color:'#617869',height:18,marginTop:4},
 scrim:{...StyleSheet.absoluteFillObject,backgroundColor:'#07100dd9',alignItems:'center',justifyContent:'center',padding:22},resultCard:{width:'100%',padding:23,borderWidth:1,borderColor:'#4c6757',borderRadius:22,backgroundColor:'#15241d',alignItems:'center'},resultMark:{height:49,width:49,borderRadius:25,backgroundColor:'#cfe6e4',alignItems:'center',justifyContent:'center',marginBottom:20},resultSymbol:{fontSize:28,color:'#213b2c'},resultEyebrow:{fontSize:8,letterSpacing:1.8,color:'#a7c6ad',fontWeight:'700'},resultTitle:{fontSize:25,letterSpacing:-.7,color:'#edf0e3',fontWeight:'700',marginTop:12,textAlign:'center'},score:{fontSize:39,fontWeight:'700',letterSpacing:-1,color:'#cfe6e4',marginTop:17},resultBody:{fontSize:11,lineHeight:19,color:'#afc1ae',textAlign:'center',marginTop:13},stars:{fontSize:23,color:'#cedeb5',letterSpacing:8,marginTop:14},primary:{marginTop:23,width:'100%',borderRadius:11,paddingVertical:14,backgroundColor:'#cfe6e4',alignItems:'center'},primaryText:{fontSize:10,fontWeight:'800',color:'#1e3829',letterSpacing:1},secondaryText:{fontSize:10,color:'#b1c3ae'}
});
