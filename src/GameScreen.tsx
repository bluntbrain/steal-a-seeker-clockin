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
import {alarmMessage,alarmSpeedPercent,decoyMessage} from './game/feedback';
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
export function Game({rankTicket,paidPlay,dailyReturn,paidReturn,onRankStart,onRankExit,onPaidStart,onPaidExit,onSnapshot,paidCheckpoint=paidStore.checkpoint}:{rankTicket?:RunTicket;paidPlay?:PaidPlay;dailyReturn:boolean;paidReturn:boolean;onRankStart:(ticket:RunTicket)=>void;onRankExit:()=>void;onPaidStart:(play:PaidPlay)=>void;onPaidExit:()=>void;onSnapshot?:(state:GameState)=>void;paidCheckpoint?:typeof paidStore.checkpoint}){
 const trial=useTrial();
 const [rewardsOpen,setRewardsOpen]=useState(false);
 const paidEntry=paidPlay?.entry,timedRun=!!rankTicket||!!paidEntry,startMission=rankTicket?.manifest.mission??paidEntry?.manifest.mission??'practice';
 const account=useAccount(),{settings,ready:settingsReady,update:updateSettings}=useSettings();
 const settingsRef=useRef(settings);settingsRef.current=settings;
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets();
 const size=Math.max(144,Math.min(width-30,(height-insets.top-insets.bottom-340)*.6,480));
 const homeFirst=!trial.active&&!timedRun&&!dailyReturn&&!paidReturn;
 const [walletOpen,setWalletOpen]=useState(false),[mapOpen,setMapOpen]=useState(false),[hideoutOpen,setHideoutOpen]=useState(homeFirst),[dailyOpen,setDailyOpen]=useState(dailyReturn),[settingsOpen,setSettingsOpen]=useState(false),[paidOpen,setPaidOpen]=useState(paidReturn);
 const recording=useSharedValue<ReplayChunk[]>(paidPlay?.replay.chunks.map(c=>({...c}))??[]),[completedReplay,setCompletedReplay]=useState<Replay>();
 const game=useSharedValue(initialState(startMission)),input=useSharedValue(idleInput()),alpha=useSharedValue(0),clock=useSharedValue(0),accumulator=useSharedValue(0),suspended=useSharedValue(!!paidEntry||dailyReturn||paidReturn||homeFirst),saveClock=useSharedValue(0);
 const samples=useSharedValue<number[]>([]),reportClock=useSharedValue(0),hudClock=useSharedValue(0),frameTotal=useSharedValue(0),slowTotal=useSharedValue(0);
 const [hud,setHud]=useState<GameState>(()=>initialState(startMission)),[stats,setStats]=useState<Stats>(zeroStats),[paused,setPaused]=useState(!!paidEntry||dailyReturn||paidReturn||homeFirst),[details,setDetails]=useState(false),[mission,setMission]=useState<MissionId>(startMission);
 const level=getLevel(mission);
 const boardHeight=size*20/12;
 const progress=useProgress(),recorded=useRef(false),rankResolved=useRef(false);
 useEffect(()=>{if(!trial.active&&!timedRun&&hud.status==='won'&&!recorded.current&&progress.ready){recorded.current=true;progress.complete(hud);}},[hud,progress.ready,progress.complete,timedRun,trial.active]);
 useEffect(()=>{if(hud.status!=='playing'&&!completedReplay)setCompletedReplay({version:1,chunks:recording.value.map(c=>({...c}))});},[hud.status,completedReplay,recording]);
 const latest=useRef<GameState>(initialState(startMission)),latestStats=useRef<Stats>(zeroStats);
 const alarmAudio=useAudioPlayer(require('../assets/security-alarm.wav'));
 const pickupAudio=useAudioPlayer(require('../assets/pickup.wav')),dashAudio=useAudioPlayer(require('../assets/dash.wav')),successAudio=useAudioPlayer(require('../assets/audio/extract.wav'));
 const decoyAudio=useAudioPlayer(require('../assets/audio/decoy.wav')),caughtAudio=useAudioPlayer(require('../assets/audio/caught.wav')),spotAudio=useAudioPlayer(require('../assets/audio/spot.wav')),switchAudio=useAudioPlayer(require('../assets/audio/switch.wav')),ambience=useAudioPlayer(require('../assets/audio/stealth-loop.wav'));
 const publish=useCallback((snapshot:GameState)=>{latest.current=snapshot;setHud(snapshot);onSnapshot?.(snapshot);},[onSnapshot]);
 const publishStats=useCallback((value:Stats)=>{latestStats.current=value;setStats(value);},[]);
 useEffect(()=>{for(const player of [pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio]){player.volume=settings.sound?settings.volume:0;if(!settings.sound)player.pause();}},[settings.sound,settings.volume,pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio]);
 useEffect(()=>{alarmAudio.loop=true;alarmAudio.volume=settings.sound?settings.volume*.28:0;if(settings.sound&&hud.securityAlarm&&hud.status==='playing'&&!paused)alarmAudio.play();else alarmAudio.pause();return()=>alarmAudio.pause();},[alarmAudio,settings.sound,settings.volume,hud.securityAlarm,hud.status,paused]);
 const event=useCallback((kind:'pickup'|'dash'|'success'|'caught'|'decoy'|'spot'|'switch')=>{
   if(settingsRef.current.sound){const player={pickup:pickupAudio,dash:dashAudio,success:successAudio,caught:caughtAudio,decoy:decoyAudio,spot:spotAudio,switch:switchAudio}[kind];player.seekTo(0).then(()=>{if(settingsRef.current.sound){player.volume=settingsRef.current.volume;player.play();}}).catch(()=>{});}
   if(!settingsRef.current.haptics)return;
   if(Platform.OS!=='web'&&kind==='caught')Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(()=>{});
   else if(Platform.OS!=='web')Haptics.impactAsync(kind==='success'?Haptics.ImpactFeedbackStyle.Medium:Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
 },[pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio]);
 useEffect(()=>{ambience.loop=true;ambience.volume=settings.sound?settings.volume*(hud.securityAlarm?.12:.23):0;if(settings.sound&&hud.status==='playing'&&!paused&&!walletOpen&&!hideoutOpen&&!rewardsOpen)ambience.play();else ambience.pause();return()=>ambience.pause();},[ambience,settings.sound,settings.volume,hud.securityAlarm,hud.status,paused,walletOpen,hideoutOpen,rewardsOpen]);
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
 const hint=paidEntry&&(deadlinePassed||recoveryError)?(deadlinePassed?'Submission deadline passed. Check your entry status.':'Save failed. Retry before resuming.'):paidEntry&&hud.status!=='playing'?'Attempt recorded. Check the entry screen for your result and return.':paused?'Take your time. Resume when you’re ready.':hud.status==='won'?'The Seeker is safe. Try a cleaner route?':hud.status==='caught'?'Spotted. Use cover and wait for the patrol to turn.':hud.status==='timeout'?'Time ran out. The next attempt is one tap away.':hud.alert>0?'They can see you. Get behind a crate!':pad?(pad.kind==='power'?`Power ${hud.power?'B':'A'}. Stop and press ACT to switch circuits.`:`Press ACT for ${pad.duration??9}s of relay power. ${Math.ceil(hud.relayTimers[pad.channel??0]??0)}s left.`):hud.guards.some(g=>g.mode==='investigate')?'A guard heard something. Move while it checks the sound.':hud.carrying?(hud.extraction>0?'Hold the exit for one second…':'Bring it to EXIT. Dash spends 20 charge.'):activeTake?'Stop here and hold TAKE to collect it.':(mission==='practice'?'Find the glowing Seeker. Drag the stick to move.':'Watch the amber cones. Crates block their view.');
 const lureMessage=decoyMessage(hud),alarmOn=hud.securityAlarm&&hud.status==='playing';
 const alarmWash=useAnimatedStyle(()=>({opacity:game.value.securityAlarm&&game.value.status==='playing'&&!suspended.value&&!settings.reducedEffects?.025+.04*(.5+.5*Math.sin(clock.value*2.5)):0}));
 const alarmBorder=useAnimatedStyle(()=>({opacity:game.value.securityAlarm&&game.value.status==='playing'&&!suspended.value?(settings.reducedEffects?.35:.4+.25*(.5+.5*Math.sin(clock.value*2.5))):0}));
 const muted=!settings.sound;
 const toggleSound=()=>updateSettings({sound:!settingsRef.current.sound});
 return <SafeAreaView style={s.screen} edges={['top','bottom']}><StatusBar style="light"/><RewardsPanel onLegacy={()=>{setRewardsOpen(false);setPaidOpen(true);}} visible={rewardsOpen} onClose={()=>setRewardsOpen(false)}/><WalletPanel visible={walletOpen} onClose={()=>setWalletOpen(false)}/><Hideout visible={hideoutOpen} onStart={id=>{setHideoutOpen(false);restart(id);}} onClose={()=>setHideoutOpen(false)} onShop={()=>{setHideoutOpen(false);setWalletOpen(true);}} progress={progress.progress} syncStatus={progress.syncStatus} onSync={()=>void progress.retrySync()} onSettings={()=>{setHideoutOpen(false);setSettingsOpen(true);}} onDaily={()=>{setHideoutOpen(false);setDailyOpen(true);}} onPaid={()=>{setHideoutOpen(false);setRewardsOpen(true);}}/><SettingsPanel visible={settingsOpen} onClose={()=>setSettingsOpen(false)}/><DailyPanel visible={dailyOpen} onClose={()=>setDailyOpen(false)} onStart={ticket=>{setDailyOpen(false);onRankStart(ticket);}}/><PaidPanel visible={paidOpen} onClose={()=>setPaidOpen(false)} onStart={play=>{setPaidOpen(false);onPaidStart(play);}}/><View style={[s.shell,{width:Math.max(size+30,Math.min(width,460))}]}>
   <View style={s.header}><View><Text style={s.wordmark}>STEAL A SEEKER</Text><Text style={s.subtitle}>{paidEntry?`${account.preview?'ENTRY':'PAID'} ${time(submissionSeconds)} · `:rankTicket?'DAILY · ':''}{level.number?String(level.number).padStart(2,'0'):'LAB'} <Text style={{color:'#566766'}}> / </Text> {level.title.toUpperCase()}</Text></View><View style={s.headerButtons}><Pressable accessibilityRole="button" accessibilityLabel="Open devnet wallet" style={s.iconButton} onPress={()=>{pause(true);if(trial.active)trial.finish();else setWalletOpen(true);}}><Text style={[s.iconText,{fontSize:14}]}>◈</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={muted?'Enable sound':'Mute sound'} disabled={!settingsReady} onPress={toggleSound} style={s.iconButton}><Text style={s.iconText}>{muted?'♪̸':'♪'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={paused?'Resume game':'Pause game'} onPress={()=>pause(!paused)} style={s.iconButton}><Text style={s.iconText}>{paused?'▷':'Ⅱ'}</Text></Pressable></View></View>
   <View style={[s.missions,{width:Math.min(width-30,430)}]}><Pressable accessibilityRole="button" accessibilityLabel={paidEntry?'Save and leave paid attempt':rankTicket?'Leave daily challenge':'Open missions'} onPress={()=>{if(timedRun)restart();else{pause(true);trial.active?trial.finish():setHideoutOpen(true);}}} style={[s.missionButton,s.missionSelected,{flex:0,flexBasis:190,flexShrink:0,paddingHorizontal:12}]}><Text style={s.missionText}>{paidEntry?'← SAVE / LEAVE':rankTicket?'← DAILY':'← MISSIONS'}</Text></Pressable><Text style={[s.missionText,{alignSelf:'center',marginLeft:'auto',fontSize:9}]}>{trial.active?'FREE TRIAL · ONE ATTEMPT':account.preview?'LOCAL PLAYTEST':'DEVNET'}</Text></View>
   <View testID="security-banner" accessibilityLiveRegion="polite" style={[s.securityBanner,{width:Math.min(width-30,430),backgroundColor:alarmOn?'#3A171F':'#17232A',borderColor:alarmOn?'#AF4651':'#344B54'}]}><Text style={[s.securityTitle,{color:alarmOn?'#FFC2C1':'#CFE6E4'}]} numberOfLines={2}>{alarmOn?alarmMessage(hud):'DECOY = NOISE LURE'}</Text><Text style={s.securityDetail}>{alarmOn?`GUARDS +${alarmSpeedPercent(hud)}% SPEED · ${hud.carrying?'REACH THE EXIT':'ALARM STAYS ON'}`:'Aim with movement · tap DECOY / Q · follow the landing ring'}</Text></View>
   <View style={[s.hud,{width:Math.min(width-30,430)}]}><View style={s.stage}><View style={[s.dot,{backgroundColor:hud.alert>0?'#ff8169':hud.carrying?'#cfe6e4':'#A7B7BA'}]}/><Text style={s.stageText}>{hud.status==='won'?'SEEKER RECOVERED':hud.alert>0?'SPOTTED '+Math.round(hud.alert*100)+'%':hud.carrying?`EXTRACT ${hud.delivered+1}/${targetCount(hud)}`:targetCount(hud)>1?`FIND PHONE ${Math.min(hud.delivered+1,targetCount(hud))}/${targetCount(hud)}`:`FIND ${phoneEdition(mission).name.toUpperCase()}`}</Text></View><Text style={s.timer}>{time(hud.elapsed)}</Text><View style={s.batteryGroup}><View style={s.battery}><View style={[s.batteryFill,{width:hud.carrying?`${hud.battery}%`:'0%'}]}/></View><Text style={s.charge}>{hud.carrying?hud.battery+'%':'—'}</Text></View></View>
   <View testID="game-board" style={[s.board,{width:size+2,height:boardHeight+2}]}>
    <GameCanvas size={size} input={input} game={game} alpha={alpha} clock={clock} level={level} appearance={{...(timedRun?{}:account.account?.equipment),reducedEffects:settings.reducedEffects}}/>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}><Text style={[s.mapLabel,{top:size/12*(level.exit.y+.23),left:size/12*level.exit.x,width:size/12*level.exit.w,color:'#d6f4e4'}]}>EXIT</Text></View>

   </View>
   <Text style={[s.hint,{width:size+8}]} numberOfLines={2}>{hud.status==='playing'&&!paused&&!recoveryError&&!deadlinePassed&&lureMessage?lureMessage:hint}</Text>
   <View style={[s.controls,{width:Math.max(size,300)}]}>
    <GestureDetector gesture={joystick}><Animated.View accessible accessibilityRole="adjustable" accessibilityLabel="Movement joystick. Drag in any direction." testID="joystick" style={s.joystick}><View style={s.stickRing}/><View style={s.crossH}/><View style={s.crossV}/><Animated.View style={[s.knob,stickStyle]}><View style={s.knobCenter}/></Animated.View></Animated.View></GestureDetector>
    <View style={[s.controlRight,level.decoys?{gap:7}:undefined]}>{!!level.decoys&&<GestureDetector gesture={tool}><View accessible accessibilityRole="button" accessibilityLabel="Throw noise decoy in facing direction" testID="decoy-button" style={[s.take,{width:49},hud.decoysLeft>0&&s.takeActive]}><Text style={s.takeIcon}>◉</Text><Text style={s.actionLabel}>DECOY</Text><Text style={s.actionSub}>{hud.decoysLeft} LEFT</Text></View></GestureDetector>}<GestureDetector gesture={take}><View accessible accessibilityRole="button" accessibilityLabel={pad?`Activate ${pad.kind} switch`:"Hold to take Seeker"} testID="take-button" style={[s.take,level.decoys?{width:52}:undefined,activeTake&&s.takeActive]}><Text style={[s.takeIcon,{color:activeTake?'#d8eee4':'#687c75'}]}>▣</Text><Text style={[s.actionLabel,{color:activeTake?'#d8eee4':'#687c75'}]}>{pad?'ACT':hud.carrying?'TAKEN':'TAKE'}</Text><Text style={s.actionSub}>HOLD</Text></View></GestureDetector><GestureDetector gesture={dash}><View accessible accessibilityRole="button" accessibilityLabel="Dash. Costs twenty battery." testID="dash-button" style={[s.dash,level.decoys?{width:72,height:72,borderRadius:36}:undefined,activeDash&&s.dashActive]}><Text style={[s.dashIcon,{color:activeDash?'#12221f':'#788990'}]}>ϟ</Text><Text style={[s.actionLabel,{color:activeDash?'#12221f':'#788990'}]}>DASH</Text><Text style={[s.actionSub,{color:activeDash?'#415f53':'#819195'}]}>{hud.cooldown>.05?`${hud.cooldown.toFixed(1)}s`:'−20 CHARGE'}</Text></View></GestureDetector></View>
   </View>
   <View style={[s.footer,{width:Math.max(size,300)}]}><Pressable accessibilityRole="button" accessibilityLabel="Toggle frame statistics" onPress={()=>setDetails(!details)}><Text style={s.stats}>{stats.fps?`${Math.round(stats.fps)} FPS`:'MEASURING…'} <Text style={{color:'#5c7069'}}> / </Text>{details?`p95 ${stats.p95.toFixed(1)}ms · ${stats.slow} slow frames`:(level.title.toUpperCase()+' ↗')}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={paidEntry?'Save and leave paid attempt':rankTicket?'Leave daily challenge immediately':'Restart level immediately'} onPress={()=>restart()}><Text style={s.restart}>{paidEntry?'← ENTRY':rankTicket?'← DAILY':'↻ RESET'}</Text></Pressable></View>
   {!!progress.error&&<Pressable accessibilityRole="button" onPress={()=>void progress.retrySave()}><Text style={s.hint}>{progress.error}</Text></Pressable>}
   {Platform.OS==='web'&&height>900&&<Text style={s.keyboard}>WASD / arrows  ·  E hold to take  ·  Space dash  ·  R reset{level.decoys?'  ·  Q decoy':''}</Text>}
 </View>
 {(paused||hud.status!=='playing')&&<ResultSheet bottom={insets.bottom}
  art={paused?(recoveryError?'recovery':!recoveryReady?'pending':'pause'):hud.status==='won'?'success':hud.status==='caught'?'caught':'timeout'}
  eyebrow={paused?(recoveryError?'SAVE NEEDS ATTENTION':'RUN PAUSED'):hud.status==='won'?'HEIST COMPLETE':hud.status==='caught'?'PATROL '+(hud.caughtBy+1):'TIME LIMIT'}
  title={paused?(recoveryError?'Save interrupted.':'Take a breather.'):hud.status==='won'?'Seeker secured.':hud.status==='caught'?'They spotted you.':'Out of time.'}
  detail={trial.active&&!paused?'Your free attempt is complete. Unlock the campaign for all 12 missions and unlimited retries.':paused?(paidEntry?(deadlinePassed?'Deadline passed. Return to your entry.':!recoveryReady?'Restoring your saved run…':recoveryError?'Retry saving before you resume.': 'Run paused. Your entry deadline still counts down.'):timedRun?'Run paused. Your daily deadline still counts down.':'Ready when you are.'):hud.status==='won'?(timedRun?'Phone recovered.':`${phoneEdition(mission).name} added to your rack.`):hud.status==='caught'?'Use cover. Throw a decoy, then go the other way.':'Take the phone and reach the mint exit.'}
  stats={hud.status==='won'&&!paused?`${time(hud.elapsed)} · ${hud.battery}% charge · ${hud.score.toLocaleString()} pts`:undefined}
  stars={hud.status==='won'&&!paused?'★'.repeat(starsFor(hud))+'☆'.repeat(3-starsFor(hud)):undefined}
  primary={{label:trial.active&&!paused?'View campaign pass':paused?'Resume':paidEntry?'Back to entry':rankTicket?'Back to daily':hud.status==='won'?'Next mission ↗':'Retry ↗',accessibilityLabel:trial.active&&!paused?'Finish free trial':paused?'Resume run':paidEntry?'Back to paid challenge':rankTicket?'Back to daily challenge':hud.status==='won'?'View next mission':'Retry level',disabled:!!paidEntry&&paused&&(!recoveryReady||!!recoveryError||deadlinePassed),onPress:()=>trial.active&&!paused?trial.finish():paused?pause(false):hud.status==='won'&&!timedRun?(pause(true),setHideoutOpen(true)):restart()}}
  secondary={trial.active?undefined:paused?{label:paidEntry?'Save & leave':'Restart',accessibilityLabel:paidEntry?'Save and leave paid attempt':'Restart level',onPress:()=>restart()}:!timedRun?{label:hud.status==='won'?'Replay':'Missions',accessibilityLabel:hud.status==='won'?'Retry level':'View missions',onPress:()=>hud.status==='won'?restart():(pause(true),setHideoutOpen(true))}:undefined}
  utility={paused?(recoveryError?{label:'Retry save',accessibilityLabel:'Retry save',onPress:()=>checkpoint({version:1,chunks:recording.value.map(c=>({...c}))})}:{label:'Settings',accessibilityLabel:'Open settings',onPress:()=>setSettingsOpen(true)}):undefined}
 >{!trial.active&&!timedRun&&hud.status==='won'&&completedReplay&&!paused&&<CampaignSubmission state={hud} replay={completedReplay}/>} {paidEntry&&completedReplay&&!paused&&<PaidSubmission entry={paidEntry} replay={completedReplay}/>}{rankTicket&&completedReplay&&!paused&&<RunSubmission ticket={rankTicket} replay={completedReplay} onResolved={()=>{rankResolved.current=true;}}/>}</ResultSheet>}
 <Animated.View pointerEvents="none" testID="alarm-wash" style={[StyleSheet.absoluteFill,{backgroundColor:'#FF253E'},alarmWash]}/><Animated.View pointerEvents="none" testID="alarm-border" style={[StyleSheet.absoluteFill,{borderWidth:7,borderColor:'#FF4255'},alarmBorder]}/></SafeAreaView>;
}
const s=StyleSheet.create({
 securityBanner:{minHeight:36,borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:5,justifyContent:'center',gap:3},securityTitle:{fontSize:9,fontWeight:'800',letterSpacing:.4},securityDetail:{fontSize:8,color:'#C5CCD1'},
 screen:{flex:1,backgroundColor:'#0C0C0E',alignItems:'center',justifyContent:'center'},shell:{alignItems:'center',paddingHorizontal:15},
 missions:{height:28,flexDirection:'row',gap:8,marginBottom:4},missionButton:{flex:1,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#333B40',borderRadius:9},missionSelected:{backgroundColor:'#22282C',borderColor:'#88ad9d'},missionText:{color:'#A8B8BB',fontSize:11,fontWeight:'600'},
 header:{width:'100%',height:46,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},wordmark:{color:'#eff0e8',fontWeight:'900',fontSize:14,letterSpacing:.8},subtitle:{color:'#a8b5ac',fontSize:10,letterSpacing:1,marginTop:4,fontWeight:'600'},headerButtons:{flexDirection:'row',gap:5},iconButton:{height:32,width:32,borderRadius:10,borderWidth:1,borderColor:'#333B40',backgroundColor:'#161618',alignItems:'center',justifyContent:'center'},iconText:{color:'#bccfc3',fontSize:20},
 hud:{height:28,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},stage:{flexDirection:'row',alignItems:'center',gap:6},dot:{width:5,height:5,borderRadius:3},stageText:{color:'#b7c6bc',fontSize:9,fontWeight:'700',letterSpacing:1},timer:{color:'#e2e8dc',fontVariant:['tabular-nums'],fontSize:13,fontWeight:'600'},batteryGroup:{flexDirection:'row',alignItems:'center',gap:5},battery:{width:20,height:10,borderRadius:2,borderWidth:1,borderColor:'#a9c3b4',padding:1},batteryFill:{height:'100%',backgroundColor:'#cce1d1'},charge:{color:'#c2d7c9',fontSize:10,minWidth:29,textAlign:'right',fontVariant:['tabular-nums']},board:{borderWidth:1,borderColor:'#444D54',borderRadius:14,overflow:'hidden',backgroundColor:'#161618'},mapLabel:{position:'absolute',textAlign:'center',fontWeight:'800',fontSize:9,letterSpacing:1.8},
 hint:{color:'#acbcb0',fontSize:11,textAlign:'center',height:30,lineHeight:14,marginTop:4},controls:{height:110,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},joystick:{width:108,height:108,borderRadius:54,borderWidth:1,borderColor:'#364148',backgroundColor:'#111719',alignItems:'center',justifyContent:'center'},stickRing:{position:'absolute',width:82,height:82,borderRadius:41,borderWidth:1,borderColor:'#273036'},crossH:{position:'absolute',width:91,height:1,backgroundColor:'#262E34'},crossV:{position:'absolute',width:1,height:91,backgroundColor:'#262E34'},knob:{width:47,height:47,borderRadius:24,backgroundColor:'#cfe6e4',borderWidth:2,borderColor:'#f6f6f5',alignItems:'center',justifyContent:'center',shadowColor:'#a2d4b6',shadowOffset:{width:0,height:0},shadowOpacity:.1,shadowRadius:8},knobCenter:{width:8,height:8,borderWidth:1,borderColor:'#7ea38c',borderRadius:4},controlRight:{flexDirection:'row',alignItems:'center',gap:15},take:{width:61,height:77,borderRadius:18,backgroundColor:'#161A1E',borderWidth:1,borderColor:'#354249',alignItems:'center',justifyContent:'center'},takeActive:{borderColor:'#cfe6e4',backgroundColor:'#2B4144'},takeIcon:{fontSize:22,lineHeight:26},actionLabel:{fontSize:10,fontWeight:'800',letterSpacing:.8},actionSub:{fontSize:7,letterSpacing:.6,color:'#718578',marginTop:4},dash:{width:88,height:88,borderRadius:44,borderWidth:1,borderColor:'#3D4D52',backgroundColor:'#1C2228',alignItems:'center',justifyContent:'center'},dashActive:{backgroundColor:'#cfe6e4',borderColor:'#edf4e4'},dashIcon:{fontSize:31,lineHeight:32,fontWeight:'800'},
 footer:{height:25,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:5},stats:{color:'#91ad9c',fontSize:8,fontVariant:['tabular-nums'],letterSpacing:.3},restart:{color:'#b0c2b3',fontSize:9,fontWeight:'600',letterSpacing:1},keyboard:{fontSize:9,color:'#859298',height:18,marginTop:4},

});
