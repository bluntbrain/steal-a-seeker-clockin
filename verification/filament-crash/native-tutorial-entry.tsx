import '../../src/wallet/polyfill';
import React,{useEffect,useState} from 'react';
import {View,Text} from 'react-native';
import PhoneStage from '../../src/components/PhoneStage';
import {registerRootComponent} from 'expo';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import WalletProvider from '../../src/wallet/WalletProvider';
import SettingsProvider from '../../src/settings/SettingsProvider';
import EconomyProvider from '../../src/commerce/EconomyProvider';
import {AccountContext} from '../../src/commerce/account-context';
import {TrialContext} from '../../src/commerce/TrialContext';
import {Game} from '../../src/GameScreen';
import {runOnUI,runOnJS} from 'react-native-reanimated';
import {recordStep} from '../../src/game/recording';
import {idleInput,type GameState} from '../../src/game/simulation';
import type {ReplayChunk} from '../../shared/replay';
import fixture from './tutorial-fixture.json';
const report=(value:unknown)=>console.log('TUTORIAL_NATIVE_REPLAY',JSON.stringify(value));
const unavailable=async()=>{throw Error('Native tutorial diagnostic has no payment or account access');};
const account={wallet:undefined,loading:false,preview:true,notice:'DIAGNOSTIC ONLY',connect:unavailable,session:unavailable,refresh:unavailable,update:async()=>{}};
function Probe(){
 const [phone,setPhone]=useState<number|null>(null);
 useEffect(()=>{
  const phases=[{at:18000,index:0},{at:27000,index:5},{at:36000,index:-1},{at:38000,index:11},{at:48000,index:null}];
  const timers=phases.map(({at,index})=>setTimeout(()=>{console.log('FILAMENT_LIFECYCLE_PHASE',index);setPhone(index);},at));
  timers.push(setTimeout(()=>console.log('NATIVE_LIFECYCLE_PROBE completed; returned to tutorial'),55000));
  return()=>timers.forEach(clearTimeout);
 },[]);
 useEffect(()=>{const timer=setTimeout(()=>runOnUI(()=>{'worklet';const s=fixture.initial as GameState,recorded:ReplayChunk[]=[];for(const c of fixture.chunks){for(let n=0;n<c.ticks;n++){recordStep(s,{...idleInput(),command:n===0?(c as ReplayChunk).command:undefined},recorded);}}const actual={status:s.status,ticks:s.ticks,score:s.score,hp:s.combat!.hp};runOnJS(report)({actual,expected:fixture.expected,passed:JSON.stringify(actual)===JSON.stringify(fixture.expected)});})(),3000);return()=>clearTimeout(timer);},[]);
 useEffect(()=>{console.log('TUTORIAL_PROBE mounted');const timer=setTimeout(()=>console.log('TUTORIAL_PROBE alive after 15 seconds'),15000);return()=>clearTimeout(timer);},[]);
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><WalletProvider><AccountContext.Provider value={account}><SettingsProvider><EconomyProvider><TrialContext.Provider value={{active:true,finish:()=>{}}}>{phone!==null?<View style={{flex:1,backgroundColor:'#101A21',paddingTop:70}}><Text style={{color:'white'}}>NATIVE FILAMENT DIAGNOSTIC</Text>{phone>=0&&<PhoneStage index={phone} height={440}/>}</View>:<Game dailyReturn={false} paidReturn={false} onRankStart={()=>{}} onRankExit={()=>{}} onPaidStart={()=>{}} onPaidExit={()=>{}}/>}</TrialContext.Provider></EconomyProvider></SettingsProvider></AccountContext.Provider></WalletProvider></SafeAreaProvider></GestureHandlerRootView>;
}
registerRootComponent(Probe);
