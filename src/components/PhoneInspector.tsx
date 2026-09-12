import React,{lazy,Suspense} from 'react';
import {Modal,Pressable,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PHONE_EDITIONS} from '../game/collection';
const Stage=lazy(()=>import('./PhoneStage'));
export default function PhoneInspector({index,recovered,onClose}:{index:number;recovered:boolean;onClose:()=>void}){
 const {width,height}=useWindowDimensions(),safe=useSafeAreaInsets(),edition=PHONE_EDITIONS[index]!,usable=height-safe.top-safe.bottom;
 return <Modal transparent animationType="fade" visible onRequestClose={onClose}><View testID="phone-inspector" style={{flex:1,backgroundColor:'#0C1118',paddingTop:safe.top+12,paddingBottom:safe.bottom+12,alignItems:'center',justifyContent:'center'}}><View style={{width:Math.min(width-24,430),gap:12}}>
 <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View><Text style={{color:'#99BCBC',fontSize:9,letterSpacing:2}}>COLLECTION / {String(index+1).padStart(2,'0')}</Text><Text style={{fontSize:28,fontWeight:'800',color:'#F2F6EE'}}>{edition.name}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close phone viewer" onPress={onClose} style={{padding:14,backgroundColor:'#26383F',borderRadius:14}}><Text style={{color:'#DEEFE8'}}>Done</Text></Pressable></View>
 <Suspense fallback={<Text style={{color:'#CFE6E4'}}>Loading 3D viewer…</Text>}><Stage index={index} height={Math.max(200,Math.min(500,usable-220))}/></Suspense>
 <Text style={{color:'#B7D8CE',fontSize:12,textAlign:'center'}}>{recovered?'Recovered · in your rack':'Preview · complete its mission to collect'}</Text>
 <Text style={{color:'#8BA0AA',fontSize:10,textAlign:'center'}}>Game collectible model · drag to see every side</Text>
 </View></View></Modal>;
}
