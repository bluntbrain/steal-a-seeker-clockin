import React,{useEffect,useState} from 'react';
// @ts-expect-error QA uses the existing react-dom runtime; native app does not depend on its types.
import {createRoot} from 'react-dom/client';
import {Text,View} from 'react-native';
import {AccountContext} from '../../src/commerce/account-context';
import {commerceApi} from '../../src/commerce/client';
import PromotionEntry from '../../src/commerce/PromotionEntry';
import CommerceSection from '../../src/commerce/CommerceSection';
function App(){
 const [identity,setIdentity]=useState<any>(),[account,setAccount]=useState<any>(),[ready,setReady]=useState(false);
 useEffect(()=>{void fetch('/qa/login',{method:'POST'}).then(r=>r.json()).then(v=>{setIdentity(v);setAccount(v.account);});},[]);
 const update=async(a:any)=>{setAccount(a);};
 if(!identity)return <p>Starting isolated test account…</p>;
 return <AccountContext.Provider value={{wallet:ready?identity.wallet:undefined,account:ready?account:undefined,loading:false,preview:false,notice:'Isolated QA database. No real payment.',connect:async()=>{setReady(true);},session:async()=>identity,update,refresh:async()=>{const a=await commerceApi.me(identity.token);await update(a);return a;}}}>
 <main style={{width:390,maxWidth:'100%',margin:'auto',padding:18,boxSizing:'border-box',background:'#0B1612',minHeight:'100vh',color:'#DCF2E7',fontFamily:'sans-serif'}}><p>QA · Actual API, isolated database · Simulated wallet connection</p><h2>Game Pass</h2><button onClick={()=>setReady(v=>!v)}>Toggle connection</button>
 {location.search.includes('checkout')?<CommerceSection initialPromotionCode={new URLSearchParams(location.search).get("initial")??""} fullScreen onComplete={()=>{}}/>:<PromotionEntry/>}
 <View style={{marginTop:20}}><Text style={{color:'#B6F0DF'}} testID="qa-entitlements">{ready?`Owned: ${account?.entitlements.join(', ')||'none'}`:'Wallet disconnected'}</Text></View>
 <button onClick={async()=>{await update(await commerceApi.me(identity.token));}}>Restore from server</button>
 <button onClick={async()=>{const r=await fetch('/league',{headers:{authorization:`Bearer ${identity.token}`}}),league=await r.json();const c=league.contracts[0];const start=await fetch('/league/start',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${identity.token}`},body:JSON.stringify({contractId:c.id,rulesHash:league.rulesHash,requestKey:crypto.randomUUID()})});const result=await start.json();document.getElementById('weekly')!.textContent=start.ok?'Ranked challenge started: '+result.id:result.error;}}>Start ranked challenge</button><p id="weekly"/>
 </main></AccountContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<App/>);
