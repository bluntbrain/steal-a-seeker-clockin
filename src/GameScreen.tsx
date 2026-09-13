import {useRunTelemetry} from './telemetry/useRunTelemetry';
import {useCoach} from './onboarding/useCoach';
import {useTrial} from './commerce/TrialContext';
import RewardsPanel from './campaign/RewardsPanel';
import CampaignSubmission from './campaign/CampaignSubmission';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform,Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider,SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import {Gesture,GestureDetector,GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated,{runOnJS,runOnUI,useAnimatedStyle,useFrameCallback,useSharedValue} from 'react-native-reanimated';
import {useGameAudio as useAudioPlayer} from './audio/useGameAudio';
import * as Haptics from 'expo-haptics';
import GameCanvas from './components/GameCanvas';
import ActionIcon from './components/ActionIcon';
import Hideout from './components/Hideout';
import {phoneEdition} from './game/collection';
import ResultSheet from './components/ResultSheet';
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
import {alarmSpeedPercent,decoyMessage} from './game/feedback';
import {initialState,idleInput,step,nearPhone,nearSwitch,type GameState} from './game/simulation';
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
export function Game({rankTicket,paidPlay,dailyReturn,paidReturn,onRankStart,onRankExit,onPaidStart,onPaidExit,onSnapshot,paidCheckpoint=paidStore.checkpoint}:{rankTicket?:RunTicket;paidPlay?:PaidPlay;dailyReturn:boolean;paidReturn:boolean;onRankStart:(ticket:RunTicket)=>void;onRankExit:()=>void;onPaidStart:(play:PaidPlay)=>void;onPaidExit:()=>void;onSnapshot?:(state:GameState)=>void;paidCheckpoint?:typeof paidStore.checkpoint}){
 const trial=useTrial();
 const [rewardsOpen,setRewardsOpen]=useState(false);
 const paidEntry=paidPlay?.entry,timedRun=!!rankTicket||!!paidEntry,startMission=rankTicket?.manifest.mission??paidEntry?.manifest.mission??'practice';
 const account=useAccount(),{settings}=useSettings();
 const settingsRef=useRef(settings);settingsRef.current=settings;
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets();
 const size=Math.max(144,Math.min(width-16,(height-insets.top-insets.bottom-174)*.6,480));
 const homeFirst=!trial.active&&!timedRun&&!dailyReturn&&!paidReturn;
 const [walletOpen,setWalletOpen]=useState(false),[mapOpen,setMapOpen]=useState(false),[hideoutOpen,setHideoutOpen]=useState(homeFirst),[dailyOpen,setDailyOpen]=useState(dailyReturn),[settingsOpen,setSettingsOpen]=useState(false),[paidOpen,setPaidOpen]=useState(paidReturn);
 const recording=useSharedValue<ReplayChunk[]>(paidPlay?.replay.chunks.map(c=>({...c}))??[]),[completedReplay,setCompletedReplay]=useState<Replay>();
 const game=useSharedValue(initialState(startMission)),input=useSharedValue(idleInput()),alpha=useSharedValue(0),clock=useSharedValue(0),accumulator=useSharedValue(0),suspended=useSharedValue(!!paidEntry||dailyReturn||paidReturn||homeFirst),saveClock=useSharedValue(0);
 const samples=useSharedValue<number[]>([]),reportClock=useSharedValue(0),hudClock=useSharedValue(0),frameTotal=useSharedValue(0),slowTotal=useSharedValue(0);
 const [hud,setHud]=useState<GameState>(()=>initialState(startMission)),[stats,setStats]=useState<Stats>(zeroStats),[paused,setPaused]=useState(!!paidEntry||dailyReturn||paidReturn||homeFirst),[details,setDetails]=useState(false),[mission,setMission]=useState<MissionId>(startMission);
 useRunTelemetry(hud,paused,paidEntry?'paid':rankTicket?'daily':trial.active?'trial':'campaign',stats);
 const coach=useCoach(hud,!timedRun);
 const level=getLevel(mission);
 const boardHeight=size*20/12;
 const progress=useProgress(),recorded=useRef(false),rankResolved=useRef(false);
 useEffect(()=>{if(!trial.active&&!timedRun&&hud.status==='won'&&!recorded.current&&progress.ready){recorded.current=true;progress.complete(hud);}},[hud,progress.ready,progress.complete,timedRun,trial.active]);
 useEffect(()=>{if(hud.status!=='playing'&&!completedReplay)setCompletedReplay({version:1,chunks:recording.value.map(c=>({...c}))});},[hud.status,completedReplay,recording]);
 const latest=useRef<GameState>(initialState(startMission)),latestStats=useRef<Stats>(zeroStats);
 const chaseAudio=useAudioPlayer(require('../assets/audio-v3/chase.wav'));
 const alarmAudio=useAudioPlayer(require('../assets/audio-v3/alarm.wav'));
 const pickupAudio=useAudioPlayer(require('../assets/audio-v3/pickup.wav')),dashAudio=useAudioPlayer(require('../assets/audio-v3/dash.wav')),successAudio=useAudioPlayer(require('../assets/audio-v3/extract.wav'));
 const decoyAudio=useAudioPlayer(require('../assets/audio-v3/decoy.wav')),caughtAudio=useAudioPlayer(require('../assets/audio-v3/caught.wav')),spotAudio=useAudioPlayer(require('../assets/audio-v3/spot.wav')),switchAudio=useAudioPlayer(require('../assets/audio-v3/switch.wav')),ambience=useAudioPlayer(require('../assets/audio-v3/stealth.wav'));
 const publish=useCallback((snapshot:GameState)=>{latest.current=snapshot;setHud(snapshot);onSnapshot?.(snapshot);},[onSnapshot]);
 const publishStats=useCallback((value:Stats)=>{latestStats.current=value;setStats(value);},[]);
 useEffect(()=>{for(const player of [pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio]){player.volume=settings.sound?settings.volume:0;if(!settings.sound)player.pause();}},[settings.sound,settings.volume,pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio]);
 useEffect(()=>{alarmAudio.loop=true;alarmAudio.volume=settings.sound?settings.volume*.22:0;if(settings.sound&&hud.securityAlarm&&hud.status==='playing'&&!paused)alarmAudio.play();else alarmAudio.pause();return()=>alarmAudio.pause();},[alarmAudio,settings.sound,settings.volume,hud.securityAlarm,hud.status,paused]);
 const lastSpotAt=useRef(-Infinity);
 const soundAllowed=useRef(false);soundAllowed.current=settings.sound&&!paused&&!walletOpen&&!hideoutOpen&&!rewardsOpen;
 const event=useCallback((kind:'pickup'|'dash'|'success'|'caught'|'decoy'|'spot'|'switch')=>{
   if(kind==='spot'){const now=Date.now();if(now-lastSpotAt.current<1300)return;lastSpotAt.current=now;}
   if(soundAllowed.current){const player={pickup:pickupAudio,dash:dashAudio,success:successAudio,caught:caughtAudio,decoy:decoyAudio,spot:spotAudio,switch:switchAudio}[kind];player.seekTo(0).then(()=>{if(soundAllowed.current){player.volume=settingsRef.current.volume*({pickup:1,dash:.7,success:.9,caught:.8,decoy:.7,spot:.65,switch:.7}[kind]);player.play();}}).catch(()=>{});}
   if(!settingsRef.current.haptics)return;
   if(Platform.OS!=='web'&&kind==='caught')Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(()=>{});
   else if(Platform.OS!=='web')Haptics.impactAsync(kind==='success'?Haptics.ImpactFeedbackStyle.Medium:Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
 },[pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio]);
 useEffect(()=>{ambience.loop=true;ambience.volume=settings.sound?settings.volume*(hud.securityAlarm?0:.18):0;if(settings.sound&&hud.status==='playing'&&!paused&&!walletOpen&&!hideoutOpen&&!rewardsOpen)ambience.play();else ambience.pause();return()=>ambience.pause();},[ambience,settings.sound,settings.volume,hud.securityAlarm,hud.status,paused,walletOpen,hideoutOpen,rewardsOpen]);
 useEffect(()=>{chaseAudio.loop=true;chaseAudio.volume=settings.sound?settings.volume*(hud.alert>0?.36:.26):0;if(settings.sound&&hud.securityAlarm&&hud.status==='playing'&&!paused&&!walletOpen&&!hideoutOpen&&!rewardsOpen)chaseAudio.play();else chaseAudio.pause();return()=>chaseAudio.pause();},[chaseAudio,settings.sound,settings.volume,hud.alert>0,hud.securityAlarm,hud.status,paused,walletOpen,hideoutOpen,rewardsOpen]);
 useEffect(()=>{if(paused){for(const p of [pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio])p.pause();}},[paused]);
 const [recoveryReady,setRecoveryReady]=useState(!paidEntry),[recoveryError,setRecoveryError]=useState(''),[deadlinePassed,setDeadlinePassed]=useState(false),[submissionSeconds,setSubmissionSeconds]=useState(0);
 const alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const persistPaid=useCallback(async(replay:Replay)=>{
  if(!paidEntry)return;
  try{await paidCheckpoint(paidEntry,replay);if(alive.current)setRecoveryError('');}
  catch(e){if(alive.current){suspended.value=true;setPaused(true);setRecoveryError(e instanceof Error?e.message:'Run could not be saved. Retry before resuming.');}throw e;}
 },[paidEntry,suspended,paidCheckpoint]);
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
   const previousDecoys=game.value.decoysLeft,previousAlert=game.value.alert,previousPower=game.value.power,previousRelays=game.value.relayTimers.join(),previousCarry=game.value.carrying,previousDashes=game.value.dashes,previousTool=game.value.toolSeen,previousStatus=game.value.status;
   accumulator.value=Math.min(accumulator.value+dt,TUNING.step*3);
   game.modify(s=>{while(accumulator.value+1e-9>=TUNING.step){const controls=input.value;recording.modify(chunks=>{recordStep(s,controls,chunks);return chunks;});accumulator.value-=TUNING.step;}return s;},true);
   alpha.value=accumulator.value/TUNING.step;
   if(paidEntry){saveClock.value+=dt;if(saveClock.value>=1||previousStatus!==game.value.status){saveClock.value=0;runOnJS(checkpoint)({version:1,chunks:recording.value.map(c=>({...c}))});}}
   if(game.value.decoysLeft<previousDecoys)runOnJS(event)('decoy');
   if(previousAlert<=0&&game.value.alert>0)runOnJS(event)('spot');
   if(game.value.power!==previousPower||game.value.relayTimers.some((v,i)=>v>Number(previousRelays.split(',')[i]??0)))runOnJS(event)('switch');
   if(game.value.carrying&&!previousCarry)runOnJS(event)('pickup');
   if(game.value.dashes>previousDashes)runOnJS(event)('dash');
   if(game.value.status==='won'&&previousStatus!=='won')runOnJS(event)('success');
   if(game.value.status==='caught'&&previousStatus!=='caught')runOnJS(event)('caught');
   hudClock.value+=dt;
   if(hudClock.value>=.12||previousTool!==game.value.toolSeen||previousCarry!==game.value.carrying||previousStatus!==game.value.status||previousDashes!==game.value.dashes){runOnJS(publish)({...game.value});hudClock.value=0;}
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
 const restart=useCallback((next:MissionId=game.value.mission)=>{if(trial.active){trial.finish();return;}if(paidEntry){void leavePaid();return;}if(rankTicket){void leaveRank();return;}recording.value=[];setCompletedReplay(undefined);recorded.current=false;setMission(next);game.value=initialState(next);input.value=idleInput();accumulator.value=0;alpha.value=0;clock.value=0;samples.value=[];frameTotal.value=0;slowTotal.value=0;reportClock.value=0;hudClock.value=0;setHud(initialState(next));latest.current=initialState(next);suspended.value=false;setPaused(false);setStats(zeroStats);},[game,input,accumulator,alpha,clock,samples,frameTotal,slowTotal,reportClock,hudClock,suspended,rankTicket,leaveRank,recording,paidEntry,leavePaid,trial]);
 useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{if(state!=='active')pause(true);});return()=>subscription.remove();},[pause]);
 useEffect(()=>{
   if(Platform.OS!=='web')return;
   const keys=new Set<string>();
   const sync=()=>{const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));const y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));input.modify(v=>{v.x=x;v.y=y;v.interact=keys.has('e');return v;});};
   const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(walletOpen||hideoutOpen||mapOpen||settingsOpen||dailyOpen||paidOpen||rewardsOpen)return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' ','escape','r','q'].includes(k))e.preventDefault();keys.add(k);sync();if(k===' '&&!e.repeat)input.modify(v=>{v.dash++;return v;});if(k==='q'&&!e.repeat)input.modify(v=>{v.tool=(v.tool??0)+1;return v;});if(k==='escape'&&!e.repeat)pause(!suspended.value);if(k==='r'&&!e.repeat){keys.clear();restart();}};
   const up=(e:KeyboardEvent)=>{keys.delete(e.key.toLowerCase());sync();};
   const blur=()=>{keys.clear();pause(true);};
   window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
   const visibility=()=>{if(document.hidden)blur();};document.addEventListener('visibilitychange',visibility);
   // Read-only diagnostics for reproducible local playtests. No teleport, score or win hooks.
   (window as unknown as {__SEEKER_MVP__:unknown}).__SEEKER_MVP__={renderer:'2d-skia',rulesHash:rulesManifest.rulesHash,snapshot:()=>({...game.value,guards:game.value.guards.map(g=>({...g}))}),metrics:()=>({...latestStats.current}),replay:()=>({version:1,chunks:recording.value.map(c=>({...c}))}),get level(){return getLevel(game.value.mission);}};
   return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
 },[input,pause,restart,suspended,recording,walletOpen,hideoutOpen,mapOpen,settingsOpen,dailyOpen,paidOpen,rewardsOpen]);
 const joystick=Gesture.Pan().minDistance(0).onBegin(e=>{const dx=(e.x-54)/36,dy=(e.y-54)/36,m=Math.max(1,Math.hypot(dx,dy));input.modify(v=>{v.x=dx/m;v.y=dy/m;return v;});}).onUpdate(e=>{const dx=(e.x-54)/36,dy=(e.y-54)/36,m=Math.max(1,Math.hypot(dx,dy));input.modify(v=>{v.x=dx/m;v.y=dy/m;return v;});}).onFinalize(()=>{input.modify(v=>{v.x=0;v.y=0;return v;});});
 const take=Gesture.LongPress().minDuration(0).maxDistance(100).onBegin(()=>{input.modify(v=>{v.interact=true;return v;});}).onFinalize(()=>{input.modify(v=>{v.interact=false;return v;});});
 const dash=Gesture.Tap().onBegin(()=>{input.modify(v=>{v.dash++;return v;});});
 const tool=Gesture.Tap().onBegin(()=>{input.modify(v=>{v.tool=(v.tool??0)+1;return v;});});
 const stickStyle=useAnimatedStyle(()=>({transform:[{translateX:input.value.x*31},{translateY:input.value.y*31}]}));
 const switchIndex=nearSwitch(hud),pad=level.switches?.[switchIndex];
 const activeTake=(nearPhone(hud)||switchIndex>=0)&&hud.status==='playing',activeDash=hud.carrying&&hud.battery>=20&&hud.cooldown<=.05&&hud.status==='playing';
 const lureMessage=decoyMessage(hud),alarmOn=hud.securityAlarm&&hud.status==='playing';
 const relaySeconds=Math.ceil(Math.max(0,...hud.relayTimers));
 const contextHint=relaySeconds>0?`Relay door open · ${relaySeconds}s`:pad?(pad.kind==='relay'?`Stop · ACT opens door for ${pad.duration??9}s`:'Stop · ACT switches circuits'):activeTake&&!hud.carrying?'Stop · hold TAKE':lureMessage|| (hud.alert>0?'Spotted! Break their line of sight.':alarmOn?`PHONE TRACKED · guards +${alarmSpeedPercent(hud)}%`:'');
 const alarmWash=useAnimatedStyle(()=>({opacity:game.value.securityAlarm&&game.value.status==='playing'&&!suspended.value&&!settings.reducedEffects?.025+.04*(.5+.5*Math.sin(clock.value*2.5)):0}));
 const alarmBorder=useAnimatedStyle(()=>({opacity:game.value.securityAlarm&&game.value.status==='playing'&&!suspended.value?(settings.reducedEffects?.35:.4+.25*(.5+.5*Math.sin(clock.value*2.5))):0}));
 return <SafeAreaView style={s.screen} edges={['top','bottom']}><StatusBar style="light"/><RewardsPanel onLegacy={()=>{setRewardsOpen(false);setPaidOpen(true);}} visible={rewardsOpen} onClose={()=>setRewardsOpen(false)}/><WalletPanel visible={walletOpen} onClose={()=>setWalletOpen(false)}/><Hideout visible={hideoutOpen} onStart={id=>{setHideoutOpen(false);restart(id);}} onClose={()=>setHideoutOpen(false)} onShop={()=>{setHideoutOpen(false);setWalletOpen(true);}} progress={progress.progress} syncStatus={progress.syncStatus} onSync={()=>void progress.retrySync()} onSettings={()=>{setHideoutOpen(false);setSettingsOpen(true);}} onDaily={()=>{setHideoutOpen(false);setDailyOpen(true);}} onPaid={()=>{setHideoutOpen(false);setRewardsOpen(true);}}/><SettingsPanel onReplayTips={()=>{coach.replay();setSettingsOpen(false);setHideoutOpen(false);restart("practice");}} mission={mission} visible={settingsOpen} onClose={()=>setSettingsOpen(false)}/><DailyPanel visible={dailyOpen} onClose={()=>setDailyOpen(false)} onStart={ticket=>{setDailyOpen(false);onRankStart(ticket);}}/><PaidPanel visible={paidOpen} onClose={()=>setPaidOpen(false)} onStart={play=>{setPaidOpen(false);onPaidStart(play);}}/><View style={[s.shell,{width:Math.max(size+16,Math.min(width,460))}]}>
   <View testID="gameplay-topbar" style={s.header}>
    <Pressable accessibilityRole="button" accessibilityLabel={paidEntry?'Save and leave paid attempt':rankTicket?'Leave daily challenge':'Open missions'} onPress={()=>{if(timedRun)restart();else{pause(true);trial.active?trial.finish():setHideoutOpen(true);}}} style={s.iconButton}><Text style={s.iconText}>‹</Text></Pressable>
    <Text style={s.levelName} numberOfLines={1}>{process.env.EXPO_PUBLIC_JUDGE_PREVIEW==='1'?'JUDGE / '+String(level.number).padStart(2,'0'):trial.active?'TRIAL':rankTicket?'DAILY':String(level.number).padStart(2,'0')} · {level.title}</Text>
    {(level.targets?.length??1)>1&&<Text accessibilityLabel={`Phones delivered ${hud.delivered} of ${level.targets!.length}`} style={s.charge}>{hud.delivered}/{level.targets!.length}</Text>}
    <Text accessibilityLabel={paidEntry?'Submission time remaining':'Run time'} style={s.timer}>{time(paidEntry?submissionSeconds:hud.elapsed)}</Text>
    {hud.carrying&&<Text accessibilityLabel={`Phone charge ${hud.battery} percent`} style={s.charge}>{hud.battery}%</Text>}
    <Pressable accessibilityRole="button" accessibilityLabel={paused?'Resume game':'Pause game'} onPress={()=>pause(!paused)} style={s.iconButton}><Text style={s.iconText}>{paused?'▷':'Ⅱ'}</Text></Pressable>
   </View>
   <View testID="game-board" style={[s.board,{width:size+2,height:boardHeight+2}]}>
    <GameCanvas size={size} input={input} game={game} alpha={alpha} clock={clock} level={level} appearance={{...(timedRun?{}:account.account?.equipment),reducedEffects:settings.reducedEffects}}/>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}><Text style={[s.mapLabel,{top:size/12*(level.exit.y+.23),left:size/12*level.exit.x,width:size/12*level.exit.w,color:'#d6f4e4'}]}>EXIT</Text></View>

    {!!(contextHint||coach.text)&&!paused&&hud.status==='playing'&&<View pointerEvents="none" testID="security-banner" accessibilityLiveRegion="polite" style={[s.contextToast,alarmOn&&{backgroundColor:'#3A171FEF'}]}><Text style={s.contextText} numberOfLines={2}>{contextHint||coach.text}</Text></View>}
    {!!coach.text&&!paused&&<Pressable accessibilityRole="button" accessibilityLabel="Skip movement tips" onPress={coach.dismiss} style={{position:"absolute",bottom:5,right:5,padding:10,borderRadius:12,backgroundColor:"#142923EC"}}><Text style={s.contextText}>Skip tips ×</Text></Pressable>}
   </View>
   <View testID="game-controls" style={[s.controls,{width:Math.max(size,300)}]}>
    <View testID="power-controls" style={s.powerControls}>
     {!!level.decoys&&<GestureDetector gesture={tool}><View accessible accessibilityRole="button" accessibilityLabel={`Throw noise decoy in facing direction. ${hud.decoysLeft} left.`} testID="decoy-button" style={[s.powerButton,hud.decoysLeft>0&&s.powerReady]}>
      <View pointerEvents="none" style={s.buttonRing}/><ActionIcon kind="decoy" color={hud.decoysLeft>0?'#CFE6E4':'#71817E'}/><Text style={[s.actionLabel,!hud.decoysLeft&&s.actionMuted]}>DECOY</Text><View pointerEvents="none" style={[s.countBadge,!hud.decoysLeft&&s.countEmpty]}><Text style={s.countText}>{hud.decoysLeft}</Text></View>
     </View></GestureDetector>}
     <GestureDetector gesture={take}><View accessible accessibilityRole="button" accessibilityLabel={pad?`Activate ${pad.kind} switch`:"Hold to take Seeker"} testID="take-button" style={[s.powerButton,activeTake&&s.powerReady]}>
      <View pointerEvents="none" style={s.buttonRing}/><ActionIcon kind={pad?'switch':hud.carrying?'check':'phone'} color={activeTake?'#D8EEE4':'#71817E'}/><Text style={[s.actionLabel,!activeTake&&s.actionMuted]}>{pad?'ACT':hud.carrying?'TAKEN':'TAKE'}</Text>
     </View></GestureDetector>
     <GestureDetector gesture={dash}><View accessible accessibilityRole="button" accessibilityLabel="Dash. Costs twenty battery." testID="dash-button" style={[s.powerButton,s.dashButton,activeDash&&s.dashReady]}>
      <View pointerEvents="none" style={[s.buttonRing,activeDash&&s.dashRing]}/><ActionIcon kind="dash" color={activeDash?'#18302B':'#71817E'}/><Text style={[s.actionLabel,activeDash?s.dashLabel:s.actionMuted]}>DASH</Text>
     </View></GestureDetector>
    </View>
    <GestureDetector gesture={joystick}><Animated.View accessible accessibilityRole="adjustable" accessibilityLabel="Movement joystick on the right. Drag in any direction." testID="joystick" style={s.joystick}><View style={s.stickRing}/><View style={s.crossH}/><View style={s.crossV}/><Animated.View style={[s.knob,stickStyle]}><View style={s.knobCenter}/></Animated.View></Animated.View></GestureDetector>
   </View>
   {!!progress.error&&<Pressable accessibilityRole="button" onPress={()=>void progress.retrySave()} style={s.saveError}><Text style={s.contextText}>{progress.error}</Text></Pressable>}

 </View>
 {(paused||hud.status!=='playing')&&<ResultSheet bottom={insets.bottom}
  art={paused?(recoveryError?'recovery':!recoveryReady?'pending':'pause'):hud.status==='won'?'success':hud.status==='caught'?'caught':'timeout'}
  eyebrow={paused?(recoveryError?'SAVE NEEDS ATTENTION':'RUN PAUSED'):hud.status==='won'?'HEIST COMPLETE':hud.status==='caught'?'PATROL '+(hud.caughtBy+1):'TIME LIMIT'}
  title={paused?(recoveryError?'Save interrupted.':'Take a breather.'):hud.status==='won'?'Seeker secured.':hud.status==='caught'?'They spotted you.':'Out of time.'}
  detail={trial.active&&!paused?'Your free attempt is complete. Unlock the campaign for all 12 missions and unlimited retries.':paused?(paidEntry?(deadlinePassed?'Deadline passed. Return to your entry.':!recoveryReady?'Restoring your saved run…':recoveryError?'Retry saving before you resume.': 'Run paused. Your entry deadline still counts down.'):timedRun?'Run paused. Your daily deadline still counts down.':'Drag to move. Stop and hold TAKE. Use ACT at switches. More help in Settings.'):hud.status==='won'?(timedRun?'Phone recovered.':`${phoneEdition(mission).name} added to your rack.`):hud.status==='caught'?'Use cover. Throw a decoy, then go the other way.':'Take the phone and reach the mint exit.'}
  stats={hud.status==='won'&&!paused?`${time(hud.elapsed)} · ${hud.battery}% charge · ${hud.score.toLocaleString()} pts`:undefined}
  stars={hud.status==='won'&&!paused?'★'.repeat(starsFor(hud))+'☆'.repeat(3-starsFor(hud)):undefined}
  primary={{label:trial.active&&!paused?'View campaign pass':paused?'Resume':paidEntry?'Back to entry':rankTicket?'Back to daily':hud.status==='won'?'Next mission ↗':'Retry ↗',accessibilityLabel:trial.active&&!paused?'Finish free trial':paused?'Resume run':paidEntry?'Back to paid challenge':rankTicket?'Back to daily challenge':hud.status==='won'?'View next mission':'Retry level',disabled:!!paidEntry&&paused&&(!recoveryReady||!!recoveryError||deadlinePassed),onPress:()=>trial.active&&!paused?trial.finish():paused?pause(false):hud.status==='won'&&!timedRun?(pause(true),setHideoutOpen(true)):restart()}}
  secondary={trial.active?undefined:paused?{label:paidEntry?'Save & leave':'Restart',accessibilityLabel:paidEntry?'Save and leave paid attempt':'Restart level',onPress:()=>restart()}:!timedRun?{label:hud.status==='won'?'Replay':'Missions',accessibilityLabel:hud.status==='won'?'Retry level':'View missions',onPress:()=>hud.status==='won'?restart():(pause(true),setHideoutOpen(true))}:undefined}
  utility={paused?(recoveryError?{label:'Retry save',accessibilityLabel:'Retry save',onPress:()=>checkpoint({version:1,chunks:recording.value.map(c=>({...c}))})}:{label:'Settings',accessibilityLabel:'Open settings',onPress:()=>setSettingsOpen(true)}):undefined}
 >{paused&&<Pressable accessibilityRole="button" accessibilityLabel="Toggle frame statistics" onPress={()=>setDetails(!details)}><Text style={s.stats}>{details?`${Math.round(stats.fps)} FPS · p95 ${stats.p95.toFixed(1)}ms · ${stats.slow} slow frames`:'Performance details'}</Text></Pressable>}{!trial.active&&!timedRun&&hud.status==='won'&&completedReplay&&!paused&&<CampaignSubmission state={hud} replay={completedReplay}/>} {paidEntry&&completedReplay&&!paused&&<PaidSubmission entry={paidEntry} replay={completedReplay}/>}{rankTicket&&completedReplay&&!paused&&<RunSubmission ticket={rankTicket} replay={completedReplay} onResolved={()=>{rankResolved.current=true;}}/>}</ResultSheet>}
 <Animated.View pointerEvents="none" testID="alarm-wash" style={[StyleSheet.absoluteFill,{backgroundColor:'#FF253E'},alarmWash]}/><Animated.View pointerEvents="none" testID="alarm-border" style={[StyleSheet.absoluteFill,{borderWidth:7,borderColor:'#FF4255'},alarmBorder]}/></SafeAreaView>;
}
const s=StyleSheet.create({
 securityBanner:{minHeight:36,borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:5,justifyContent:'center',gap:3},securityTitle:{fontSize:9,fontWeight:'800',letterSpacing:.4},securityDetail:{fontSize:8,color:'#C5CCD1'},
 screen:{flex:1,backgroundColor:'#0C0C0E',alignItems:'center',justifyContent:'center'},shell:{alignItems:'center',paddingHorizontal:8},
 missions:{height:28,flexDirection:'row',gap:8,marginBottom:4},missionButton:{flex:1,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#333B40',borderRadius:9},missionSelected:{backgroundColor:'#22282C',borderColor:'#88ad9d'},missionText:{color:'#A8B8BB',fontSize:11,fontWeight:'600'},
 header:{width:'100%',height:48,flexDirection:'row',alignItems:'center',gap:8},levelName:{flex:1,color:'#C7D9CF',fontSize:11,fontWeight:'700'},contextToast:{position:'absolute',top:5,left:8,right:8,alignSelf:'center',backgroundColor:'#142923EC',paddingHorizontal:8,paddingVertical:5,borderRadius:7},contextText:{color:'#E0EBDF',fontSize:10,lineHeight:13,textAlign:'center'},saveError:{position:'absolute',bottom:114,left:8,right:8,backgroundColor:'#532721',padding:8,borderRadius:8},wordmark:{color:'#eff0e8',fontWeight:'900',fontSize:14,letterSpacing:.8},subtitle:{color:'#a8b5ac',fontSize:10,letterSpacing:1,marginTop:4,fontWeight:'600'},headerButtons:{flexDirection:'row',gap:5},iconButton:{height:44,width:44,borderRadius:10,borderWidth:1,borderColor:'#333B40',backgroundColor:'#161618',alignItems:'center',justifyContent:'center'},iconText:{color:'#bccfc3',fontSize:20},
 hud:{height:28,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},stage:{flexDirection:'row',alignItems:'center',gap:6},dot:{width:5,height:5,borderRadius:3},stageText:{color:'#b7c6bc',fontSize:9,fontWeight:'700',letterSpacing:1},timer:{color:'#e2e8dc',fontVariant:['tabular-nums'],fontSize:13,fontWeight:'600'},batteryGroup:{flexDirection:'row',alignItems:'center',gap:5},battery:{width:20,height:10,borderRadius:2,borderWidth:1,borderColor:'#a9c3b4',padding:1},batteryFill:{height:'100%',backgroundColor:'#cce1d1'},charge:{color:'#c2d7c9',fontSize:10,minWidth:29,textAlign:'right',fontVariant:['tabular-nums']},board:{borderWidth:1,borderColor:'#444D54',borderRadius:14,overflow:'hidden',backgroundColor:'#161618'},mapLabel:{position:'absolute',textAlign:'center',fontWeight:'800',fontSize:9,letterSpacing:1.8},
 hint:{color:'#acbcb0',fontSize:11,textAlign:'center',height:30,lineHeight:14,marginTop:4},controls:{height:110,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},joystick:{width:108,height:108,borderRadius:54,borderWidth:1,borderColor:'#364148',backgroundColor:'#111719',alignItems:'center',justifyContent:'center'},stickRing:{position:'absolute',width:82,height:82,borderRadius:41,borderWidth:1,borderColor:'#273036'},crossH:{position:'absolute',width:91,height:1,backgroundColor:'#262E34'},crossV:{position:'absolute',width:1,height:91,backgroundColor:'#262E34'},knob:{width:47,height:47,borderRadius:24,backgroundColor:'#cfe6e4',borderWidth:2,borderColor:'#f6f6f5',alignItems:'center',justifyContent:'center',shadowColor:'#a2d4b6',shadowOffset:{width:0,height:0},shadowOpacity:.1,shadowRadius:8},knobCenter:{width:8,height:8,borderWidth:1,borderColor:'#7ea38c',borderRadius:4},powerControls:{flexDirection:'row',alignItems:'center',gap:6},powerButton:{width:52,height:52,borderRadius:26,borderWidth:1,borderColor:'#364943',backgroundColor:'#17211F',alignItems:'center',justifyContent:'center',gap:1},powerReady:{borderColor:'#8CAEA1',backgroundColor:'#29413B'},buttonRing:{position:'absolute',top:3,right:3,bottom:3,left:3,borderWidth:1,borderRadius:50,borderColor:'#73978A33'},actionLabel:{fontSize:8,lineHeight:10,fontWeight:'800',letterSpacing:.4,color:'#D8EEE4'},actionMuted:{color:'#7E918A'},countBadge:{position:'absolute',top:-4,right:-2,minWidth:18,height:18,borderRadius:9,borderWidth:2,borderColor:'#0C0C0E',backgroundColor:'#CFE6E4',alignItems:'center',justifyContent:'center'},countEmpty:{backgroundColor:'#80928A'},countText:{fontSize:9,lineHeight:12,fontWeight:'800',color:'#17332B'},dashButton:{width:60,height:60,borderRadius:30,backgroundColor:'#1B2824'},dashReady:{backgroundColor:'#CFE6E4',borderColor:'#E4F4EC'},dashRing:{borderColor:'#426D5650'},dashLabel:{color:'#18302B'},

 footer:{height:25,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:5},stats:{color:'#91ad9c',fontSize:8,fontVariant:['tabular-nums'],letterSpacing:.3},restart:{color:'#b0c2b3',fontSize:9,fontWeight:'600',letterSpacing:1},keyboard:{fontSize:9,color:'#859298',height:18,marginTop:4},

});
