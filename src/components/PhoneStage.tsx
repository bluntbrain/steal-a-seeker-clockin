import React,{lazy,Suspense,useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,AppState,Text,View} from 'react-native';
import {Asset} from 'expo-asset';
import PhoneTurntable from './PhoneTurntable';
import RecoveryBoundary from './RecoveryBoundary';
import PhoneArt from './PhoneArt';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {PHONE_MODEL_ASSETS} from './phoneModelAssets';
const FilamentPhone=lazy(()=>import('./phone-filament/PhoneFilament'));
const useFilament=process.env.EXPO_PUBLIC_PHONE_RENDERER!=='turntable';
export default function PhoneStage(props:{index:number;height:number;active?:boolean}){
  const [active,setActive]=useState(AppState.currentState==='active'),[attempt,setAttempt]=useState(0);
  useEffect(()=>{const s=AppState.addEventListener('change',state=>setActive(state==='active'));return()=>s.remove();},[]);
  if(!useFilament)return <PhoneTurntable {...props}/>;
  // Unmount the whole engine, model and surface when the app leaves the foreground.
  if(!active||props.active===false)return <View style={{height:props.height,backgroundColor:'#101A21'}}/>;
  return <LivePhone key={`${props.index}:${attempt}`} {...props} retry={()=>setAttempt(n=>n+1)}/>;
}
function LivePhone(props:{index:number;height:number;retry:()=>void}){
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
  const fallback=<View style={{gap:10}}><PhoneTurntable {...props}/><Text accessibilityLiveRegion="polite" style={{color:'#B7D8CE',textAlign:'center',fontSize:12}}>Live 3D could not load. Showing rendered views.</Text><Pressable accessibilityRole="button" onPress={props.retry} style={{padding:12,borderRadius:10,backgroundColor:'#26383F',alignItems:'center'}}><Text style={{color:'#D9ECE5'}}>Retry live 3D</Text></Pressable></View>;
  if(failed)return fallback;
  return <RecoveryBoundary scope="phone-filament" fallback={fallback}>
    <View>
      {uri&&<Suspense fallback={null}><FilamentPhone {...props} uri={uri} onReady={onReady} interactive={ready}/></Suspense>}
      {!uri&&<View style={{height:props.height+48}}/>}
      {!ready&&<View testID="phone-model-loading" pointerEvents="auto" style={{position:'absolute',top:0,left:0,right:0,height:props.height,backgroundColor:'#101A21',borderRadius:20,alignItems:'center',justifyContent:'center',gap:12}}><PhoneArt index={props.index} height={Math.min(220,props.height*.6)}/><ActivityIndicator color="#CFE6E4"/><Text style={{color:'#B7D8CE'}}>Loading phone…</Text></View>}
    </View>
  </RecoveryBoundary>;
}
