import React,{useEffect,useState,type ReactNode} from 'react';
import {ActivityIndicator,ImageBackground,Platform,Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {Asset} from 'expo-asset';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
const ART=require('../../assets/splash-v3/heist.png');
const BOOT_ASSETS=[ART,require('../../assets/weapons/knife-v1/knife.png'),require('../../assets/costumes-v4/default-atlas.png'),require('../../assets/drones-v2/scout.png'),require('../../assets/guards-v2/patrol.png'),require('../../assets/guards-v2/heavy.png'),require('../../assets/world-v3/floor.png'),require('../../assets/walls-v5/warehouse-cap.jpg'),require('../../assets/world-v3/phones.png')];
export default function LaunchSplash({children}:{children:ReactNode}){
 const [complete,setComplete]=useState(0),[done,setDone]=useState(false),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 const insets=useSafeAreaInsets(),{width,height}=useWindowDimensions();
 const preview=Platform.OS==='web'&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('splashPreview');
 useEffect(()=>{
  let alive=true;setError(false);setComplete(0);
  const timeout=setTimeout(()=>{if(alive)setError(true);},12000);
  Promise.all(BOOT_ASSETS.map(asset=>Asset.fromModule(asset).downloadAsync().then(()=>{if(alive)setComplete(n=>n+1);})))
   .then(()=>{clearTimeout(timeout);if(alive&&!preview)setDone(true);})
   .catch(()=>{clearTimeout(timeout);if(alive)setError(true);});
  return()=>{alive=false;clearTimeout(timeout);};
 },[retry,preview]);
 if(done)return <>{children}</>;
 return <ImageBackground testID="launch-splash" source={ART} resizeMode={width/height>.7?"contain":"cover"} imageStyle={{width,height}} style={[s.screen,{width,height}]} accessibilityLabel="Steal a Seeker loading screen">
  <View style={[s.heading,{top:Math.max(insets.top+24,height*.065)}]}>
   <Text allowFontScaling={false} style={[s.title,{fontSize:Math.min(64,width*.14)}]}>STEAL</Text>
   <Text allowFontScaling={false} style={[s.title,s.mint,{fontSize:Math.min(58,width*.126)}]}>A SEEKER</Text>
  </View>
  <View style={[s.footer,{bottom:Math.max(insets.bottom+24,height*.045)}]}>
   <Text style={s.tagline}>ONE PHONE. A WHOLE LOT OF TROUBLE.</Text>
   <View accessibilityRole="progressbar" accessibilityLabel="Preparing game artwork" accessibilityValue={{min:0,max:BOOT_ASSETS.length,now:complete}} style={s.track}><View style={[s.fill,{width:`${complete/BOOT_ASSETS.length*100}%`}]}/></View>
   {error?<><Text style={s.label}>Artwork could not finish loading.</Text><Pressable accessibilityRole="button" onPress={()=>setRetry(n=>n+1)} style={s.button}><Text style={s.buttonLabel}>Retry loading</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>setDone(true)}><Text style={s.label}>Continue to game</Text></Pressable></>:<View style={s.status}><ActivityIndicator size="small" color="#BDEFE0"/><Text style={s.label}>{complete===BOOT_ASSETS.length?'Ready to steal.':'Preparing your heist…'}</Text></View>}
   {preview&&<Pressable accessibilityRole="button" onPress={()=>setDone(true)} style={s.button}><Text style={s.buttonLabel}>Continue to game</Text></Pressable>}
  </View>
 </ImageBackground>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#071B1D'},heading:{position:'absolute',alignSelf:'center',alignItems:'center'},title:{fontWeight:'900',color:'#FFF9E9',letterSpacing:1,lineHeight:66,textShadowColor:'#051719',textShadowOffset:{width:0,height:5},textShadowRadius:1},mint:{color:'#A9F2D9'},footer:{position:'absolute',left:30,right:30,alignItems:'center',gap:12},tagline:{fontSize:10,fontWeight:'800',letterSpacing:1.2,color:'#E1F2EB',textAlign:'center'},track:{height:12,width:'88%',borderWidth:2,borderColor:'#496E64',borderRadius:8,backgroundColor:'#071511',overflow:'hidden'},fill:{height:8,borderRadius:6,backgroundColor:'#ADEDD1'},status:{flexDirection:'row',alignItems:'center',gap:9},label:{fontSize:13,color:'#D7E8E2',textAlign:'center'},button:{paddingHorizontal:24,paddingVertical:12,backgroundColor:'#BDEFE0',borderRadius:16},buttonLabel:{color:'#09291F',fontWeight:'800'}});
