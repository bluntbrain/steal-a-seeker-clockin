// Synthetic local QA only. No account entitlement, server ticket or payment exists.
import React,{useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import SettingsProvider from './settings/SettingsProvider';
import WalletProvider from './wallet/WalletProvider';
import {AccountContext,type AccountContextValue} from './commerce/account-context';
import Paywall from './commerce/Paywall';
import {Game} from './GameScreen';
import WeeklyBoard,{type useWeekly} from './ranked/WeeklyBoard';
import {makeContracts,type Contract} from '../shared/contracts';
import {practiceTicket} from '../shared/league';
import {weekWindow} from '../shared/weekly';
import type {RunTicket} from '../shared/ranked';
import rules from '../shared/rules-manifest.json';
const wallet='11111111111111111111111111111111',unavailable=async():Promise<never>=>{throw Error('Synthetic QA: no wallet session.');};
const account:AccountContextValue={wallet,loading:false,preview:true,notice:'Synthetic QA',session:unavailable,refresh:unavailable,update:async()=>{}};
export default function NativeWeeklyProbe(){
 const [mode,setMode]=useState<'weekly'|'campaign'|'paywall'>('weekly');
 const [ticket,setTicket]=useState<RunTicket>(),[attempts,setAttempts]=useState<Record<string,number>>({});
 const window=weekWindow(),contracts=makeContracts(),state={window,now:Date.now(),local:true,error:'',busy:false,pending:false,data:{authenticated:true,week:window.week,endsAt:window.endsAt,rulesHash:rules.rulesHash,contracts,attempts,board:{week:window.week,endsAt:window.endsAt,participants:0,entries:[],nearby:[],personal:null,rival:null,final:false},history:[],earned:false,domain:null,active:null},refresh:async()=>{},signIn:unavailable,recover:async()=>{},abandon:async()=>{},identity:unavailable,equip:unavailable,start:async(c:Contract,practice:boolean)=>{if(!practice)setAttempts(old=>({...old,[c.id]:(old[c.id]??0)+1}));return {...practiceTicket(c,rules.rulesHash,wallet),practice};}} satisfies ReturnType<typeof useWeekly>;
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><WalletProvider><AccountContext.Provider value={account}><SettingsProvider><SafeAreaView style={{flex:1,backgroundColor:'#0c0c0e'}}><Text style={{fontSize:10,color:'#EAD7A1',padding:8}}>WEEKLY QA · SYNTHETIC RUN · NO PAYMENTS</Text><View style={{flexDirection:'row',gap:8,padding:6}}>{(['weekly','campaign','paywall'] as const).map(m=><Pressable key={m} accessibilityRole="button" accessibilityLabel={`QA ${m}`} onPress={()=>{setTicket(undefined);setMode(m);}} style={{padding:8,backgroundColor:'#29413B'}}><Text style={{color:'#CFE6E4'}}>{m}</Text></Pressable>)}</View>{mode==='paywall'?<Paywall local stage="offer" trialAvailable onBuy={()=>setMode('campaign')} onCancel={()=>setMode('weekly')} onTrial={()=>setMode('campaign')} onBack={()=>setMode('weekly')}/>:mode==='campaign'?<Game key="campaign" dailyReturn={false} paidReturn={false} onRankStart={setTicket} onRankExit={()=>setMode('weekly')} onPaidStart={()=>{}} onPaidExit={()=>{}}/>:ticket?<Game key={ticket.id} rankTicket={ticket} dailyReturn={false} paidReturn={false} onRankStart={setTicket} onRankExit={()=>setTicket(undefined)} onPaidStart={()=>{}} onPaidExit={()=>{}}/>:<View style={{flex:1,padding:12}}><WeeklyBoard state={state} onStart={setTicket}/></View>}</SafeAreaView></SettingsProvider></AccountContext.Provider></WalletProvider></SafeAreaProvider></GestureHandlerRootView>;
}
