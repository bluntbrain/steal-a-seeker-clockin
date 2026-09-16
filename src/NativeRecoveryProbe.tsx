import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Game} from './GameScreen';
import WalletProvider from './wallet/WalletProvider';
import SettingsProvider from './settings/SettingsProvider';
import {AccountContext,type AccountContextValue} from './commerce/account-context';
import {readSave,writeSave} from './progress/storage';
import {paidStore} from './paid/store';
import {replayTicks,type PaidPlay} from './paid/recovery';
import type {PaidEntry} from '../shared/paid';
import type {GameState} from './game/simulation';
import rules from '../shared/rules-manifest.json';

// Separate diagnostic build: one synthetic ticket, no entitlement or session.
// No code here is selected in normal builds. It never authorizes a payment.
const key='seeker.diagnostic.recovery.fixture.v1',wallet='11111111111111111111111111111111';
const unavailable=async():Promise<never>=>{throw new Error('Diagnostic fixture has no wallet session or payment access.');};
const account:AccountContextValue={wallet,loading:false,preview:true,notice:'Diagnostic only',session:unavailable,refresh:unavailable,update:async()=>{}};
async function fixture(){
 const id=crypto.randomUUID(),now=new Date().toISOString();
 const entry:PaidEntry={id,wallet,status:'ready',manifest:{mission:'battery-dash',rulesHash:rules.rulesHash,levelHash:rules.levelHashes['battery-dash'],seed:0,loadout:'standard',hardLimitSeconds:240},readyUntil:new Date(Date.now()+86400000).toISOString(),run:null,return:null,detail:'Synthetic diagnostic; no payment exists.',quote:{id,wallet,cluster:'solana:devnet',mint:wallet,tokenProgram:wallet,decimals:6,amount:'10000000',recipient:wallet,source:wallet,destination:wallet,reference:wallet,memo:`diagnostic:${id}`,createdAt:now,expiresAt:now,signature:null,detail:null}};
 const startKey=await paidStore.prepare(entry);entry.status='running';entry.run={id:crypto.randomUUID(),wallet,startKey,manifest:entry.manifest,issuedAt:now,expiresAt:new Date(Date.now()+420000).toISOString(),result:null};
 await writeSave(key,JSON.stringify(entry));return entry;
}
export default function NativeRecoveryProbe(){
 const [play,setPlay]=useState<PaidPlay>(),[error,setError]=useState(''),[state,setState]=useState<GameState>(),[saved,setSaved]=useState(0),[fail,setFail]=useState(false),[left,setLeft]=useState(false),failure=useRef(false);
 const load=useCallback(async(fresh=false)=>{try{const raw=fresh?null:await readSave(key),entry=raw?JSON.parse(raw) as PaidEntry:await fixture(),saved=await paidStore.open(entry);setPlay({entry,replay:saved.replay});setSaved(replayTicks(saved.replay,7200));setError('');setLeft(false);}catch(e){setError(e instanceof Error?e.message:'Fixture load failed.');}},[]);
 useEffect(()=>{void load();},[load]);
 const observe=useCallback((s:GameState)=>setState(s),[]);
 const checkpoint=useCallback<typeof paidStore.checkpoint>((e,replay)=>{if(failure.current)return Promise.reject(new Error('Simulated storage failure (diagnostic only).'));return paidStore.checkpoint(e,replay);},[]);
 useEffect(()=>{if(!play)return;let active=true,busy=false;const timer=setInterval(()=>{if(busy)return;busy=true;void paidStore.read(play.entry).then(s=>{if(active&&s)setSaved(replayTicks(s.replay,7200));}).catch(e=>{if(active)setError(String(e));}).finally(()=>{busy=false;});},400);return()=>{active=false;clearInterval(timer);};},[play]);
 const data={entryId:play?.entry.id,runId:play?.entry.run?.id,deadline:play?.entry.run?.expiresAt,ticks:state?.ticks,savedTicks:saved,x:state?.x,y:state?.y,carrying:state?.carrying,status:state?.status,guards:state?.guards.map(g=>({x:g.x,y:g.y,mode:g.mode})),failure:fail,left};
 const button=(label:string,fn:()=>void)=><Pressable accessibilityRole="button" onPress={fn} style={{padding:7,backgroundColor:'#29483a',borderRadius:6}}><Text style={{color:'#dcf1e2',fontSize:10}}>{label}</Text></Pressable>;
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><WalletProvider><AccountContext.Provider value={account}><SettingsProvider><View style={{flex:1,backgroundColor:'#0c0c0e',paddingTop:25}}>
  <View style={{padding:7,gap:5}}><Text style={{color:'#edc788',fontSize:11}}>RECOVERY DIAGNOSTIC · SYNTHETIC TICKET · NO PAYMENTS</Text><Text accessibilityLabel={`DIAGNOSTIC_STATE ${JSON.stringify(data)}`} style={{color:'#9fc9b1',fontSize:9}}>Run {state?.ticks??0} ticks · SQLite {saved} ticks · {play?.entry.id.slice(0,8)}</Text><View style={{flexDirection:'row',gap:6}}>{button(fail?'Allow saves':'Fail saves',()=>{failure.current=!failure.current;setFail(failure.current);})}{button('New diagnostic fixture',()=>void load(true))}{left&&button('Reopen saved fixture',()=>void load())}</View>{!!error&&<Text style={{color:'#ffc29c',fontSize:11}}>{error}</Text>}</View>
  {play&&!left&&<Game key={play.entry.id} paidPlay={play} dailyReturn={false} paidReturn={false} onRankStart={()=>{}} onRankExit={()=>{}} onPaidStart={()=>{}} onPaidExit={()=>setLeft(true)} onSnapshot={observe} paidCheckpoint={checkpoint}/>}
 </View></SettingsProvider></AccountContext.Provider></WalletProvider></SafeAreaProvider></GestureHandlerRootView>;
}
