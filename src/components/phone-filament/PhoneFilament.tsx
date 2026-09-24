import React,{useEffect,useMemo,useRef} from 'react';
import {PanResponder,PixelRatio,StyleSheet,Text,View} from 'react-native';
import {FilamentScene,FilamentView,EnvironmentalLight,Light,ModelRenderer,RenderCallbackContext,useFilamentContext,useModel,type FrameInfo} from 'react-native-filament';
import {Worklets,useSharedValue,type ISharedValue} from 'react-native-worklets-core';
import {HapticPressable as Pressable} from '../../feedback/HapticPressable';
import {PHONE_EDITIONS} from '../../game/collection';
import {PHONE_DEFAULT_POSE,PHONE_PRESETS,dragPhone,pinchPhone,type PhonePose} from '../phoneCamera';

// No screen-size texture atlas: only the chosen local, optimized model is loaded.
export default function PhoneFilament({index,height,uri,onReady}:{index:number;height:number;uri:string;onReady:()=>void}){
  const pose=useSharedValue<PhonePose>({...PHONE_DEFAULT_POSE});
  const start=useRef({...PHONE_DEFAULT_POSE}),touch=useRef({count:0,x:0,y:0,span:0});
  const maxScale=Math.min(1,2/PixelRatio.get());
  const resolution=useMemo(()=>({enabled:true,homogeneousScaling:true,minScale:[maxScale*0.8,maxScale*0.8] as [number,number],maxScale:[maxScale,maxScale] as [number,number],quality:'HIGH' as const,sharpness:0.5}),[maxScale]);
  const gesture=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,
    onPanResponderGrant:event=>{start.current={...pose.value};const t=event.nativeEvent.touches;touch.current={count:t.length,x:t[0]?.pageX??0,y:t[0]?.pageY??0,span:t[1]?Math.hypot(t[1].pageX-t[0]!.pageX,t[1].pageY-t[0]!.pageY):0};},
    onPanResponderMove:event=>{
      const t=event.nativeEvent.touches;if(!t[0])return;
      const span=t[1]?Math.hypot(t[1].pageX-t[0].pageX,t[1].pageY-t[0].pageY):0;
      if(t.length!==touch.current.count){start.current={...pose.value};touch.current={count:t.length,x:t[0].pageX,y:t[0].pageY,span};return;}
      pose.value=t.length>1?pinchPhone(start.current,touch.current.span,span):dragPhone(start.current,t[0].pageX-touch.current.x,t[0].pageY-touch.current.y);
    },onPanResponderTerminationRequest:()=>true,
  }),[pose]);
  return <View style={{gap:12}}>
    <View testID="phone-filament" accessibilityLabel={`Interactive ${PHONE_EDITIONS[index]!.name} 3D phone. Drag in any direction or pinch to zoom.`} style={{height,borderRadius:20,overflow:'hidden',backgroundColor:'#101A21'}} {...gesture.panHandlers}>
      <FilamentScene backend="opengl" antiAliasing="FXAA" postProcessing shadowing={false} screenSpaceRefraction={false}
        temporalAntiAliasingOptions={{enabled:true,feedback:0.2,filterWidth:0.75,sharpness:0.15}}
        dynamicResolutionOptions={resolution} frameRateOptions={{interval:1,headRoomRatio:0.1}}>
        <Scene uri={uri} pose={pose} onReady={onReady}/>
      </FilamentScene>
      <Text pointerEvents="none" style={styles.hint}>DRAG TO ROTATE · PINCH TO ZOOM</Text>
    </View>
    <View style={styles.presets}>{Object.entries(PHONE_PRESETS).map(([name,value])=><Pressable key={name} accessibilityRole="button" accessibilityLabel={`Show phone ${name.toLowerCase()}`} onPress={()=>{pose.value={...value};}} style={styles.preset}><Text style={styles.presetText}>{name}</Text></Pressable>)}</View>
  </View>;
}
function Scene({uri,pose,onReady}:{uri:string;pose:ISharedValue<PhonePose>;onReady:()=>void}){
  const source=useMemo(()=>({uri}),[uri]),model=useModel(source);
  const ready=useSharedValue(false),frames=useSharedValue(0);
  const notifyReady=useMemo(()=>Worklets.createRunOnJS(onReady),[onReady]);
  useEffect(()=>{ready.value=model.state==='loaded';},[model.state,ready]);
  const rendered=useSharedValue(false);
  const onFrame=({timeSinceLastFrame}:FrameInfo)=>{
    'worklet';
    if(ready.value&&!rendered.value){frames.value+=1;if(frames.value>=3){rendered.value=true;notifyReady();}}
  };
  return <FilamentView style={StyleSheet.absoluteFillObject} renderCallback={onFrame}>
    <EnvironmentalLight source={{uri:'RNF_default_env_ibl.ktx'}} intensity={26000}/>
    <Light type="directional" direction={[-0.4,-0.6,-1]} intensity={16000} colorKelvin={6000} castShadows={false}/>
    <Light type="directional" direction={[0.5,-0.2,1]} intensity={24000} colorKelvin={7200} castShadows={false}/>
    <ModelRenderer model={model} castShadow={false} receiveShadow={false}/>
    <OrbitCamera pose={pose}/>
  </FilamentView>;
}
function OrbitCamera({pose}:{pose:ISharedValue<PhonePose>}){
  const {camera,view}=useFilamentContext();
  const current=useSharedValue<PhonePose>({...PHONE_DEFAULT_POSE}),lastAspect=useSharedValue(0);
  RenderCallbackContext.useRenderCallback(({timeSinceLastFrame})=>{
    'worklet';
    const aspect=view.getAspectRatio();if(aspect<=0)return;
    if(lastAspect.value!==aspect){camera.setLensProjection(28,aspect,0.1,30);lastAspect.value=aspect;}
    const target=pose.value,old=current.value,alpha=1-Math.exp(-18*Math.min(0.05,Math.max(0,timeSinceLastFrame)));
    // Follow the shortest arc, including front/back presets across the +/- pi seam.
    const delta=Math.atan2(Math.sin(target.yaw-old.yaw),Math.cos(target.yaw-old.yaw));
    const yaw=old.yaw+delta*alpha,pitch=old.pitch+(target.pitch-old.pitch)*alpha,zoom=old.zoom+(target.zoom-old.zoom)*alpha;
    current.value={yaw,pitch,zoom};
    const distance=4.8/zoom,ring=Math.cos(pitch)*distance;
    camera.lookAt([Math.sin(yaw)*ring,Math.sin(pitch)*distance,Math.cos(yaw)*ring],[0,0,0],[0,1,0]);
  },[camera,view,pose,current,lastAspect]);
  return null;
}
const styles=StyleSheet.create({hint:{position:'absolute',bottom:12,left:0,right:0,textAlign:'center',fontSize:10,color:'#9BB7BD'},presets:{flexDirection:'row',flexWrap:'wrap',gap:6,justifyContent:'center'},preset:{minHeight:36,paddingHorizontal:12,paddingVertical:10,backgroundColor:'#26383F',borderRadius:9},presetText:{color:'#D9ECE5',fontSize:11}});
