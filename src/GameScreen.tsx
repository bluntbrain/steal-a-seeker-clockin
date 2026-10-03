import LaunchSplash from './components/LaunchSplash';
import {exitWindowSeconds} from './ranked/exit-window';
import TutorialHand from './components/TutorialHand';
import MissionIntro from './components/MissionIntro';
import {campaignLesson} from './onboarding/mission-lessons';
import {HapticPressable as Pressable} from './feedback/HapticPressable';
import {CAMPAIGN_IDS} from './game/level';
import EconomyProvider,{useEconomy} from './commerce/EconomyProvider';
import CreditBalance from './components/CreditBalance';
import {localTestMission} from './playtest/mission';
import {combatLevel} from './game/combat-levels';
import {isDuplicateTap,tapReady,TAP_INTERVAL_MS,type PendingTap} from './controls/tapQueue';
import {assistedCombatTap} from './controls/tapDestination';
import {encounterHint} from './controls/encounterHint';
import {PhoneObjectivePill,SecurityEntrances,MechanismLabels} from './components/ObjectiveSignals';
import CampaignConfetti from './components/CampaignConfetti';
import CompletionCard from './campaign/CompletionCard';
import {completedCampaign,campaignSummary,nextCampaignMission} from './campaign/completion';
import type {CourierCardData} from './league/card';
import {useGameAudio} from './audio/useGameAudio';
import {useCombatGuide} from './onboarding/useCombatGuide';
import {GUIDE_STEPS,guideCommand,guideTarget} from './onboarding/combat-guide';
import {useCombatAudio} from './audio/useCombatAudio';
import {useLevelMusic} from './audio/useLevelMusic';
import {useFootstepAudio} from './audio/useFootstepAudio';
import {contractPoints} from '../shared/contracts';
import {useRunTelemetry} from './telemetry/useRunTelemetry';
import {useCoach} from './onboarding/useCoach';
import {useTrial} from './commerce/TrialContext';
import RewardsPanel from './campaign/RewardsPanel';
import CampaignSubmission from './campaign/CampaignSubmission';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,AppState,Platform,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider,SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import {Gesture,GestureDetector,GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated,{runOnJS,runOnUI,useAnimatedStyle,useFrameCallback,useSharedValue,withTiming} from 'react-native-reanimated';
import {useGameAudio as useAudioPlayer} from './audio/useGameAudio';
import {useHaptics} from './feedback/useHaptics';
import CreditClaim,{type CreditReward} from './components/CreditClaim';
import GameCanvas from './components/GameCanvas';
import MissionFocus from './components/MissionFocus';
import CleanCombo from './components/CleanCombo';
import {CAMERA_CONFIG,useFollowCamera} from './camera/useFollowCamera';
import {screenToWorld} from './camera/geometry';
import RecoveryBoundary from './components/RecoveryBoundary';
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
import {initialState,idleInput,step,nearPhone,nearSwitch,exitOpen,stateLevel,type GameState} from './game/simulation';
import {LEVEL,getLevel,TUNING,MISSIONS,type MissionId} from './game/level';
type Stats={fps:number;p95:number;frames:number;slow:number};
const zeroStats={fps:0,p95:0,frames:0,slow:0};
const time=(n:number)=>`${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
// memoised so hud publishes do not re-render the hidden overlay panels
const RewardsPanelMemo=React.memo(RewardsPanel),WalletPanelMemo=React.memo(WalletPanel),HideoutMemo=React.memo(Hideout),SettingsPanelMemo=React.memo(SettingsPanel),DailyPanelMemo=React.memo(DailyPanel),PaidPanelMemo=React.memo(PaidPanel);
export default function GameScreen(){return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><LaunchSplash><WalletProvider><AccountProvider><SettingsProvider><EconomyProvider><CampaignGate><WalletGame/></CampaignGate></EconomyProvider></SettingsProvider></AccountProvider></WalletProvider></LaunchSplash></SafeAreaProvider></GestureHandlerRootView>;}
function WalletGame(){
 const account=useAccount(),[session,setSession]=useState<{ticket?:RunTicket;paid?:PaidPlay;dailyReturn?:boolean;paidReturn?:boolean}>({});
 const ticket=session.ticket?.practice||session.ticket?.wallet===account.wallet?session.ticket:undefined,paid=session.paid?.entry.wallet===account.wallet?session.paid:undefined;
 // Connecting a guest must preserve the win; switching away from a wallet still resets its game.
 const campaignIdentity=useRef({wallet:account.wallet,revision:0});
 if(campaignIdentity.current.wallet!==account.wallet){if(campaignIdentity.current.wallet)campaignIdentity.current.revision++;campaignIdentity.current.wallet=account.wallet;}
 const game=<Game key={`${ticket||paid?account.wallet:'campaign-'+campaignIdentity.current.revision}:${ticket?.id??paid?.entry.id??('campaign-'+!!session.dailyReturn+'-'+!!session.paidReturn)}`} rankTicket={ticket} paidPlay={paid} dailyReturn={!!session.dailyReturn} paidReturn={!!session.paidReturn} onRankStart={ticket=>setSession({ticket})} onRankExit={()=>setSession({dailyReturn:true})} onPaidStart={paid=>setSession({paid})} onPaidExit={()=>setSession({paidReturn:true})}/>;
 return ticket?<RecoveryBoundary key={ticket.id} scope="ranked-game" fallback={<View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0C0C0E',padding:26,gap:16}}><Text style={{color:'#E6F4EC',fontSize:24,fontWeight:'800'}}>Let’s get you back.</Text><Text style={{color:'#A7BCC1',textAlign:'center',lineHeight:21}}>This run hit a problem. Your chance may already be used. Check the leaderboard before starting another.</Text><Pressable accessibilityRole="button" accessibilityLabel="Return to leaderboard after error" onPress={()=>setSession({dailyReturn:true})} style={{backgroundColor:'#CFE6E4',borderRadius:14,padding:16}}><Text style={{color:'#173739',fontWeight:'800'}}>Back to leaderboard</Text></Pressable></View>}>{game}</RecoveryBoundary>:game;
}
export function Game({rankTicket,paidPlay,dailyReturn,paidReturn,onRankStart,onRankExit,onPaidStart,onPaidExit,onSnapshot,paidCheckpoint=paidStore.checkpoint}:{rankTicket?:RunTicket;paidPlay?:PaidPlay;dailyReturn:boolean;paidReturn:boolean;onRankStart:(ticket:RunTicket)=>void;onRankExit:()=>void;onPaidStart:(play:PaidPlay)=>void;onPaidExit:()=>void;onSnapshot?:(state:GameState)=>void;paidCheckpoint?:typeof paidStore.checkpoint}){
 const trial=useTrial(),testMission=localTestMission();
 const [introMission,setIntroMission]=useState<MissionId|null>(null);
 const [rewardsOpen,setRewardsOpen]=useState(false),[returnHome,setReturnHome]=useState(false);
 const closeOverlay=(close:(open:boolean)=>void)=>{close(false);if(returnHome){setHideoutOpen(true);setReturnHome(false);}};
 const paidEntry=paidPlay?.entry,timedRun=!!rankTicket||!!paidEntry,startMission=rankTicket?.manifest.mission??paidEntry?.manifest.mission??testMission??'practice';
 const account=useAccount(),economy=useEconomy(),{settings}=useSettings();
 const haptic=useHaptics();
 const settingsRef=useRef(settings);settingsRef.current=settings;
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets();
 const combatMode=!timedRun||!!rankTicket?.manifest.contract?.level.combat;
 const homeFirst=!testMission&&!trial.active&&!timedRun&&!dailyReturn&&!paidReturn;
 const [missionMapRequest,setMissionMapRequest]=useState(0);
 const [walletOpen,setWalletOpen]=useState(false),[mapOpen,setMapOpen]=useState(false),[hideoutOpen,setHideoutOpen]=useState(homeFirst||dailyReturn),[dailyOpen,setDailyOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false),[paidOpen,setPaidOpen]=useState(paidReturn);
 const initial=useMemo(()=>initialState(startMission,rankTicket?.manifest.contract?.level??(combatMode?combatLevel(startMission):undefined)),[]);
 const sceneEpoch=useRef(0),[sceneVersion,setSceneVersion]=useState(0),[sceneLoading,setSceneLoading]=useState(true),[sceneError,setSceneError]=useState('');
 const sceneReady=useSharedValue(false),simulationEpoch=useSharedValue(0),focusProgress=useSharedValue(1);
 const pendingTap=useSharedValue<PendingTap|null>(null),previousTap=useSharedValue<PendingTap|null>(null),tapElapsed=useSharedValue(TAP_INTERVAL_MS);
 const recording=useSharedValue<ReplayChunk[]>(paidPlay?.replay.chunks.map(c=>({...c}))??[]),[completedReplay,setCompletedReplay]=useState<Replay>();
 const game=useSharedValue(initial),input=useSharedValue(idleInput()),alpha=useSharedValue(0),clock=useSharedValue(0),accumulator=useSharedValue(0),suspended=useSharedValue(!!paidEntry||dailyReturn||paidReturn||homeFirst),saveClock=useSharedValue(0);
 const samples=useSharedValue<number[]>([]),reportClock=useSharedValue(0),hudClock=useSharedValue(0),frameTotal=useSharedValue(0),slowTotal=useSharedValue(0);
 const [hud,setHud]=useState<GameState>(()=>JSON.parse(JSON.stringify(initial))),[stats,setStats]=useState<Stats>(zeroStats),[paused,setPaused]=useState(!!paidEntry||dailyReturn||paidReturn||homeFirst),[details,setDetails]=useState(false),[mission,setMission]=useState<MissionId>(startMission);
 useRunTelemetry(hud,paused,paidEntry?'paid':rankTicket?'daily':trial.active?'trial':'campaign',stats);
 const coach=useCoach(hud,!timedRun&&!combatMode);
 const guide=useCombatGuide(hud,!timedRun),beginGuide=guide.begin;
 const guideWaiting=useSharedValue(true),guideStage=useSharedValue(-1);
 useEffect(()=>{if(guide.active&&guide.resume){const saved=JSON.parse(JSON.stringify(guide.resume.state));game.value=saved;setHud(saved);recording.value=[];input.value=idleInput();guide.consumeResume();}},[guide.active,guide.resume]);
 useEffect(()=>{guideWaiting.value=!guide.ready||(guide.active&&guide.waiting);guideStage.value=guide.active?guide.stage:-1;},[guide.ready,guide.active,guide.waiting,guide.stage]);
 useEffect(()=>{if(guide.active&&(hud.status==='caught'||hud.status==='timeout')&&guide.checkpoint.current){const saved=JSON.parse(JSON.stringify(guide.checkpoint.current));game.value=saved;setHud(saved);recording.value=[];input.value=idleInput();accumulator.value=0;setCompletedReplay(undefined);guide.retry();}},[hud.status,guide.active]);

 // Keep the teaching targets visible; reduced motion uses the original static map.
 // The live camera fills the available screen without stretching the map.
 // Guided/accessible overview keeps the entire map visible.
 const fullViewport=combatMode&&CAMERA_CONFIG.enabled&&!guide.active&&!settings.reducedEffects;
 const availableHeight=Math.max(240,height-insets.top-insets.bottom-(combatMode?0:48));
 const size=fullViewport?width-2:Math.max(144,Math.min(width-16,(height-insets.top-insets.bottom-(combatMode?16:174))*.6,480));
 const boardHeight=fullViewport?availableHeight-2:size*20/12;
 const renderGameSurface=!introMission&&!hideoutOpen&&!walletOpen&&!settingsOpen&&!dailyOpen&&!paidOpen&&!rewardsOpen&&!economy.checkoutOpen;
 const camera=useFollowCamera(game,alpha,!fullViewport,boardHeight*12/size,renderGameSurface&&!paused);
 const worldOverlayStyle=useAnimatedStyle(()=>{const c=camera.value,scale=size/12*c.zoom;return {transform:[{translateX:(c.zoom-1)*size/2-c.x*scale},{translateY:(c.zoom-1)*boardHeight/2-c.y*scale},{scale:c.zoom}]};});
 const damagePulse=useSharedValue(0);
 const showDamage=useCallback(()=>{haptic('damage');damagePulse.value=settingsRef.current.reducedEffects?.45:1;damagePulse.value=withTiming(0,{duration:settingsRef.current.reducedEffects?160:280});},[damagePulse,haptic]);
 const showGameplayHeader=paused||hud.status!=='playing';
 const gameplayVisible=renderGameSurface&&!introMission&&!sceneLoading&&!paused&&!hideoutOpen&&!walletOpen&&!mapOpen&&!settingsOpen&&!dailyOpen&&!paidOpen&&!rewardsOpen;
 useCombatAudio(hud,settings.sound&&gameplayVisible,settings.volume,showDamage,gameplayVisible,haptic);
 useEffect(()=>{if(!gameplayVisible||hud.ticks===0)damagePulse.value=0;},[gameplayVisible,hud.ticks===0,damagePulse]);
 useFootstepAudio(hud,settings.sound&&gameplayVisible&&!(guide.active&&guide.waiting),settings.volume);
 const level=useMemo(()=>rankTicket?.manifest.contract?.level??(combatMode?combatLevel(mission):getLevel(mission)),[rankTicket?.manifest.contract?.level,combatMode,mission]);
 useLevelMusic(level.number,settings.sound&&gameplayVisible&&hud.status==='playing'&&!(guide.active&&guide.waiting),settings.volume,hud.securityAlarm);
 const progress=useProgress(),recorded=useRef(false),rankResolved=useRef(false);
 const [earnedNotice,setEarnedNotice]=useState('');
 const rewardEpoch=useRef(0);
 useEffect(()=>()=>{rewardEpoch.current++;},[]);
 const [creditReward,setCreditReward]=useState<CreditReward>({amount:null}),[rewardClaimed,setRewardClaimed]=useState(false);
 const claimVisible=!sceneLoading&&!timedRun&&!trial.active&&!testMission&&hud.status==='won'&&!paused&&!hideoutOpen&&!walletOpen&&!settingsOpen&&!rewardClaimed;
 const [rewardRetry,setRewardRetry]=useState(0);
 const [connectingClaim,setConnectingClaim]=useState(false),[autoClaim,setAutoClaim]=useState(false);
 const connectClaimPending=useRef(false);
 useEffect(()=>{if(account.wallet&&connectClaimPending.current){connectClaimPending.current=false;setCreditReward({amount:null});setRewardRetry(n=>n+1);}},[account.wallet]);
 async function connectToClaim(){if(connectClaimPending.current)return;connectClaimPending.current=true;setConnectingClaim(true);setAutoClaim(true);setCreditReward({amount:null});haptic('confirm');try{await account.connect();}catch{connectClaimPending.current=false;setAutoClaim(false);setCreditReward({amount:null,message:'Wallet connection was not completed. Try again to claim.'});}finally{setConnectingClaim(false);}}
 const rewardResolved=useCallback((amount:number|null,message?:string,saved=false)=>setCreditReward({amount,message,saved}),[]);
 const saveLocalReward=()=>{const epoch=rewardEpoch.current;rewardResolved(null);void economy.earn(hud.mission,starsFor(hud)).then(n=>{if(epoch!==rewardEpoch.current)return;setEarnedNotice(n>0?`+${n} credits`:'');rewardResolved(n);}).catch(()=>{if(epoch===rewardEpoch.current)rewardResolved(null,'Credit save failed. Tap Retry save.');});};
 const campaignFinished=!timedRun&&!trial.active&&!testMission&&completedCampaign(progress.progress,hud);
 const finaleVisible=!sceneLoading&&campaignFinished&&!claimVisible&&!paused&&!hideoutOpen&&!walletOpen&&!settingsOpen;
 const nextMission=nextCampaignMission(mission);
 const shareAction=useRef<(()=>Promise<void>)|null>(null),[shareReady,setShareReady]=useState(false);
 const registerShare=useCallback((fn:(()=>Promise<void>)|null)=>{shareAction.current=fn;setShareReady(!!fn);},[]);
 const completionData=useMemo<CourierCardData>(()=>({week:'',rank:null,points:0,cleared:0,ticks:0,domain:null,wallet:account.wallet??'browser-playtest',final:true,local:Platform.OS==='web',earned:false,outfit:economy.equipment.outfit,frame:economy.equipment.frame,campaign:campaignSummary(progress.progress,hud)}),[progress.progress,hud.status,hud.mission,hud.score,hud.ticks,account.wallet,economy.equipment.outfit,economy.equipment.frame]);
 const finaleAudio=useGameAudio(require('../assets/audio-milestones/campaign-complete.wav')),objectiveAudio=useGameAudio(require('../assets/audio-milestones/next-phone.wav'));
 const finalePlayed=useRef(false),previousDelivery=useRef(0);
 useEffect(()=>{let cancelled=false;if(hud.status==='playing')finalePlayed.current=false;if(finaleVisible&&!finalePlayed.current){finalePlayed.current=true;if(settings.sound){finaleAudio.volume=settings.volume*.8;void finaleAudio.seekTo(0).then(()=>{if(!cancelled)finaleAudio.play();}).catch(()=>{});}}if(!settings.sound||paused||hideoutOpen)finaleAudio.pause();return()=>{cancelled=true;};},[finaleVisible,hud.status,settings.sound,settings.volume,paused,hideoutOpen,finaleAudio]);
 useEffect(()=>{let cancelled=false;if(gameplayVisible&&hud.status==='playing'&&hud.delivered>previousDelivery.current&&hud.delivered<(level.targets?.length??1)&&settings.sound){objectiveAudio.volume=settings.volume*.7;void objectiveAudio.seekTo(0).then(()=>{if(!cancelled)objectiveAudio.play();}).catch(()=>{});}previousDelivery.current=hud.delivered;if(!gameplayVisible||!settings.sound)objectiveAudio.pause();return()=>{cancelled=true;};},[hud.delivered,gameplayVisible,settings.sound,settings.volume,objectiveAudio,level]);

 useEffect(()=>{if(!testMission&&!trial.active&&!timedRun&&hud.status==='won'&&!recorded.current&&progress.ready&&economy.ready){recorded.current=true;progress.complete(hud);if(account.preview)saveLocalReward();else if(guide.retries>0)rewardResolved(0,'Tutorial checkpoint run. Replay the mission to earn verified credits.');}},[hud,progress.ready,progress.complete,timedRun,trial.active,economy.ready,account.preview,rewardResolved]);
 useEffect(()=>{if(hud.status!=='playing'&&!completedReplay)setCompletedReplay({version:(combatMode?2:1) as 1|2,chunks:recording.value.map(c=>({...c}))});},[hud.status,completedReplay,recording]);
 const latest=useRef<GameState>(hud),latestStats=useRef<Stats>(zeroStats);
 const laserAlarm=(hud.combat?.tripwire?.until??0)>hud.ticks,downed=hud.guards.reduce((n,g)=>n+(g.hp<=0?1:0),0);
 const alarmAudio=useAudioPlayer(require('../assets/audio-combat-v3/alarm.wav'));
 const pickupAudio=useAudioPlayer(require('../assets/audio-combat-v3/pickup.wav')),dashAudio=useAudioPlayer(require('../assets/audio-v3/dash.wav')),successAudio=useAudioPlayer(require('../assets/audio-combat-v3/escape.wav'));
 const decoyAudio=useAudioPlayer(require('../assets/audio-v3/decoy.wav')),caughtAudio=useAudioPlayer(require('../assets/audio-combat-v3/caught.wav')),spotAudio=useAudioPlayer(require('../assets/audio-v3/spot.wav')),switchAudio=useAudioPlayer(require('../assets/audio-v3/switch.wav'));
 const publish=useCallback((snapshot:GameState,epoch?:number)=>{if(epoch!==undefined&&epoch!==sceneEpoch.current)return;latest.current=snapshot;setHud(snapshot);onSnapshot?.(snapshot);},[onSnapshot]);
 const publishStats=useCallback((value:Stats)=>{latestStats.current=value;setStats(value);},[]);
 useEffect(()=>{for(const player of [pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio]){player.volume=settings.sound?settings.volume:0;if(!settings.sound)player.pause();}},[settings.sound,settings.volume,pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio]);
 useEffect(()=>{alarmAudio.loop=true;alarmAudio.volume=settings.sound?settings.volume*.12:0;if(settings.sound&&(hud.securityAlarm||laserAlarm)&&hud.status==='playing'&&!paused)alarmAudio.play();else alarmAudio.pause();return()=>alarmAudio.pause();},[alarmAudio,settings.sound,settings.volume,hud.securityAlarm,laserAlarm,hud.status,paused]);
 const lastSpotAt=useRef(-Infinity);
 const soundAllowed=useRef(false);soundAllowed.current=settings.sound&&!paused&&!walletOpen&&!hideoutOpen&&!rewardsOpen;
 const event=useCallback((kind:'pickup'|'dash'|'success'|'caught'|'decoy'|'spot'|'switch')=>{
   if(kind==='spot'){const now=Date.now();if(now-lastSpotAt.current<1300)return;lastSpotAt.current=now;}
   if(soundAllowed.current&&!(kind==='success'&&!timedRun&&CAMPAIGN_IDS.every(id=>id===latest.current.mission||!!progress.progress.missions[id]))){const player={pickup:pickupAudio,dash:dashAudio,success:successAudio,caught:caughtAudio,decoy:decoyAudio,spot:spotAudio,switch:switchAudio}[kind];player.seekTo(0).then(()=>{if(soundAllowed.current){player.volume=settingsRef.current.volume*({pickup:1,dash:.7,success:.9,caught:.8,decoy:.7,spot:.65,switch:.7}[kind]);player.play();}}).catch(()=>{});}
   haptic(kind);
 },[pickupAudio,dashAudio,successAudio,decoyAudio,caughtAudio,spotAudio,switchAudio,timedRun,progress.progress,haptic]);
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
 // latest js callbacks behind one ref so the frame worklet keeps a single identity
 const jsRef=useRef({publish,publishStats,event,checkpoint,beginGuide});jsRef.current={publish,publishStats,event,checkpoint,beginGuide};
 const callPublish=useCallback((snapshot:GameState,epoch?:number)=>jsRef.current.publish(snapshot,epoch),[]);
 const callStats=useCallback((value:Stats)=>jsRef.current.publishStats(value),[]);
 const callEvent=useCallback((kind:Parameters<typeof event>[0])=>jsRef.current.event(kind),[]);
 const callCheckpoint=useCallback((replay:Replay)=>jsRef.current.checkpoint(replay),[]);
 const callBeginGuide=useCallback(()=>jsRef.current.beginGuide(),[]);
 const frameDriver=useFrameCallback(useCallback((frame:{timeSincePreviousFrame:number|null})=>{
   'worklet';
   // null marks the first callback after registration, which now happens once per mount
   const raw=frame.timeSincePreviousFrame;if(raw===null)return;
   if(suspended.value||!sceneReady.value){pendingTap.value=null;accumulator.value=0;return;}
   tapElapsed.value+=raw;
   if(tapReady(pendingTap.value,tapElapsed.value)&&game.value.status==='playing'){
    const point=pendingTap.value!;pendingTap.value=null;tapElapsed.value=0;
    const seq=Math.max(game.value.combat?.commandSeen??0,input.value.command?.seq??0)+1;
    const tapped=assistedCombatTap(game.value,point.x,point.y,seq);
    const command=guideStage.value>=0?guideCommand(guideStage.value,tapped):tapped;
    if(command){input.modify(v=>{v.command=command;return v;});if(guideWaiting.value){guideWaiting.value=false;runOnJS(callBeginGuide)();}}
   }
   if(guideWaiting.value){accumulator.value=0;return;}
   const dt=Math.min(raw/1000,.1);clock.value+=dt;
   frameTotal.value++;if(raw>25)slowTotal.value++;
   samples.modify(v=>{v.push(raw);if(v.length>120)v.shift();return v;});reportClock.value+=raw;
   if(reportClock.value>=1000){
     const sorted=[...samples.value].sort((a,b)=>a-b);const mean=samples.value.reduce((a,b)=>a+b,0)/Math.max(1,samples.value.length);
     runOnJS(callStats)({fps:1000/mean,p95:sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]??0,frames:frameTotal.value,slow:slowTotal.value});reportClock.value=0;
   }
   accumulator.value=Math.min(accumulator.value+dt,TUNING.step*3);
   saveClock.value+=dt;hudClock.value+=dt;
   // frames without a simulation step change nothing, so they only advance interpolation
   if(accumulator.value+1e-9<TUNING.step){alpha.value=accumulator.value/TUNING.step;return;}
   const previousDamage=game.value.combat?.damageTaken??0,previousDecoys=game.value.decoysLeft,previousAlert=game.value.alert,previousPower=game.value.power,previousRelays=[...game.value.relayTimers],previousCarry=game.value.carrying,previousDashes=game.value.dashes,previousTool=game.value.toolSeen,previousStatus=game.value.status;
   game.modify(s=>{recording.modify(chunks=>{while(accumulator.value+1e-9>=TUNING.step){recordStep(s,input.value,chunks);accumulator.value-=TUNING.step;}return chunks;});return s;},true);
   alpha.value=accumulator.value/TUNING.step;
   if(paidEntry&&(saveClock.value>=1||previousStatus!==game.value.status)){saveClock.value=0;runOnJS(callCheckpoint)({version:(combatMode?2:1) as 1|2,chunks:recording.value.map(c=>({...c}))});}
   if(game.value.decoysLeft<previousDecoys)runOnJS(callEvent)('decoy');
   if(!combatMode&&previousAlert<=0&&game.value.alert>0)runOnJS(callEvent)('spot');
   if(game.value.power!==previousPower||game.value.relayTimers.some((v,i)=>v>(previousRelays[i]??0)))runOnJS(callEvent)('switch');
   if(game.value.carrying&&!previousCarry)runOnJS(callEvent)('pickup');
   if(game.value.dashes>previousDashes)runOnJS(callEvent)('dash');
   if(game.value.status==='won'&&previousStatus!=='won')runOnJS(callEvent)('success');
   if(game.value.status==='caught'&&previousStatus!=='caught')runOnJS(callEvent)('caught');
   if(hudClock.value>=.12||previousDamage!==(game.value.combat?.damageTaken??0)||previousTool!==game.value.toolSeen||previousCarry!==game.value.carrying||previousStatus!==game.value.status||previousDashes!==game.value.dashes){runOnJS(callPublish)({...game.value},simulationEpoch.value);hudClock.value=0;}
 },[suspended,sceneReady,pendingTap,tapElapsed,game,input,guideStage,guideWaiting,clock,frameTotal,slowTotal,samples,reportClock,accumulator,recording,alpha,saveClock,hudClock,simulationEpoch,paidEntry,combatMode,callPublish,callStats,callEvent,callCheckpoint,callBeginGuide]));
 useEffect(()=>{frameDriver.setActive(renderGameSurface&&!paused);return()=>frameDriver.setActive(false);},[renderGameSurface,paused,frameDriver]);
 const pause=useCallback((value:boolean)=>{
  if(!value&&paidEntry&&(!recoveryReady||recoveryError||deadlinePassed))return;
  suspended.value=value;pendingTap.value=null;previousTap.value=null;
  if(timedRun){input.value={...idleInput(),dash:game.value.dashSeen,tool:game.value.toolSeen};if(value&&paidEntry)checkpoint({version:(combatMode?2:1) as 1|2,chunks:recording.value.map(c=>({...c}))});}
  else{input.value=idleInput();game.modify(s=>{'worklet';s.vx=0;s.vy=0;s.px=s.x;s.py=s.y;s.dashSeen=0;s.toolSeen=0;return s;});}
  setPaused(value);
 },[suspended,input,game,timedRun,paidEntry,checkpoint,recording,recoveryReady,recoveryError,deadlinePassed]);
 const leavePaid=useCallback(async()=>{if(!paidEntry)return;suspended.value=true;setPaused(true);try{await persistPaid({version:(combatMode?2:1) as 1|2,chunks:recording.value.map(c=>({...c}))});onPaidExit();}catch{/* Keep the screen and input log available for a save retry. */}},[paidEntry,suspended,persistPaid,recording,onPaidExit]);
 const leaveRank=useCallback(async()=>{if(!rankTicket)return;if(rankTicket.practice){onRankExit();return;}if(Platform.OS==='web'&&rankTicket.manifest.contract){const {abandonLocal}=await import('./league/local');abandonLocal();onRankExit();return;}try{if(game.value.status==='playing'){const session=await account.session(false);if(session.wallet===rankTicket.wallet)await rankedApi.abandon(session.token,rankTicket.id);}else if(!rankResolved.current)await savePending(rankTicket,{version:(combatMode?2:1) as 1|2,chunks:recording.value.map(c=>({...c}))});}catch{/* The daily screen can recover the server ticket after an outage. */}finally{onRankExit();}},[rankTicket,game,recording,account.session,onRankExit]);
 const restart=useCallback((next:MissionId=game.value.mission)=>{if(trial.active){trial.finish();return;}if(paidEntry){void leavePaid();return;}if(rankTicket){void leaveRank();return;}sceneReady.value=false;suspended.value=true;pendingTap.value=null;previousTap.value=null;tapElapsed.value=TAP_INTERVAL_MS;simulationEpoch.value=++sceneEpoch.current;setSceneVersion(sceneEpoch.current);setSceneLoading(true);setSceneError('');recording.value=[];setCompletedReplay(undefined);rewardEpoch.current++;setEarnedNotice('');setCreditReward({amount:null});setRewardClaimed(false);setAutoClaim(false);setRewardRetry(0);connectClaimPending.current=false;recorded.current=false;setMission(next);const fresh=guide.start(next)??initialState(next,combatMode?combatLevel(next):undefined);game.value=fresh;input.value=idleInput();accumulator.value=0;alpha.value=0;clock.value=0;samples.value=[];frameTotal.value=0;slowTotal.value=0;reportClock.value=0;hudClock.value=0;setHud(fresh);latest.current=fresh;suspended.value=false;setPaused(false);setStats(zeroStats);},[game,input,accumulator,alpha,clock,samples,frameTotal,slowTotal,reportClock,hudClock,suspended,rankTicket,leaveRank,recording,paidEntry,leavePaid,trial,guide.start]);
 // Explicit exits must open the map even when Hideout remembers a briefing or store tab.
 const backToMissions=()=>{pause(true);economy.setTab('map');setMissionMapRequest(n=>n+1);setHideoutOpen(true);};
 const introduceMission=(next:MissionId)=>{if(testMission||timedRun){restart(next);return;}pause(true);setHideoutOpen(false);setIntroMission(next);};
 useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{if(state!=='active'){finaleAudio.pause();objectiveAudio.pause();if(game.value.status==='playing')pause(true);}});return()=>subscription.remove();},[pause,game,finaleAudio,objectiveAudio]);
 useEffect(()=>{
   if(Platform.OS!=='web')return;
   const keys=new Set<string>();
   const sync=()=>{if(combatMode)return;const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));const y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));input.modify(v=>{v.x=x;v.y=y;v.interact=keys.has('e');return v;});};
   const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(introMission||walletOpen||hideoutOpen||mapOpen||settingsOpen||dailyOpen||paidOpen||rewardsOpen)return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' ','escape','r','q'].includes(k))e.preventDefault();keys.add(k);sync();if(!combatMode&&k===' '&&!e.repeat)input.modify(v=>{v.dash++;return v;});if(!combatMode&&k==='q'&&!e.repeat)input.modify(v=>{v.tool=(v.tool??0)+1;return v;});if(k==='escape'&&!e.repeat&&game.value.status==='playing')pause(!suspended.value);if(k==='r'&&!e.repeat){keys.clear();restart();}};
   const up=(e:KeyboardEvent)=>{keys.delete(e.key.toLowerCase());sync();};
   const blur=()=>{keys.clear();if(game.value.status==='playing')pause(true);};
   window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
   const visibility=()=>{if(document.hidden)blur();};document.addEventListener('visibilitychange',visibility);
   // Read-only diagnostics for reproducible local playtests. No teleport, score or win hooks.
   (window as unknown as {__SEEKER_MVP__:unknown}).__SEEKER_MVP__={renderer:'2d-skia',rulesHash:rulesManifest.rulesHash,snapshot:()=>({...game.value,guards:game.value.guards.map(g=>({...g}))}),metrics:()=>({...latestStats.current}),get camera(){return {...camera.value};},replay:()=>({version:(combatMode?2:1) as 1|2,chunks:recording.value.map(c=>({...c}))}),get level(){return stateLevel(game.value);}};
   return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
 },[input,pause,restart,suspended,recording,introMission,walletOpen,hideoutOpen,mapOpen,settingsOpen,dailyOpen,paidOpen,rewardsOpen]);
 const teachingTarget=guideTarget(guide.stage,hud);
 const tapBoard=useMemo(()=>Gesture.Tap().maxDuration(650).onBegin(e=>{
  'worklet';if(suspended.value||!sceneReady.value||!game.value.combat||game.value.status!=='playing')return;
  const point=screenToWorld(e.x-1,e.y-1,size,camera.value),tap={x:Math.round(point.x*100)/100,y:Math.round(point.y*100)/100,at:Date.now()};
  if(isDuplicateTap(previousTap.value,tap))return;
  previousTap.value=tap;pendingTap.value=tap;
 }),[size,camera,suspended,sceneReady,game,pendingTap,previousTap]);
 const sceneLoaded=useCallback(()=>{
  const expected=sceneVersion;if(sceneEpoch.current!==expected)return;
  setSceneLoading(false);setSceneError('');
  const reduced=!!settingsRef.current.reducedEffects;
  runOnUI(()=>{'worklet';if(simulationEpoch.value!==expected||sceneReady.value)return;accumulator.value=0;focusProgress.value=reduced?1:0;if(reduced){sceneReady.value=true;return;}focusProgress.value=withTiming(1,{duration:650},finished=>{if(finished&&simulationEpoch.value===expected){accumulator.value=0;sceneReady.value=true;}});})();
 },[sceneVersion,sceneReady,simulationEpoch,accumulator,focusProgress]);
 const sceneFailed=useCallback(()=>{if(sceneEpoch.current===sceneVersion)setSceneError('Could not load the map. Try again.');},[sceneVersion]);
 useEffect(()=>{if(!sceneLoading||!renderGameSurface)return;const timer=setTimeout(()=>setSceneError('The map is taking longer to load. Retry to reload its artwork.'),12000);return()=>clearTimeout(timer);},[sceneLoading,sceneVersion,renderGameSurface]);
 const appearance=useMemo(()=>({...economy.equipment,reducedEffects:settings.reducedEffects}),[economy.equipment.outfit,economy.equipment.trail,economy.equipment.frame,economy.equipment.rack,settings.reducedEffects]);
 // gesture objects are memoised; rebuilding them each render reconfigures the detectors on every hud publish
 const joystick=useMemo(()=>Gesture.Pan().minDistance(0).onBegin(e=>{const dx=(e.x-54)/36,dy=(e.y-54)/36,m=Math.max(1,Math.hypot(dx,dy));input.modify(v=>{v.x=dx/m;v.y=dy/m;return v;});}).onUpdate(e=>{const dx=(e.x-54)/36,dy=(e.y-54)/36,m=Math.max(1,Math.hypot(dx,dy));input.modify(v=>{v.x=dx/m;v.y=dy/m;return v;});}).onFinalize(()=>{input.modify(v=>{v.x=0;v.y=0;return v;});}),[input]);
 const take=useMemo(()=>Gesture.LongPress().minDuration(0).maxDistance(100).onBegin(()=>{input.modify(v=>{v.interact=true;return v;});}).onFinalize(()=>{input.modify(v=>{v.interact=false;return v;});}),[input]);
 const dash=useMemo(()=>Gesture.Tap().onBegin(()=>{input.modify(v=>{v.dash++;return v;});}),[input]);
 const tool=useMemo(()=>Gesture.Tap().onBegin(()=>{input.modify(v=>{v.tool=(v.tool??0)+1;return v;});}),[input]);
 const noTap=useMemo(()=>Gesture.Tap().enabled(false),[]);
 const stickStyle=useAnimatedStyle(()=>({transform:[{translateX:input.value.x*31},{translateY:input.value.y*31}]}));
 const switchIndex=nearSwitch(hud),pad=level.switches?.[switchIndex];
 const activeTake=(nearPhone(hud)||switchIndex>=0)&&hud.status==='playing',activeDash=hud.carrying&&hud.battery>=20&&hud.cooldown<=.05&&hud.status==='playing';
 const lureMessage=decoyMessage(hud),alarmOn=(hud.securityAlarm||laserAlarm)&&hud.status==='playing';
 const relaySeconds=Math.ceil(Math.max(0,...hud.relayTimers));
 const entranceOpening=alarmOn&&level.patrols.some((g,i)=>g.reserveAfter!==undefined&&!hud.guards[i]?.spawned&&g.reserveAfter-hud.alarmSeconds<=4);
 const contextHint=laserAlarm?'LASER TRIPPED · GUARDS CHECKING THIS CROSSING':combatMode?(encounterHint(hud)??(hud.combat?.feedbackLeft&&hud.combat.feedback==='ambush'?((level.combat?.revision??0)>=15?'SILENT TAKEDOWN':'AMBUSH · DOUBLE HIT'):hud.combat?.feedbackLeft&&hud.combat.feedback==='blocked'?'Tap nearby floor to redirect':hud.combat?.feedbackLeft&&hud.combat.feedback==='cover'?((level.combat?.revision??0)>=15?'ARMOR BLOCKED · FLANK BEHIND':'Behind cover · choose another position'):level.exitWindow?`EXIT ${exitOpen(hud)?'OPEN':'WAIT'} · ${exitWindowSeconds(level.exitWindow,hud.elapsed)}s`:entranceOpening?'SECURITY DOOR OPENING · KEEP CLEAR':alarmOn?'PHONE TAKEN · GET OUT':'')):level.exitWindow?`EXIT ${exitOpen(hud)?'OPEN':'LOCKED'} · ${exitWindowSeconds(level.exitWindow,hud.elapsed)}s`:relaySeconds>0?`Relay door open · ${relaySeconds}s`:pad?(pad.kind==='relay'?`Stop · ACT opens door for ${pad.duration??9}s`:'Stop · ACT switches circuits'):activeTake&&!hud.carrying?'Stop · hold TAKE':lureMessage|| (hud.alert>0?'Spotted! Break their line of sight.':alarmOn?`PHONE TRACKED · guards +${alarmSpeedPercent(hud)}%`:'');
 const damageStyle=useAnimatedStyle(()=>({opacity:damagePulse.value}));
 const alarmWash=useAnimatedStyle(()=>({opacity:(game.value.securityAlarm||(game.value.combat?.tripwire?.until??0)>game.value.ticks)&&game.value.status==='playing'&&!suspended.value&&!settings.reducedEffects?.025+.04*(.5+.5*Math.sin(clock.value*2.5)):0}));
 const alarmBorder=useAnimatedStyle(()=>({opacity:(game.value.securityAlarm||(game.value.combat?.tripwire?.until??0)>game.value.ticks)&&game.value.status==='playing'&&!suspended.value?(settings.reducedEffects?.35:.4+.25*(.5+.5*Math.sin(clock.value*2.5))):0}));
 // latest callbacks behind one ref so the memoised panels receive stable handlers
 const live=useRef({closeOverlay,onRankStart,onPaidStart,retrySync:progress.retrySync,guideReplay:guide.replay,coachReplay:coach.replay,restart,introduceMission});
 live.current={closeOverlay,onRankStart,onPaidStart,retrySync:progress.retrySync,guideReplay:guide.replay,coachReplay:coach.replay,restart,introduceMission};
 const handlers=useMemo(()=>({
  rewardsLegacy:()=>{setRewardsOpen(false);setPaidOpen(true);},
  rewardsClose:()=>live.current.closeOverlay(setRewardsOpen),
  walletClose:()=>live.current.closeOverlay(setWalletOpen),
  hideoutContract:(ticket:RunTicket)=>{setHideoutOpen(false);live.current.onRankStart(ticket);},
  hideoutStart:(next:MissionId)=>live.current.introduceMission(next),
  hideoutClose:()=>setHideoutOpen(false),
  hideoutShop:()=>{setReturnHome(true);setHideoutOpen(false);setWalletOpen(true);},
  hideoutSync:()=>{void live.current.retrySync();},
  hideoutSettings:()=>{setReturnHome(true);setHideoutOpen(false);setSettingsOpen(true);},
  hideoutDaily:()=>{setHideoutOpen(false);setDailyOpen(true);},
  hideoutPaid:()=>{setReturnHome(true);setHideoutOpen(false);setRewardsOpen(true);},
  settingsReplay:()=>{setReturnHome(false);if(combatMode)live.current.guideReplay();else live.current.coachReplay();setSettingsOpen(false);setHideoutOpen(false);live.current.restart('practice');},
  settingsClose:()=>live.current.closeOverlay(setSettingsOpen),
  dailyClose:()=>{setDailyOpen(false);setHideoutOpen(true);},
  dailyStart:(ticket:RunTicket)=>{setDailyOpen(false);live.current.onRankStart(ticket);},
  paidClose:()=>live.current.closeOverlay(setPaidOpen),
  paidStart:(play:PaidPlay)=>{setPaidOpen(false);live.current.onPaidStart(play);},
 }),[combatMode]);
 return <SafeAreaView style={s.screen} edges={['top','bottom']}><StatusBar style="light"/><RewardsPanelMemo onLegacy={handlers.rewardsLegacy} visible={rewardsOpen} onClose={handlers.rewardsClose}/><WalletPanelMemo visible={walletOpen} onClose={handlers.walletClose}/><HideoutMemo onContractStart={handlers.hideoutContract} initialTab={dailyReturn?'leaderboard':economy.tab} mapRequest={missionMapRequest} visible={hideoutOpen} onStart={handlers.hideoutStart} onClose={handlers.hideoutClose} onShop={handlers.hideoutShop} progress={progress.progress} syncStatus={progress.syncStatus} onSync={handlers.hideoutSync} onSettings={handlers.hideoutSettings} onDaily={handlers.hideoutDaily} onPaid={handlers.hideoutPaid}/><SettingsPanelMemo onReplayTips={handlers.settingsReplay} mission={mission} visible={settingsOpen} onClose={handlers.settingsClose}/><DailyPanelMemo visible={dailyOpen} onClose={handlers.dailyClose} onStart={handlers.dailyStart}/><PaidPanelMemo visible={paidOpen} onClose={handlers.paidClose} onStart={handlers.paidStart}/><View style={[s.shell,{width:fullViewport?width:Math.max(size+16,Math.min(width,460)),paddingHorizontal:fullViewport?0:8}]}>
   <View testID="gameplay-topbar" pointerEvents={showGameplayHeader?'auto':'none'} accessibilityElementsHidden={!showGameplayHeader} importantForAccessibility={showGameplayHeader?'auto':'no-hide-descendants'} aria-hidden={!showGameplayHeader} style={[s.header,s.overlayHeader,fullViewport&&{paddingHorizontal:8},!showGameplayHeader&&{display:'none'}]}>
    <Pressable accessibilityRole="button" accessibilityLabel={paidEntry?'Save and leave paid attempt':rankTicket?(rankTicket.manifest.contract?'Leave weekly mission':'Leave daily challenge'):'Open missions'} onPress={()=>{if(timedRun)restart();else if(trial.active){pause(true);trial.finish();}else backToMissions();}} style={s.iconButton}><Text style={s.iconText}>‹</Text></Pressable>
    <View style={s.missionHeading}><Text style={s.levelName} numberOfLines={1}>{testMission?'TEST / '+String(level.number).padStart(2,'0'):process.env.EXPO_PUBLIC_JUDGE_PREVIEW==='1'?'JUDGE / '+String(level.number).padStart(2,'0'):trial.active?'TRIAL':rankTicket?(rankTicket.practice?'PRACTICE':rankTicket.manifest.contract?'RANKED':'DAILY'):String(level.number).padStart(2,'0')} · {level.title}</Text><View style={s.runMetrics}>
    {(level.targets?.length??1)>1&&<Text accessibilityLabel={`Phones delivered ${hud.delivered} of ${level.targets!.length}`} style={s.charge}>▯ {hud.delivered}/{level.targets!.length}</Text>}
    <Text accessibilityLabel={paidEntry?'Submission time remaining':'Run time'} style={s.timer}>{time(paidEntry?submissionSeconds:hud.elapsed)}</Text>
    {combatMode&&<Text accessibilityLabel={`Health ${hud.combat?.hp??100} of 100`} style={[s.charge,{color:(hud.combat?.hp??100)<40?'#FF9282':'#CFE6E4',minWidth:0,textAlign:'left'}]}>♥ {hud.combat?.hp??100}</Text>}
    {!combatMode&&hud.carrying&&<Text accessibilityLabel={`Phone charge ${hud.battery} percent`} style={s.charge}>{hud.battery}%</Text>}
    </View></View>
    <CreditBalance onPress={()=>{pause(true);economy.openCredits();}}/>
    <Pressable accessibilityRole="button" accessibilityLabel={paused?'Resume game':'Pause game'} disabled={hud.status!=='playing'} onPress={()=>{if(game.value.status==='playing')pause(!paused);}} style={s.iconButton}><Text style={s.iconText}>{paused?'▷':'Ⅱ'}</Text></Pressable>
   </View>
   {!showGameplayHeader&&renderGameSurface&&!sceneLoading&&combatMode&&<View testID="gameplay-kills" pointerEvents="none" accessibilityLabel={`Guards down ${downed} of ${hud.guards.length}`} style={s.killPill}><Text style={s.killText}>◎ {downed}<Text style={{color:'#7FA393'}}>/{hud.guards.length}</Text></Text></View>}
   {!showGameplayHeader&&renderGameSurface&&!sceneLoading&&<Pressable testID="gameplay-pause" accessibilityRole="button" accessibilityLabel="Pause game" onPress={()=>pause(true)} style={s.floatingPause}><Text style={s.iconText}>Ⅱ</Text></Pressable>}
   <View style={{width:size+2,height:boardHeight+2}}><GestureDetector gesture={combatMode?tapBoard:noTap}><View testID="game-board" style={[s.board,{width:size+2,height:boardHeight+2}]}>
    {renderGameSurface&&<GameCanvas key={sceneVersion} onReady={sceneLoaded} onLoadError={sceneFailed} camera={camera} size={size} height={boardHeight} input={input} game={game} alpha={alpha} clock={clock} level={level} appearance={appearance}/>}
    {renderGameSurface&&!settings.reducedEffects&&<MissionFocus progress={focusProgress} game={game} camera={camera} width={size} height={boardHeight}/>}
    <Animated.View pointerEvents="none" testID="camera-world-overlays" style={[{position:'absolute',left:0,top:0,width:size,height:boardHeight},worldOverlayStyle]}>
    {combatMode&&<SecurityEntrances level={level} state={hud} size={size} reduced={!!settings.reducedEffects}/>}
    <MechanismLabels level={level} state={hud} size={size}/>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}><Text style={[s.mapLabel,{top:size/12*(level.exit.y+.23),left:size/12*level.exit.x,width:size/12*level.exit.w,color:'#d6f4e4'}]}>EXIT</Text></View>
    </Animated.View>
    {!guide.active&&hud.status==='playing'&&<PhoneObjectivePill state={hud} total={level.targets?.length??1} level={level}/>}
    <CleanCombo state={hud} run={`${mission}:${sceneVersion}`} active={gameplayVisible&&!guide.active} sound={settings.sound} volume={settings.volume} reduced={!!settings.reducedEffects}/>


    {!!(contextHint||coach.text)&&!paused&&hud.status==='playing'&&<View pointerEvents="none" testID="security-banner" accessibilityLiveRegion="polite" style={[s.contextToast,alarmOn&&{backgroundColor:'#3A171FEF'}]}><Text style={s.contextText} numberOfLines={2}>{contextHint||coach.text}</Text></View>}
    {!!coach.text&&!paused&&<Pressable accessibilityRole="button" accessibilityLabel="Skip movement tips" onPress={coach.dismiss} style={{position:"absolute",bottom:5,right:5,padding:10,borderRadius:12,backgroundColor:"#142923EC"}}><Text style={s.contextText}>Skip tips ×</Text></Pressable>}
    {guide.active&&hud.status==='playing'&&<View pointerEvents="none" style={StyleSheet.absoluteFill}><View testID="tutorial-target" style={{position:'absolute',left:(teachingTarget?.x??0)*size/12-23,top:(teachingTarget?.y??0)*size/12-23,width:46,height:46,borderRadius:23,borderWidth:3,borderColor:'#DEFFD9',backgroundColor:'#BCECCB30'}}/>{guide.waiting&&teachingTarget&&gameplayVisible&&<TutorialHand x={teachingTarget.x*size/12} y={teachingTarget.y*size/12} width={size} height={boardHeight} reduced={!!settings.reducedEffects}/>}<View style={{position:'absolute',bottom:8,left:8,right:8,padding:9,borderRadius:12,backgroundColor:'#142923F5'}}><Text testID="tutorial-instruction" style={[s.contextText,{fontSize:12,fontWeight:'700'}]}>{GUIDE_STEPS[guide.stage]!.text}</Text></View></View>}
    {guide.active&&<Pressable accessibilityRole="button" accessibilityLabel="Skip combat tutorial" onPress={guide.dismiss} style={{position:'absolute',top:58,right:8,padding:10,backgroundColor:'#142923EC',borderRadius:10}}><Text style={s.contextText}>Skip guide</Text></Pressable>}
   </View></GestureDetector>
   </View>
   {!combatMode&&<View testID="game-controls" style={[s.controls,{width:Math.max(size,300)}]}>
    <View testID="power-controls" style={s.powerControls}>
     {!!level.decoys&&<GestureDetector gesture={tool}><View accessible accessibilityRole="button" accessibilityLabel={`Distract guards with noise in the direction you face. ${hud.decoysLeft} left.`} testID="decoy-button" style={[s.powerButton,hud.decoysLeft>0&&s.powerReady]}>
      <View pointerEvents="none" style={s.buttonRing}/><ActionIcon kind="decoy" color={hud.decoysLeft>0?'#CFE6E4':'#71817E'}/><Text style={[s.actionLabel,!hud.decoysLeft&&s.actionMuted]}>DISTRACT</Text><View pointerEvents="none" style={[s.countBadge,!hud.decoysLeft&&s.countEmpty]}><Text style={s.countText}>{hud.decoysLeft}</Text></View>
     </View></GestureDetector>}
     <GestureDetector gesture={take}><View accessible accessibilityRole="button" accessibilityLabel={pad?`Activate ${pad.kind} switch`:"Hold to take Seeker"} testID="take-button" style={[s.powerButton,activeTake&&s.powerReady]}>
      <View pointerEvents="none" style={s.buttonRing}/><ActionIcon kind={pad?'switch':hud.carrying?'check':'phone'} color={activeTake?'#D8EEE4':'#71817E'}/><Text style={[s.actionLabel,!activeTake&&s.actionMuted]}>{pad?'ACT':hud.carrying?'TAKEN':'TAKE'}</Text>
     </View></GestureDetector>
     <GestureDetector gesture={dash}><View accessible accessibilityRole="button" accessibilityLabel="Dash. Costs twenty battery." testID="dash-button" style={[s.powerButton,s.dashButton,activeDash&&s.dashReady]}>
      <View pointerEvents="none" style={[s.buttonRing,activeDash&&s.dashRing]}/><ActionIcon kind="dash" color={activeDash?'#18302B':'#71817E'}/><Text style={[s.actionLabel,activeDash?s.dashLabel:s.actionMuted]}>DASH</Text>
     </View></GestureDetector>
    </View>
    <GestureDetector gesture={joystick}><Animated.View accessible accessibilityRole="adjustable" accessibilityLabel="Movement joystick on the right. Drag in any direction." testID="joystick" style={s.joystick}><View style={s.stickRing}/><View style={s.crossH}/><View style={s.crossV}/><Animated.View style={[s.knob,stickStyle]}><View style={s.knobCenter}/></Animated.View></Animated.View></GestureDetector>
   </View>}
   {!!progress.error&&<Pressable accessibilityRole="button" onPress={()=>void progress.retrySave()} style={s.saveError}><Text style={s.contextText}>{progress.error}</Text></Pressable>}

 </View>
 {!sceneLoading&&!claimVisible&&(paused||hud.status!=='playing')&&<ResultSheet bottom={insets.bottom} celebration={finaleVisible} primarySide={!paused&&hud.status!=='won'?'left':'right'}
  art={paused?(recoveryError?'recovery':!recoveryReady?'pending':'pause'):hud.status==='won'?'success':hud.status==='caught'?'caught':'timeout'}
  eyebrow={finaleVisible?'12 / 12 HEISTS':paused?(recoveryError?'SAVE NEEDS ATTENTION':'RUN PAUSED'):hud.status==='won'?'HEIST COMPLETE':hud.status==='caught'?'PATROL '+(hud.caughtBy+1):'TIME LIMIT'}
  title={finaleVisible?'Every Seeker. Secured.':paused?(recoveryError?'Save interrupted.':'Take a breather.'):hud.status==='won'?'Seeker secured.':hud.status==='caught'?combatMode?'Out of health.':'They spotted you.':'Out of time.'}
  detail={finaleVisible?'Your campaign is complete. Keep the card.':trial.active&&!paused?'Your free attempt is complete. Unlock the campaign for all 12 missions and unlimited retries.':paused?(paidEntry?(deadlinePassed?'Deadline passed. Return to your entry.':!recoveryReady?'Restoring your saved run…':recoveryError?'Retry saving before you resume.': 'Run paused. Your entry deadline still counts down.'):rankTicket?.practice?'Practice paused. No ranked attempt used.':timedRun?'Run paused. Your submission deadline still counts down.':combatMode?((level.combat?.revision??0)>=15?'Tap the floor to move. Tap a guard to approach and slash. Flank armored guards. Tap the phone, then the exit.':'Tap the floor to move. Tap a guard to approach and shoot. Tap the phone, then the exit.'):'Drag to move. Stop and hold TAKE. Use ACT at switches. More help in Settings.'):hud.status==='won'?(timedRun?'Phone recovered.':`${phoneEdition(mission).name} added to your rack.${earnedNotice?' '+earnedNotice:''}`):hud.status==='caught'?(combatMode?'Move when a guard aims. Cover stops their shots.':level.decoys?'Use cover. Tap DISTRACT, then go the other way.':'Break line of sight behind cover. Dash after taking the phone.'):'Take the phone and reach the mint exit.'}
  stats={!finaleVisible&&hud.status==='won'&&!paused?`${time(hud.elapsed)} · ${hud.battery}% ${combatMode?'health':'charge'} · ${(rankTicket?.manifest.contract?contractPoints({status:hud.status,score:hud.score,ticks:hud.ticks,battery:hud.battery},level):hud.score).toLocaleString()} pts`:undefined}
  stars={!finaleVisible&&hud.status==='won'&&!paused?'★'.repeat(starsFor(hud))+'☆'.repeat(3-starsFor(hud)):undefined}
  primary={finaleVisible?{label:'Share card ↗',accessibilityLabel:'Share campaign completion card on X',disabled:!shareReady,onPress:()=>void shareAction.current?.()}:{label:trial.active&&!paused?'View campaign pass':paused?'Resume':paidEntry?'Back to entry':rankTicket?(rankTicket.manifest.contract?'Weekly league':'Back to daily'):hud.status==='won'?(nextMission?'Next mission ↗':'Missions'):'Retry ↗',accessibilityLabel:trial.active&&!paused?'Finish free trial':paused?'Resume run':paidEntry?'Back to paid challenge':rankTicket?(rankTicket.manifest.contract?'Back to weekly league':'Back to daily challenge'):hud.status==='won'?(nextMission?'View next mission':'View missions'):'Retry level',disabled:!!paidEntry&&paused&&(!recoveryReady||!!recoveryError||deadlinePassed),onPress:()=>trial.active&&!paused?trial.finish():paused?pause(false):hud.status==='won'&&!timedRun?(nextMission?introduceMission(nextMission):backToMissions()):restart()}}
  secondary={trial.active?undefined:paused?{label:paidEntry?'Save & leave':rankTicket?'Leave run':'Restart',accessibilityLabel:paidEntry?'Save and leave paid attempt':rankTicket?'Leave challenge':'Restart level',onPress:()=>restart()}:!timedRun?{label:hud.status==='won'?'Replay':'Back to missions',accessibilityLabel:hud.status==='won'?'Retry level':'View missions',onPress:()=>hud.status==='won'?restart():backToMissions()}:undefined}
  utility={trial.active?paused?{label:'Exit trial',onPress:()=>trial.finish()}:undefined:!timedRun&&(paused||hud.status==='won')?{label:'Back to missions',onPress:backToMissions}:paused?(recoveryError?{label:'Retry save',accessibilityLabel:'Retry save',onPress:()=>checkpoint({version:(combatMode?2:1) as 1|2,chunks:recording.value.map(c=>({...c}))})}:{label:'Settings',accessibilityLabel:'Open settings',onPress:()=>setSettingsOpen(true)}):undefined}
 >{finaleVisible&&<CompletionCard data={completionData} reduced={!!settings.reducedEffects} registerShare={registerShare}/>} {paused&&<Pressable accessibilityRole="button" accessibilityLabel="Toggle frame statistics" onPress={()=>setDetails(!details)}><Text style={s.stats}>{details?`${Math.round(stats.fps)} FPS · p95 ${stats.p95.toFixed(1)}ms · ${stats.slow} slow frames`:'Performance details'}</Text></Pressable>} {paidEntry&&completedReplay&&!paused&&<PaidSubmission entry={paidEntry} replay={completedReplay}/>}{rankTicket&&completedReplay&&!paused&&<RunSubmission ticket={rankTicket} replay={completedReplay} onResolved={()=>{rankResolved.current=true;}}/>}</ResultSheet>}
 {!testMission&&!trial.active&&!timedRun&&!guide.active&&guide.retries===0&&hud.status==='won'&&completedReplay&&!paused&&<View style={{position:'absolute',bottom:insets.bottom+3,zIndex:46}}><CampaignSubmission state={hud} replay={completedReplay} quiet retrySignal={rewardRetry} onReward={account.preview?undefined:rewardResolved}/></View>}
 {claimVisible&&<CreditClaim requiresWallet={!account.preview&&!account.wallet&&guide.retries===0} connecting={connectingClaim} onConnect={connectToClaim} autoClaim={autoClaim} reward={creditReward} balance={economy.balance} onRetry={creditReward.amount===null?(account.preview?saveLocalReward:()=>{rewardResolved(null);setRewardRetry(n=>n+1);}):undefined} stars={starsFor(hud)} mission={level.title} onDone={()=>setRewardClaimed(true)}/>}
 {introMission&&<MissionIntro lesson={campaignLesson(introMission)} onBack={()=>{setIntroMission(null);setHideoutOpen(true);}} onPlay={()=>{const next=introMission;setIntroMission(null);restart(next);}}/>}
 {sceneLoading&&!hideoutOpen&&!walletOpen&&!settingsOpen&&!dailyOpen&&!paidOpen&&!rewardsOpen&&<View testID="mission-loading" accessibilityViewIsModal style={[StyleSheet.absoluteFill,{zIndex:80,backgroundColor:'#0C1412',justifyContent:'center',alignItems:'center',padding:28,gap:16}]}>
  <Text style={{color:'#9FBBAD',fontSize:11,fontWeight:'800',letterSpacing:2}}>MISSION {String(level.number).padStart(2,'0')}</Text>
  <Text style={{color:'#E2F2E9',fontSize:27,fontWeight:'900',textAlign:'center'}}>{level.title}</Text>
  {!sceneError&&<ActivityIndicator size="large" color="#CFE6E4"/>}
  <Text accessibilityLiveRegion="polite" style={{color:'#AAC5B7',fontSize:13,textAlign:'center'}}>{sceneError||'Preparing your escape…'}</Text>
  {!!sceneError&&<Pressable accessibilityRole="button" accessibilityLabel="Retry loading mission" onPress={()=>{sceneReady.value=false;simulationEpoch.value=++sceneEpoch.current;setSceneVersion(sceneEpoch.current);setSceneError('');}} style={{padding:16,borderRadius:14,backgroundColor:'#CFE6E4'}}><Text style={{fontWeight:'800',color:'#15352A'}}>Retry loading</Text></Pressable>}
 </View>}
 {finaleVisible&&<CampaignConfetti reduced={!!settings.reducedEffects}/>}
 <Animated.View pointerEvents="none" testID="alarm-wash" style={[StyleSheet.absoluteFill,{backgroundColor:'#FF253E'},alarmWash]}/><Animated.View pointerEvents="none" testID="alarm-border" style={[StyleSheet.absoluteFill,{borderWidth:7,borderColor:'#FF4255'},alarmBorder]}/><View pointerEvents="none" style={StyleSheet.absoluteFill}><Animated.Image testID="damage-glow" source={require('../assets/ui/damage-vignette.png')} resizeMode="stretch" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'},damageStyle]}/></View></SafeAreaView>;
}
const s=StyleSheet.create({
 securityBanner:{minHeight:36,borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:5,justifyContent:'center',gap:3},securityTitle:{fontSize:9,fontWeight:'800',letterSpacing:.4},securityDetail:{fontSize:8,color:'#C5CCD1'},
 screen:{flex:1,backgroundColor:'#0C0C0E',alignItems:'center',justifyContent:'center'},shell:{alignItems:'center',paddingHorizontal:8},
 missions:{height:28,flexDirection:'row',gap:8,marginBottom:4},missionButton:{flex:1,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#333B40',borderRadius:9},missionSelected:{backgroundColor:'#22282C',borderColor:'#88ad9d'},missionText:{color:'#A8B8BB',fontSize:11,fontWeight:'600'},
 overlayHeader:{position:'absolute',top:0,left:0,right:0,zIndex:30,backgroundColor:'#0C1412F2'},killPill:{position:'absolute',left:8,top:6,zIndex:30,height:44,paddingHorizontal:14,borderRadius:22,backgroundColor:'#0C141299',flexDirection:'row',alignItems:'center'},killText:{color:'#CFE6E4',fontSize:15,fontWeight:'800',fontVariant:['tabular-nums']},floatingPause:{position:'absolute',right:8,top:6,zIndex:30,width:44,height:44,borderRadius:22,backgroundColor:'#0C141299',alignItems:'center',justifyContent:'center'},
 header:{width:'100%',height:48,flexDirection:'row',alignItems:'center',gap:8},missionHeading:{flex:1,minWidth:0,gap:3},runMetrics:{flexDirection:'row',alignItems:'center',gap:10},levelName:{color:'#E1ECE5',fontSize:11,fontWeight:'700'},contextToast:{position:'absolute',top:5,left:8,right:8,alignSelf:'center',backgroundColor:'#142923EC',paddingHorizontal:8,paddingVertical:5,borderRadius:7},contextText:{color:'#E0EBDF',fontSize:10,lineHeight:13,textAlign:'center'},saveError:{position:'absolute',bottom:114,left:8,right:8,backgroundColor:'#532721',padding:8,borderRadius:8},wordmark:{color:'#eff0e8',fontWeight:'900',fontSize:14,letterSpacing:.8},subtitle:{color:'#a8b5ac',fontSize:10,letterSpacing:1,marginTop:4,fontWeight:'600'},headerButtons:{flexDirection:'row',gap:5},iconButton:{height:44,width:44,borderRadius:10,borderWidth:1,borderColor:'#333B40',backgroundColor:'#161618',alignItems:'center',justifyContent:'center'},iconText:{color:'#bccfc3',fontSize:20},
 hud:{height:28,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},stage:{flexDirection:'row',alignItems:'center',gap:6},dot:{width:5,height:5,borderRadius:3},stageText:{color:'#b7c6bc',fontSize:9,fontWeight:'700',letterSpacing:1},timer:{color:'#e2e8dc',fontVariant:['tabular-nums'],fontSize:10,fontWeight:'600'},batteryGroup:{flexDirection:'row',alignItems:'center',gap:5},battery:{width:20,height:10,borderRadius:2,borderWidth:1,borderColor:'#a9c3b4',padding:1},batteryFill:{height:'100%',backgroundColor:'#cce1d1'},charge:{color:'#c2d7c9',fontSize:10,minWidth:29,textAlign:'right',fontVariant:['tabular-nums']},board:{borderWidth:1,borderColor:'#444D54',borderRadius:14,overflow:'hidden',backgroundColor:'#161618'},mapLabel:{position:'absolute',textAlign:'center',fontWeight:'800',fontSize:9,letterSpacing:1.8},
 hint:{color:'#acbcb0',fontSize:11,textAlign:'center',height:30,lineHeight:14,marginTop:4},controls:{height:110,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},joystick:{width:108,height:108,borderRadius:54,borderWidth:1,borderColor:'#364148',backgroundColor:'#111719',alignItems:'center',justifyContent:'center'},stickRing:{position:'absolute',width:82,height:82,borderRadius:41,borderWidth:1,borderColor:'#273036'},crossH:{position:'absolute',width:91,height:1,backgroundColor:'#262E34'},crossV:{position:'absolute',width:1,height:91,backgroundColor:'#262E34'},knob:{width:47,height:47,borderRadius:24,backgroundColor:'#cfe6e4',borderWidth:2,borderColor:'#f6f6f5',alignItems:'center',justifyContent:'center',shadowColor:'#a2d4b6',shadowOffset:{width:0,height:0},shadowOpacity:.1,shadowRadius:8},knobCenter:{width:8,height:8,borderWidth:1,borderColor:'#7ea38c',borderRadius:4},powerControls:{flexDirection:'row',alignItems:'center',gap:6},powerButton:{width:52,height:52,borderRadius:26,borderWidth:1,borderColor:'#364943',backgroundColor:'#17211F',alignItems:'center',justifyContent:'center',gap:1},powerReady:{borderColor:'#8CAEA1',backgroundColor:'#29413B'},buttonRing:{position:'absolute',top:3,right:3,bottom:3,left:3,borderWidth:1,borderRadius:50,borderColor:'#73978A33'},actionLabel:{fontSize:8,lineHeight:10,fontWeight:'800',letterSpacing:.4,color:'#D8EEE4'},actionMuted:{color:'#7E918A'},countBadge:{position:'absolute',top:-4,right:-2,minWidth:18,height:18,borderRadius:9,borderWidth:2,borderColor:'#0C0C0E',backgroundColor:'#CFE6E4',alignItems:'center',justifyContent:'center'},countEmpty:{backgroundColor:'#80928A'},countText:{fontSize:9,lineHeight:12,fontWeight:'800',color:'#17332B'},dashButton:{width:60,height:60,borderRadius:30,backgroundColor:'#1B2824'},dashReady:{backgroundColor:'#CFE6E4',borderColor:'#E4F4EC'},dashRing:{borderColor:'#426D5650'},dashLabel:{color:'#18302B'},

 footer:{height:25,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:5},stats:{color:'#91ad9c',fontSize:8,fontVariant:['tabular-nums'],letterSpacing:.3},restart:{color:'#b0c2b3',fontSize:9,fontWeight:'600',letterSpacing:1},keyboard:{fontSize:9,color:'#859298',height:18,marginTop:4},

});
