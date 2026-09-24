import React,{lazy,Suspense,useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,AppState,Text,View} from 'react-native';
import {Asset} from 'expo-asset';
import PhoneTurntable from './PhoneTurntable';
import RecoveryBoundary from './RecoveryBoundary';
import {PHONE_MODEL_ASSETS} from './phoneModelAssets';
const FilamentPhone=lazy(()=>import('./phone-filament/PhoneFilament'));
const useFilament=process.env.EXPO_PUBLIC_PHONE_RENDERER!=='turntable';
export default function PhoneStage(props:{index:number;height:number}){
  const [active,setActive]=useState(AppState.currentState==='active');
  useEffect(()=>{const s=AppState.addEventListener('change',state=>setActive(state==='active'));return()=>s.remove();},[]);
  if(!useFilament)return <PhoneTurntable {...props}/>;
  // Unmount the whole engine, model and surface when the app leaves the foreground.
  if(!active)return <View style={{height:props.height,backgroundColor:'#101A21'}}/>;
  return <LivePhone key={props.index} {...props}/>;
}
function LivePhone(props:{index:number;height:number}){
  const [uri,setUri]=useState<string>(),[failed,setFailed]=useState(false),[ready,setReady]=useState(false);
  const onReady=useCallback(()=>setReady(true),[]);
  useEffect(()=>{
    let alive=true;
    Asset.fromModule(PHONE_MODEL_ASSETS[props.index]??PHONE_MODEL_ASSETS[0]).downloadAsync().then(asset=>{
      if(alive)setUri(asset.localUri??asset.uri);
    }).catch(error=>{console.warn('[PhoneFilament] asset unavailable',String(error));if(alive)setFailed(true);});
    return()=>{alive=false;};
  },[props.index]);
  useEffect(()=>{if(ready)return;const timeout=setTimeout(()=>{console.warn('[PhoneFilament] load timeout; showing rendered preview');setFailed(true);},15000);return()=>clearTimeout(timeout);},[ready]);
  const fallback=<PhoneTurntable {...props}/>;
  if(failed)return fallback;
  return <RecoveryBoundary scope="phone-filament" fallback={fallback}>
    <View>
      {uri&&<Suspense fallback={null}><FilamentPhone {...props} uri={uri} onReady={onReady}/></Suspense>}
      {!uri&&<View style={{height:props.height+48}}/>}
      {!ready&&<View testID="phone-model-loading" pointerEvents="none" style={{position:'absolute',top:0,left:0,right:0,height:props.height,backgroundColor:'#101A21',borderRadius:20,alignItems:'center',justifyContent:'center',gap:12}}><ActivityIndicator color="#CFE6E4"/><Text style={{color:'#B7D8CE'}}>Loading phone…</Text></View>}
    </View>
  </RecoveryBoundary>;
}
