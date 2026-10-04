import React,{useCallback,useRef,useState} from 'react';
import {View,Text,useWindowDimensions} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ResultSheet from '../src/components/ResultSheet';
import CompletionCard from '../src/campaign/CompletionCard';
import CampaignConfetti from '../src/components/CampaignConfetti';
import type {CourierCardData} from '../src/league/card';
const {createRoot}=require('react-dom/client') as {createRoot:(element:HTMLElement)=>{render:(node:React.ReactNode)=>void}};
const params=new URLSearchParams(location.search);
const data:CourierCardData={wallet:'browser-playtest',local:true,outfit:params.get('outfit')??'default',campaign:{cleared:12,stars:34,score:143845,seconds:330.7333333}};
function Preview(){const {height}=useWindowDimensions(),[ready,setReady]=useState(false),[burst,setBurst]=useState(0),action=useRef<(()=>Promise<void>)|null>(null),reduced=params.has('reduced');const register=useCallback((fn:(()=>Promise<void>)|null)=>{action.current=fn;setReady(!!fn);},[]);
 return <View style={{height,backgroundColor:'#0B1110'}}><Text style={{textAlign:'center',color:'#79998A',fontSize:11,marginTop:18}}>Design preview · sample stats</Text><ResultSheet celebration art="success" eyebrow="12 / 12 HEISTS" title="Every Seeker. Secured." primary={{label:'Share card ↗',accessibilityLabel:'Share campaign completion card on X',disabled:!ready,onPress:()=>void action.current?.()}} secondary={{label:'Replay',onPress:()=>setBurst(n=>n+1)}} utility={{label:'Back to missions',onPress:()=>location.assign('/?build=courier-celebration')}}><CompletionCard data={data} reduced={reduced} registerShare={register}/></ResultSheet><CampaignConfetti key={burst} reduced={reduced}/></View>;
}
createRoot(document.getElementById('root')!).render(<SafeAreaProvider><Preview/></SafeAreaProvider>);
