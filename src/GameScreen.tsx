import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider,SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import {Gesture,GestureDetector,GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated,{runOnJS,runOnUI,useAnimatedStyle,useFrameCallback,useSharedValue} from 'react-native-reanimated';
import {useAudioPlayer} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import GameCanvas from './components/GameCanvas';
import GameCanvas3D from './components/GameCanvas3D';
import MissionMap from './components/MissionMap';
import Hideout from './components/Hideout';
import SettingsProvider,{useSettings} from './settings/SettingsProvider';
import SettingsPanel from './settings/SettingsPanel';
import {useProgress} from './progress/useProgress';
import {starsFor} from './progress/model';
import WalletProvider from './wallet/WalletProvider';
import WalletPanel from './wallet/WalletPanel';
import AccountProvider from './commerce/AccountProvider';
import CampaignGate from './commerce/CampaignGate';
import {useAccount} from './commerce/account-context';
import DailyPanel from './ranked/DailyPanel';
import PaidPanel from './paid/PaidPanel';
import PaidSubmission from './paid/PaidSubmission';
import {paidStore} from './paid/store';
import {restorePaidState,type PaidPlay} from './paid/recovery';
import RunSubmission from './ranked/RunSubmission';
import {rankedApi} from './ranked/api';
import {savePending} from './ranked/pending';
import {recordStep} from './game/recording';
import type {Replay,ReplayChunk} from '../shared/replay';
import type {RunTicket} from '../shared/ranked';
import rulesManifest from '../shared/rules-manifest.json';
import {screenToWorld} from './three/camera';
import {initialState,idleInput,step,nearPhone,nearSwitch,targetCount,type GameState} from './game/simulation';
import {LEVEL,getLevel,TUNING,MISSIONS,type MissionId} from './game/level';
type Stats={fps:number;p95:number;frames:number;slow:number};
const zeroStats={fps:0,p95:0,frames:0,slow:0};
const emptyState=initialState();
const time=(n:number)=>`${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
export default function GameScreen(){return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><WalletProvider><AccountProvider><SettingsProvider><CampaignGate><WalletGame/></CampaignGate></SettingsProvider></AccountProvider></WalletProvider></SafeAreaProvider></GestureHandlerRootView>;}
function WalletGame(){
 const account=useAccount(),[session,setSession]=useState<{ticket?:RunTicket;paid?:PaidPlay;dailyReturn?:boolean;paidReturn?:boolean}>({});
 const ticket=session.ticket?.wallet===account.wallet?session.ticket:undefined,paid=session.paid?.entry.wallet===account.wallet?session.paid:undefined;
 return <Game key={`${account.wallet??'browser-preview'}:${ticket?.id??paid?.entry.id??('campaign-'+!!session.dailyReturn+'-'+!!session.paidReturn)}`} rankTicket={ticket} paidPlay={paid} dailyReturn={!!session.dailyReturn} paidReturn={!!session.paidReturn} onRankStart={ticket=>setSession({ticket})} onRankExit={()=>setSession({dailyReturn:true})} onPaidStart={paid=>setSession({paid})} onPaidExit={()=>setSession({paidReturn:true})}/>;
}
function Game({rankTicket,paidPlay,dailyReturn,paidReturn,onRankStart,onRankExit,onPaidStart,onPaidExit}:{rankTicket?:RunTicket;paidPlay?:PaidPlay;dailyReturn:boolean;paidReturn:boolean;onRankStart:(ticket:RunTicket)=>void;onRankExit:()=>void;onPaidStart:(play:PaidPlay)=>void;onPaidExit:()=>void}){
 const paidEntry=paidPlay?.entry,timedRun=!!rankTicket||!!paidEntry,startMission=rankTicket?.manifest.mission??paidEntry?.manifest.mission??'practice';
 const account=useAccount(),{settings,ready:settingsReady,update:updateSettings}=useSettings();
 const settingsRef=useRef(settings);settingsRef.current=settings;
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets();
 const size=Math.max(120,Math.min(width-30,(height-insets.top-insets.bottom-(Platform.OS==='web'?355:335))*.6,414));
 const view3D=useSharedValue(true);
 const [threeD,setThreeD]=useState(true),[walletOpen,setWalletOpen]=useState(false),[mapOpen,setMapOpen]=useState(false),[hideoutOpen,setHideoutOpen]=useState(false),[dailyOpen,setDailyOpen]=useState(dailyReturn),[settingsOpen,setSettingsOpen]=useState(false),[paidOpen,setPaidOpen]=useState(paidReturn);
 const recording=useSharedValue<ReplayChunk[]>(paidPlay?.replay.chunks.map(c=>({...c}))??[]),[completedReplay,setCompletedReplay]=useState<Replay>();
 const game=useSharedValue(initialState(startMission)),input=useSharedValue(idleInput()),alpha=useSharedValue(0),clock=useSharedValue(0),accumulator=useSharedValue(0),suspended=useSharedValue(!!paidEntry||dailyReturn||paidReturn),saveClock=useSharedValue(0);
 const samples=useSharedValue<number[]>([]),reportClock=useSharedValue(0),hudClock=useSharedValue(0),frameTotal=useSharedValue(0),slowTotal=useSharedValue(0);
 const [hud,setHud]=useState<GameState>(()=>initialState(startMission)),[stats,setStats]=useState<Stats>(zeroStats),[paused,setPaused]=useState(!!paidEntry||dailyReturn||paidReturn),[details,setDetails]=useState(false),[mission,setMission]=useState<MissionId>(startMission);
 const level=getLevel(mission);
 const progress=useProgress(),recorded=useRef(false),rankResolved=useRef(false);
 useEffect(()=>{if(!timedRun&&hud.status==='won'&&!recorded.current&&progress.ready){recorded.current=true;progress.complete(hud);}},[hud,progress.ready,progress.complete,timedRun]);
 useEffect(()=>{if(hud.status!=='playing'&&!completedReplay)setCompletedReplay({version:1,chunks:recording.value.map(c=>({...c}))});},[hud.status,completedReplay,recording]);
 const latest=useRef<GameState>(initialState(startMission)),latestStats=useRef<Stats>(zeroStats);
 const pickupAudio=useAudioPlayer(require('../assets/pickup.wav')),dashAudio=useAudioPlayer(require('../assets/dash.wav')),successAudio=useAudioPlayer(require('../assets/success.wav'));
 const publish=useCallback((snapshot:GameState)=>{latest.current=snapshot;setHud(snapshot);},[]);
 const publishStats=useCallback((value:Stats)=>{latestStats.current=value;setStats(value);},[]);
 useEffect(()=>{for(const player of [pickupAudio,dashAudio,successAudio]){player.volume=settings.sound?settings.volume:0;if(!settings.sound)player.pause();}},[settings.sound,settings.volume,pickupAudio,dashAudio,successAudio]);
 const event=useCallback((kind:'pickup'|'dash'|'success'|'caught')=>{
   if(settingsRef.current.sound&&kind!=='caught'){const player=kind==='pickup'?pickupAudio:kind==='dash'?dashAudio:successAudio;player.seekTo(0).then(()=>{if(settingsRef.current.sound){player.volume=settingsRef.current.volume;player.play();}}).catch(()=>{});}
   if(!settingsRef.current.haptics)return;
   if(Platform.OS!=='web'&&kind==='caught')Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(()=>{});
   else if(Platform.OS!=='web')Haptics.impactAsync(kind==='success'?Haptics.ImpactFeedbackStyle.Medium:Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
 },[pickupAudio,dashAudio,successAudio]);
 const [recoveryReady,setRecoveryReady]=useState(!paidEntry),[recoveryError,setRecoveryError]=useState(''),[deadlinePassed,setDeadlinePassed]=useState(false),[submissionSeconds,setSubmissionSeconds]=useState(0);
 const alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const persistPaid=useCallback(async(replay:Replay)=>{
  if(!paidEntry)return;
  try{await paidStore.checkpoint(paidEntry,replay);if(alive.current)setRecoveryError('');}
  catch(e){if(alive.current){suspended.value=true;setPaused(true);setRecoveryError(e instanceof Error?e.message:'Run could not be saved. Retry before resuming.');}throw e;}
 },[paidEntry,suspended]);
 const checkpoint=useCallback((replay:Replay)=>{void persistPaid(replay).catch(()=>{});},[persistPaid]);
 const restored=useCallback((state:GameState)=>{publish(state);setRecoveryReady(true);setPaused(state.status==='playing');},[publish]);
 const restoreFailed=useCallback(()=>setRecoveryError('The saved run could not be restored. Its original ticket remains on the server.'),[]);
 useEffect(()=>{
  if(!paidPlay)return;
  runOnUI(()=>{'worklet';try{const state=restorePaidState(paidPlay.entry.manifest.mission,paidPlay.replay);game.value=state;input.value={...idleInput(),dash:state.dashSeen,tool:state.toolSeen};runOnJS(restored)({...state});}catch{runOnJS(restoreFailed)();}})();
 },[paidPlay,game,input,restored,restoreFailed]);
 useEffect(()=>{if(!paidEntry?.run)return;const check=()=>{const left=Math.max(0,Math.ceil((new Date(paidEntry.run!.expiresAt).getTime()-Date.now())/1000));setSubmissionSeconds(left);if(left===0){setDeadlinePassed(true);suspended.value=true;if(game.value.status==='playing')setPaused(true);}};check();const timer=setInterval(check,1000);return()=>clearInterval(timer);},[paidEntry,suspended,game]);
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
   game.modify(s=>{while(accumulator.value+1e-9>=TUNING.step){const controls=input.value;const direction=view3D.value?screenToWorld(controls.x,controls.y):controls;recording.modify(chunks=>{recordStep(s,{...controls,x:direction.x,y:direction.y},chunks);return chunks;});accumulator.value-=TUNING.step;}return s;},true);
   alpha.value=accumulator.value/TUNING.step;
   if(paidEntry){saveClock.value+=dt;if(saveClock.value>=1||previousStatus!==game.value.status){saveClock.value=0;runOnJS(checkpoint)({version:1,chunks:recording.value.map(c=>({...c}))});}}
   if(game.value.carrying&&!previousCarry)runOnJS(event)('pickup');
   if(game.value.dashes>previousDashes)runOnJS(event)('dash');
   if(game.value.status==='won'&&previousStatus!=='won')runOnJS(event)('success');
   if(game.value.status==='caught'&&previousStatus!=='caught')runOnJS(event)('caught');
   hudClock.value+=dt;
   if(hudClock.value>=.12||previousCarry!==game.value.carrying||previousStatus!==game.value.status||previousDashes!==game.value.dashes){runOnJS(publish)({...game.value});hudClock.value=0;}
 });
 const pause=useCallback((value:boolean)=>{
  if(!value&&paidEntry&&(!recoveryReady||recoveryError||deadlinePassed))return;
  suspended.value=value;
  if(timedRun){input.value={...idleInput(),dash:game.value.dashSeen,tool:game.value.toolSeen};if(value&&paidEntry)checkpoint({version:1,chunks:recording.value.map(c=>({...c}))});}
  else{input.value=idleInput();game.modify(s=>{'worklet';s.vx=0;s.vy=0;s.px=s.x;s.py=s.y;s.dashSeen=0;s.toolSeen=0;return s;});}
  setPaused(value);
 },[suspended,input,game,timedRun,paidEntry,checkpoint,recording,recoveryReady,recoveryError,deadlinePassed]);
 const leavePaid=useCallback(async()=>{if(!paidEntry)return;suspended.value=true;setPaused(true);try{await persistPaid({version:1,chunks:recording.value.map(c=>({...c}))});onPaidExit();}catch{/* Keep the screen and input log available for a save retry. */}},[paidEntry,suspended,persistPaid,recording,onPaidExit]);
 const leaveRank=useCallback(async()=>{if(!rankTicket)return;try{if(game.value.status==='playing'){const session=await account.session(false);if(session.wallet===rankTicket.wallet)await rankedApi.abandon(session.token,rankTicket.id);}else if(!rankResolved.current)await savePending(rankTicket,{version:1,chunks:recording.value.map(c=>({...c}))});}catch{/* The daily screen can recover the server ticket after an outage. */}finally{onRankExit();}},[rankTicket,game,recording,account.session,onRankExit]);
 const restart=useCallback((next:MissionId=game.value.mission)=>{if(paidEntry){void leavePaid();return;}if(rankTicket){void leaveRank();return;}recording.value=[];setCompletedReplay(undefined);recorded.current=false;setMission(next);game.value=initialState(next);input.value=idleInput();accumulator.value=0;alpha.value=0;clock.value=0;samples.value=[];frameTotal.value=0;slowTotal.value=0;reportClock.value=0;hudClock.value=0;setHud(initialState(next));latest.current=initialState(next);suspended.value=false;setPaused(false);setStats(zeroStats);},[game,input,accumulator,alpha,clock,samples,frameTotal,slowTotal,reportClock,hudClock,suspended,rankTicket,leaveRank,recording,paidEntry,leavePaid]);
 useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{if(state!=='active')pause(true);});return()=>subscription.remove();},[pause]);
 useEffect(()=>{
   if(Platform.OS!=='web')return;
   const keys=new Set<string>();
   const sync=()=>{const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));const y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));input.modify(v=>{v.x=x;v.y=y;v.interact=keys.has('e');return v;});};
   const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' ','escape','r','q'].includes(k))e.preventDefault();keys.add(k);sync();if(k===' '&&!e.repeat)input.modify(v=>{v.dash++;return v;});if(k==='q'&&!e.repeat)input.modify(v=>{v.tool=(v.tool??0)+1;return v;});if(k==='escape'&&!e.repeat)pause(!suspended.value);if(k==='r'&&!e.repeat){keys.clear();restart();}};
   const up=(e:KeyboardEvent)=>{keys.delete(e.key.toLowerCase());sync();};
   const blur=()=>{keys.clear();pause(true);};
   window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
   const visibility=()=>{if(document.hidden)blur();};document.addEventListener('visibilitychange',visibility);
   // Read-only diagnostics for reproducible local playtests. No teleport, score or win hooks.
   (window as unknown as {__SEEKER_MVP__:unknown}).__SEEKER_MVP__={rulesHash:rulesManifest.rulesHash,snapshot:()=>({...game.value,guards:game.value.guards.map(g=>({...g}))}),metrics:()=>({...latestStats.current}),replay:()=>({version:1,chunks:recording.value.map(c=>({...c}))}),get level(){return getLevel(game.value.mission);}};
   return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
 },[input,pause,restart,suspended,recording]);
 const joystick=Gesture.Pan().minDistance(0).onBegin(e=>{const dx=(e.x-54)/36,dy=(e.y-54)/36,m=Math.max(1,Math.hypot(dx,dy));input.modify(v=>{v.x=dx/m;v.y=dy/m;return v;});}).onUpdate(e=>{const dx=(e.x-54)/36,dy=(e.y-54)/36,m=Math.max(1,Math.hypot(dx,dy));input.modify(v=>{v.x=dx/m;v.y=dy/m;return v;});}).onFinalize(()=>{input.modify(v=>{v.x=0;v.y=0;return v;});});
 const take=Gesture.LongPress().minDuration(0).maxDistance(100).onBegin(()=>{input.modify(v=>{v.interact=true;return v;});}).onFinalize(()=>{input.modify(v=>{v.interact=false;return v;});});
 const dash=Gesture.Tap().onBegin(()=>{input.modify(v=>{v.dash++;return v;});});
 const tool=Gesture.Tap().onBegin(()=>{input.modify(v=>{v.tool=(v.tool??0)+1;return v;});});
 const stickStyle=useAnimatedStyle(()=>({transform:[{translateX:input.value.x*31},{translateY:input.value.y*31}]}));
 const switchIndex=nearSwitch(hud),pad=level.switches?.[switchIndex];
 const activeTake=(nearPhone(hud)||switchIndex>=0)&&hud.status==='playing',activeDash=hud.carrying&&hud.battery>=20&&hud.cooldown<=.05&&hud.status==='playing';
 const hint=paidEntry&&(deadlinePassed||recoveryError)?(deadlinePassed?'Submission deadline passed. Check your entry status.':'Save failed. Retry before resuming.'):paidEntry&&hud.status!=='playing'?'Attempt recorded. Check the entry screen for verification and returns.':paused?'Take your time. Resume when you’re ready.':hud.status==='won'?'The Seeker is safe. Try a cleaner route?':hud.status==='caught'?'Spotted. Use cover and wait for the patrol to turn.':hud.status==='timeout'?'Time ran out. The next attempt is one tap away.':hud.alert>0?'They can see you. Get behind a crate!':pad?(pad.kind==='power'?`Power ${hud.power?'B':'A'}. Stop and press ACT to switch circuits.`:`Press ACT for ${pad.duration??9}s of relay power. ${Math.ceil(hud.relayTimers[pad.channel??0]??0)}s left.`):hud.guards.some(g=>g.mode==='investigate')?'A guard heard something. Move while it checks the sound.':hud.carrying?(hud.extraction>0?'Hold the exit for one second…':'Bring it to EXIT. Dash spends 20 charge.'):activeTake?'Stop here and hold TAKE to collect it.':(mission==='practice'?'Find the glowing Seeker. Drag the stick to move.':'Watch the amber cones. Crates block their view.');
 const muted=!settings.sound;
 const toggleSound=()=>updateSettings({sound:!settingsRef.current.sound});
 return <SafeAreaView style={s.screen} edges={['top','bottom']}><StatusBar style="light"/><MissionMap visible={mapOpen} current={mission} progress={progress.progress} onClose={()=>setMapOpen(false)} onStart={id=>{setMapOpen(false);restart(id);}}/><WalletPanel visible={walletOpen} onClose={()=>setWalletOpen(false)}/><Hideout visible={hideoutOpen} onClose={()=>setHideoutOpen(false)} onShop={()=>{setHideoutOpen(false);setWalletOpen(true);}} progress={progress.progress} syncStatus={progress.syncStatus} onSync={()=>void progress.retrySync()} onSettings={()=>{setHideoutOpen(false);setSettingsOpen(true);}} onDaily={()=>{setHideoutOpen(false);setDailyOpen(true);}} onPaid={()=>{setHideoutOpen(false);setPaidOpen(true);}}/><SettingsPanel visible={settingsOpen} onClose={()=>setSettingsOpen(false)}/><DailyPanel visible={dailyOpen} onClose={()=>setDailyOpen(false)} onStart={ticket=>{setDailyOpen(false);onRankStart(ticket);}}/><PaidPanel visible={paidOpen} onClose={()=>setPaidOpen(false)} onStart={play=>{setPaidOpen(false);onPaidStart(play);}}/><View style={[s.shell,{width:Math.max(size+30,Math.min(width,460))}]}>
   <View style={s.header}><View><Text style={s.wordmark}>STEAL A SEEKER</Text><Text style={s.subtitle}>{paidEntry?`PAID ${time(submissionSeconds)} · `:rankTicket?'DAILY · ':''}{level.number?String(level.number).padStart(2,'0'):'LAB'} <Text style={{color:'#566766'}}> / </Text> {level.title.toUpperCase()}</Text></View><View style={s.headerButtons}><Pressable accessibilityRole="button" accessibilityLabel="Open devnet wallet" style={s.iconButton} onPress={()=>{pause(true);setWalletOpen(true);}}><Text style={[s.iconText,{fontSize:14}]}>◈</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={threeD?'Switch to 2D view':'Switch to 3D view'} disabled={timedRun} style={s.iconButton} onPress={()=>{view3D.value=!threeD;setThreeD(!threeD);}}><Text style={[s.iconText,{fontSize:12}]}>{threeD?'3D':'2D'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={muted?'Enable sound':'Mute sound'} disabled={!settingsReady} onPress={toggleSound} style={s.iconButton}><Text style={s.iconText}>{muted?'♪̸':'♪'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={paused?'Resume game':'Pause game'} onPress={()=>pause(!paused)} style={s.iconButton}><Text style={s.iconText}>{paused?'▷':'Ⅱ'}</Text></Pressable></View></View>
   <View style={[s.missions,{width:size}]}><Pressable accessibilityRole="button" accessibilityLabel="Open mission map" disabled={timedRun} onPress={()=>{pause(true);setMapOpen(true);}} style={[s.missionButton,s.missionSelected]}><Text style={s.missionText}>MISSION MAP ↗</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={paidEntry?'Save and leave paid attempt':rankTicket?'Leave daily challenge':'Play practice mission'} onPress={()=>restart('practice')} style={s.missionButton}><Text style={s.missionText}>{paidEntry?'SAVE / LEAVE':rankTicket?'LEAVE DAILY':'PRACTICE'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open hideout" disabled={timedRun} onPress={()=>{pause(true);setHideoutOpen(true);}} style={s.missionButton}><Text style={s.missionText}>HIDEOUT</Text></Pressable></View>
   <View style={[s.hud,{width:size}]}><View style={s.stage}><View style={[s.dot,{backgroundColor:hud.alert>0?'#ff8169':hud.carrying?'#cfe6e4':'#abac8c'}]}/><Text style={s.stageText}>{hud.alert>0?'SPOTTED '+Math.round(hud.alert*100)+'%':hud.carrying?`EXTRACT ${hud.delivered+1}/${targetCount(hud)}`:targetCount(hud)>1?`FIND PHONE ${Math.min(hud.delivered+1,targetCount(hud))}/${targetCount(hud)}`:'FIND THE PHONE'}</Text></View><Text style={s.timer}>{time(hud.elapsed)}</Text><View style={s.batteryGroup}><View style={s.battery}><View style={[s.batteryFill,{width:hud.carrying?`${hud.battery}%`:'0%'}]}/></View><Text style={s.charge}>{hud.carrying?hud.battery+'%':'—'}</Text></View></View>
   <View style={[s.board,{width:size+2,height:size*20/12+2}]}>
    {threeD?<GameCanvas3D size={size} game={game} alpha={alpha} clock={clock} level={level} appearance={{...(timedRun?{}:account.account?.equipment),reducedEffects:settings.reducedEffects}}/>:<GameCanvas size={size} game={game} alpha={alpha} clock={clock} level={level}/>}
    {!threeD&&<View pointerEvents="none" style={StyleSheet.absoluteFill}><Text style={[s.mapLabel,{top:size/12*(level.exit.y+.23),left:size/12*level.exit.x,width:size/12*level.exit.w,color:'#d6f4e4'}]}>EXIT</Text><Text style={[s.mapLabel,{top:size/12*18.94,left:size/12*1.2,width:size/12*2.2,color:'#8b927b',fontSize:Math.max(6,size/43)}]}>ENTRY</Text></View>}
    {(paused||hud.status!=='playing')&&<View style={s.scrim}><ScrollView style={{width:'100%',maxHeight:'100%'}} contentContainerStyle={s.resultCard}><View style={s.resultMark}><Text style={s.resultSymbol}>{paused?'Ⅱ':hud.status==='won'?'✓':'↻'}</Text></View><Text style={s.resultEyebrow}>{paused?'RUN PAUSED':hud.status==='won'?'EXTRACTION COMPLETE':hud.status==='caught'?'CAUGHT BY PATROL '+(hud.caughtBy+1):'TIME LIMIT'}</Text>{paused&&<Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={()=>setSettingsOpen(true)} style={{padding:12}}><Text style={s.secondaryText}>SETTINGS</Text></Pressable>}<Text style={s.resultTitle}>{paused?'Catch your breath.':hud.status==='won'?'Clean getaway.':hud.status==='caught'?'They spotted you.':paidEntry?'Attempt finished.':'One more try?'}</Text>{hud.status==='won'&&!paused?<><Text style={s.score}>{hud.score.toLocaleString()}</Text><Text style={s.resultBody}>{time(hud.elapsed)}  ·  {hud.battery}% charge  ·  {hud.dashes} dashes</Text><Text style={s.stars}>{'★'.repeat(starsFor(hud))+'☆'.repeat(3-starsFor(hud))}</Text></>:<Text style={s.resultBody}>{paused?(timedRun?'Game time is paused. Your server submission deadline still counts down.':'Your run is frozen. Movement resets when you return.'):hud.status==='caught'?'Break the guard’s line of sight before the alert fills. Wait behind crates, then cross when they turn away.':'Reach the Seeker, hold TAKE, then carry it to the mint exit.'}</Text>}{paidEntry&&completedReplay&&!paused&&<PaidSubmission entry={paidEntry} replay={completedReplay}/>}
    {paidEntry&&paused&&<><Text style={s.resultBody}>{deadlinePassed?'The submission deadline has passed. Check the entry screen for its status.':!recoveryReady?'Restoring saved inputs…':recoveryError||'Your inputs are saved each second and when you leave. A sudden stop resumes from the last completed save. The original deadline still applies.'}</Text>{!!recoveryError&&<Pressable accessibilityRole="button" onPress={()=>checkpoint({version:1,chunks:recording.value.map(c=>({...c}))})} style={{padding:10}}><Text style={s.secondaryText}>RETRY SAVE</Text></Pressable>}</>}
    {rankTicket&&completedReplay&&!paused&&<RunSubmission ticket={rankTicket} replay={completedReplay} onResolved={()=>{rankResolved.current=true;}}/>}<Pressable accessibilityRole="button" accessibilityLabel={paused?'Resume run':paidEntry?'Back to paid challenge':rankTicket?'Back to daily challenge':'Retry level'} disabled={!!paidEntry&&paused&&(!recoveryReady||!!recoveryError||deadlinePassed)} style={s.primary} onPress={()=>paused?pause(false):restart()}><Text style={s.primaryText}>{paused?'RESUME RUN':paidEntry?'BACK TO ENTRY':rankTicket?'BACK TO DAILY':'PLAY AGAIN'}  ↗</Text></Pressable>{hud.status==='won'&&!paused&&!timedRun&&<Pressable accessibilityRole="button" accessibilityLabel="View next mission" onPress={()=>{pause(true);setMapOpen(true);}} style={{padding:12}}><Text style={s.secondaryText}>Next mission ↗</Text></Pressable>}{paused&&<Pressable accessibilityRole="button" accessibilityLabel={paidEntry?'Save and leave paid attempt':'Restart level'} onPress={()=>restart()} style={{padding:12}}><Text style={s.secondaryText}>{paidEntry?'Save and leave attempt':'Restart level'}</Text></Pressable>}</ScrollView></View>}
   </View>
   <Text style={[s.hint,{width:size+8}]} numberOfLines={2}>{hint}</Text>
   <View style={[s.controls,{width:Math.max(size,300)}]}>
    <GestureDetector gesture={joystick}><Animated.View accessible accessibilityRole="adjustable" accessibilityLabel="Movement joystick. Drag in any direction." testID="joystick" style={s.joystick}><View style={s.stickRing}/><View style={s.crossH}/><View style={s.crossV}/><Animated.View style={[s.knob,stickStyle]}><View style={s.knobCenter}/></Animated.View></Animated.View></GestureDetector>
    <View style={[s.controlRight,level.decoys?{gap:7}:undefined]}>{!!level.decoys&&<GestureDetector gesture={tool}><View accessible accessibilityRole="button" accessibilityLabel="Throw decoy in facing direction" testID="decoy-button" style={[s.take,{width:49},hud.decoysLeft>0&&s.takeActive]}><Text style={s.takeIcon}>◉</Text><Text style={s.actionLabel}>DECOY</Text><Text style={s.actionSub}>{hud.decoysLeft} LEFT</Text></View></GestureDetector>}<GestureDetector gesture={take}><View accessible accessibilityRole="button" accessibilityLabel={pad?`Activate ${pad.kind} switch`:"Hold to take Seeker"} testID="take-button" style={[s.take,level.decoys?{width:52}:undefined,activeTake&&s.takeActive]}><Text style={[s.takeIcon,{color:activeTake?'#d8eee4':'#687c75'}]}>▣</Text><Text style={[s.actionLabel,{color:activeTake?'#d8eee4':'#687c75'}]}>{pad?'ACT':hud.carrying?'TAKEN':'TAKE'}</Text><Text style={s.actionSub}>HOLD</Text></View></GestureDetector><GestureDetector gesture={dash}><View accessible accessibilityRole="button" accessibilityLabel="Dash. Costs twenty battery." testID="dash-button" style={[s.dash,level.decoys?{width:72,height:72,borderRadius:36}:undefined,activeDash&&s.dashActive]}><Text style={[s.dashIcon,{color:activeDash?'#12221f':'#688378'}]}>ϟ</Text><Text style={[s.actionLabel,{color:activeDash?'#12221f':'#688378'}]}>DASH</Text><Text style={[s.actionSub,{color:activeDash?'#415f53':'#5d756b'}]}>{hud.cooldown>.05?`${hud.cooldown.toFixed(1)}s`:'−20 CHARGE'}</Text></View></GestureDetector></View>
   </View>
   <View style={[s.footer,{width:Math.max(size,300)}]}><Pressable accessibilityRole="button" accessibilityLabel="Toggle frame statistics" onPress={()=>setDetails(!details)}><Text style={s.stats}>{stats.fps?`${Math.round(stats.fps)} FPS`:'MEASURING…'} <Text style={{color:'#5c7069'}}> / </Text>{details?`p95 ${stats.p95.toFixed(1)}ms · ${stats.slow} slow frames`:(level.title.toUpperCase()+' ↗')}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={paidEntry?'Save and leave paid attempt':rankTicket?'Leave daily challenge immediately':'Restart level immediately'} onPress={()=>restart()}><Text style={s.restart}>{paidEntry?'← ENTRY':rankTicket?'← DAILY':'↻ RESET'}</Text></Pressable></View>
   {!!progress.error&&<Pressable accessibilityRole="button" onPress={()=>void progress.retrySave()}><Text style={s.hint}>{progress.error}</Text></Pressable>}
   {Platform.OS==='web'&&<Text style={s.keyboard}>WASD / arrows  ·  E hold to take  ·  Space dash  ·  R reset{level.decoys?'  ·  Q decoy':''}</Text>}
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
