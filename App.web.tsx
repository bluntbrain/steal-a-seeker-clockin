import React from 'react';
import {View,Text} from 'react-native';
import {WithSkiaWeb} from '@shopify/react-native-skia/lib/module/web';
export default function App(){return <WithSkiaWeb getComponent={()=>{
 const local=['localhost','127.0.0.1','::1'].includes(window.location.hostname),params=new URLSearchParams(window.location.search);
 if(local&&params.has('bossLab'))return import('./src/playtest/BossLab.web');
 if(local&&params.has('defeatLab'))return import('./src/playtest/DefeatFxLab.web');
 if(local&&params.has('worldLab'))return import('./src/playtest/CampaignWorldLab.web');
 if(local&&params.has('loaderLab'))return import('./src/playtest/ChaseLoaderLab.web');
 if(local&&params.has('wallLab'))return import('./src/playtest/WallDepthLab');
 // ?pilot=jev lets the local decision bridge play through the normal tap queue; never on a public host
 if(local&&params.get('pilot')==='jev')void import('./src/playtest/jev-pilot').then(m=>m.startJevPilot(params.get('bridge')??undefined,Number(params.get('interval'))||undefined));
 return import('./src/GameScreen');
 }} opts={{locateFile:()=>'/canvaskit.wasm'}} fallback={<View style={{flex:1,backgroundColor:'#0c1011',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#cfe6e4'}}>Preparing the warehouse…</Text></View>}/>;}
