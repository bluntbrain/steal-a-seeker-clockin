import React,{Suspense,useCallback,useRef,useState} from 'react';
import {PanResponder,Pressable,Text,View} from 'react-native';
import {installModelExport} from '../three/model-export';
import {Canvas} from '../three/Canvas';
import {PHONE_EDITIONS} from '../game/collection';
import CollectiblePhone from '../three/CollectiblePhone';
import PhoneTurntable from './PhoneTurntable';
const presets={Front:[0,0],Back:[0,Math.PI],Left:[0,Math.PI/2],Right:[0,-Math.PI/2],Top:[Math.PI/2,0],Bottom:[-Math.PI/2,0]} as const;
function LivePhoneStage({index,height}:{index:number;height:number}){
 const [pose,setPose]=useState<[number,number]>([-.13,Math.PI-.4]),[ready,setReady]=useState(false);
 const live=useRef(pose),start=useRef(pose);live.current=pose;
 const set=useCallback((v:readonly[number,number])=>{const next:[number,number]=[v[0],v[1]];live.current=next;setPose(next);},[]);
 const gesture=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderGrant:()=>{start.current=[...live.current];},onPanResponderMove:(_,g)=>set([Math.max(-Math.PI/2,Math.min(Math.PI/2,start.current[0]+g.dy*.012)),start.current[1]+g.dx*.015])})).current;
 return <View style={{gap:12}}><View testID="phone-3d-stage" accessibilityLabel={`Interactive ${PHONE_EDITIONS[index]!.name} phone model`} style={{height,borderRadius:20,overflow:'hidden',backgroundColor:'#101A21'}} {...gesture.panHandlers}>
 <Canvas onCreated={({scene})=>installModelExport(scene)} frameloop="demand" camera={{position:[0,0,5.9],fov:39}} gl={{antialias:true,alpha:false}} style={{flex:1}}>
  <color attach="background" args={['#101A21']}/>
  <ambientLight intensity={1.5}/><directionalLight position={[3,4,5]} intensity={3.5}/><directionalLight position={[-3,1,-4]} intensity={3} color="#A7DCD8"/><directionalLight position={[1,-3,2]} intensity={1.1}/>
  <Suspense fallback={null}><group rotation={[pose[0],pose[1],0]}><CollectiblePhone index={index} onReady={()=>setReady(true)}/></group></Suspense>
 </Canvas>
 {!ready&&<View pointerEvents="none" style={{position:'absolute',top:'45%',alignSelf:'center'}}><Text style={{color:'#CFE6E4'}}>Loading model…</Text></View>}
 <Text testID="phone-3d-pose" pointerEvents="none" style={{position:'absolute',bottom:12,alignSelf:'center',fontSize:10,color:'#9BB7BD'}}>{ready?'DRAG TO ROTATE':'LOADING'} · {Math.round(pose[1]*180/Math.PI)}° / {Math.round(pose[0]*180/Math.PI)}°</Text>
 </View><View style={{flexDirection:'row',flexWrap:'wrap',gap:6,justifyContent:'center'}}>{Object.entries(presets).map(([name,v])=><Pressable key={name} accessibilityRole="button" accessibilityLabel={`Show phone ${name.toLowerCase()}`} onPress={()=>set(v)} style={{minHeight:36,paddingHorizontal:12,paddingVertical:10,backgroundColor:'#26383F',borderRadius:9}}><Text style={{color:'#D9ECE5',fontSize:11}}>{name}</Text></Pressable>)}</View></View>;
}

// Local visual QA can exercise the native renderer in the browser.
export default function PhoneStage(props:{index:number;height:number}){
 return new URLSearchParams(window.location.search).has('nativePhonePreview')?<PhoneTurntable {...props}/>:<LivePhoneStage {...props}/>;
}
