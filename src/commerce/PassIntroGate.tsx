import React,{useEffect,useState,type ReactNode} from 'react';
import {Platform,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAccount} from './account-context';
import {useEconomy} from './EconomyProvider';
import Paywall from './Paywall';
import {onHomeShown,showPassIntro} from './pass-intro';
import {loadPublishedLevels} from '../campaign/client';
export default function PassIntroGate({children}:{children:ReactNode}){
 const account=useAccount(),economy=useEconomy(),[dismissed,setDismissed]=useState(false),[covering,setCovering]=useState(false);
 useEffect(()=>{if(economy.owned.includes('campaign'))setDismissed(true);},[economy.owned]);
 // missions download while the welcome screen is up, so the map opens with all of them
 useEffect(()=>{void loadPublishedLevels();},[]);
 // after skip, the welcome screen stays on top until the map window is on screen (or one second passes)
 useEffect(()=>{if(!covering)return;const off=onHomeShown(()=>setCovering(false)),timer=setTimeout(()=>setCovering(false),1000);return()=>{off();clearTimeout(timer);};},[covering]);
 // Dedicated mission QA URLs must still open the requested level directly.
 const diagnostic=Platform.OS==='web'&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('testMission');
 const gate=showPassIntro({dismissed,owned:economy.owned.includes('campaign'),diagnostic});
 // fixed child positions keep the welcome screen mounted while the game mounts underneath it
 return <>{!gate&&children}{(gate||covering)&&<SafeAreaView style={[StyleSheet.absoluteFill,{backgroundColor:'#071311'}]}><Paywall local={account.preview} mediaActive={gate&&!economy.passCheckoutOpen} onSkip={()=>{setCovering(true);setDismissed(true);}} onBuy={()=>economy.openPass()} onCode={economy.openPass}/></SafeAreaView>}</>;
}
