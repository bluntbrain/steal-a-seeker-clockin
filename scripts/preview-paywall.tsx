import React,{useState} from 'react';
import {View} from 'react-native';
import Paywall from '../src/commerce/Paywall';
const {createRoot}=require('react-dom/client');
function Preview(){
 const query=new URLSearchParams(location.search),[stage,setStage]=useState<'offer'|'review'|'cancelled'>(query.get('stage')==='review'?'review':query.get('stage')==='cancelled'?'cancelled':'offer');
 const [message,setMessage]=useState(query.get('error')==='1'?'Not enough test credits. Your balance has not changed.':'');
 return <View style={{height:'100%'}}><div style={{background:'#D5E6DA',color:'#173329',textAlign:'center',font:'11px/24px system-ui',flexShrink:0}}>Design preview · buttons do not make payments · <a style={{color:'inherit'}} href="../index.html">Back</a></div><Paywall local={query.get('mode')!=='devnet'} stage={stage} trialAvailable={query.get('used')!=='1'} busy={query.get('busy')==='1'} message={message} onBack={()=>{setStage('offer');setMessage('');}} onCancel={()=>{setStage('cancelled');setMessage('');}} onTrial={()=>setMessage('Preview only. Open the game to play your free attempt.')} onBuy={()=>{if(stage==='review')setMessage('Preview only. No payment made or game data changed.');else setStage('review');}}/></View>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
