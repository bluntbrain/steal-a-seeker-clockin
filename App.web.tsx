import React from 'react';
import {View,Text} from 'react-native';
import {WithSkiaWeb} from '@shopify/react-native-skia/lib/module/web';
export default function App(){return <WithSkiaWeb getComponent={()=>['localhost','127.0.0.1','::1'].includes(window.location.hostname)&&new URLSearchParams(window.location.search).has('wallLab')?import('./src/playtest/WallDepthLab'):import('./src/GameScreen')} opts={{locateFile:()=>'/canvaskit.wasm'}} fallback={<View style={{flex:1,backgroundColor:'#0c1011',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#cfe6e4'}}>Preparing the warehouse…</Text></View>}/>;}
