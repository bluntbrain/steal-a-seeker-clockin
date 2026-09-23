import React,{useEffect,useState,type ReactNode} from 'react';
import {Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAccount} from './account-context';
import {useEconomy} from './EconomyProvider';
import Paywall from './Paywall';
import {showPassIntro} from './pass-intro';
export default function PassIntroGate({children}:{children:ReactNode}){
 const account=useAccount(),economy=useEconomy(),[dismissed,setDismissed]=useState(false);
 useEffect(()=>{if(economy.owned.includes('campaign'))setDismissed(true);},[economy.owned]);
 // Dedicated mission QA URLs must still open the requested level directly.
 const diagnostic=Platform.OS==='web'&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('testMission');
 if(!showPassIntro({dismissed,owned:economy.owned.includes('campaign'),diagnostic}))return <>{children}</>;
 return <SafeAreaView style={{flex:1,backgroundColor:'#071311'}}><Paywall local={account.preview} mediaActive={!economy.passCheckoutOpen} onSkip={()=>setDismissed(true)} onBuy={economy.openPass}/></SafeAreaView>;
}
