import React,{forwardRef,useEffect,useState} from 'react';
import {Image,Platform,Text,View} from 'react-native';
import {CARD_BACKGROUND,cardPortrait,cardPortraitRect,cardHeight,CARD_WIDTH,cardDescription,cardLayout,cardSvg,type CourierCardData} from './card';
type Props={data:CourierCardData;width:number;onReady?:(ready:boolean)=>void};
export const CourierCardSurface=forwardRef<View,Props>(function CourierCardSurface({data,width,onReady},ref){
 const k=width/CARD_WIDTH,description=cardDescription(data),portrait=cardPortrait(data),rect=cardPortraitRect(data),height=cardHeight(data)*k;
 const [loaded,setLoaded]=useState<{bg?:string;portrait?:string}>({});
 useEffect(()=>{onReady?.((!!data.campaign||loaded.bg===CARD_BACKGROUND)&&loaded.portrait===portrait);},[loaded,portrait,onReady,!!data.campaign]);
 return <View ref={ref} collapsable={false} accessible accessibilityLabel={description} style={{width,height,backgroundColor:data.campaign?'#14211E':'#0B1310',overflow:'hidden'}}>
  {!data.campaign&&<Image accessible={false} source={{uri:CARD_BACKGROUND}} onLoad={()=>setLoaded(s=>({...s,bg:CARD_BACKGROUND}))} onError={()=>setLoaded(s=>({...s,bg:undefined}))} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="stretch"/>}
  <Image accessible={false} source={{uri:portrait}} onLoad={()=>setLoaded(s=>({...s,portrait}))} onError={()=>setLoaded(s=>({...s,portrait:undefined}))} resizeMode="contain" style={{position:'absolute',left:rect.x*k,top:rect.y*k,width:rect.width*k,height:rect.height*k}}/>
  {!data.campaign&&data.frame==='profile-frame'&&<View style={{position:'absolute',left:34*k,top:34*k,right:34*k,bottom:34*k,borderWidth:8*k,borderColor:'#CFE6E4',borderRadius:28*k}}/>}
  {data.campaign&&<>{[360,720].map(x=><View key={x} style={{position:'absolute',left:x*k,top:1200*k,width:1,height:168*k,backgroundColor:'#40564E'}}/>)}{[30,770].map(x=><View key={x} style={{position:'absolute',left:x*k,top:1155*k,width:280*k,height:1,backgroundColor:'#40564E'}}/>)}</>}
  {data.campaign&&<>
   <Text accessible={false} allowFontScaling={false} style={{position:'absolute',left:150*k,top:1190*k,width:60*k,fontSize:55*k,lineHeight:60*k,textAlign:'center',color:'#C3EAE1'}}>★</Text>
   {[{x:516,y:1216,h:28},{x:535,y:1198,h:46},{x:554,y:1208,h:36}].map(b=><View key={b.x} style={{position:'absolute',left:b.x*k,top:b.y*k,width:12*k,height:b.h*k,borderRadius:2*k,backgroundColor:'#E7CE8E'}}/>)}
   <View style={{position:'absolute',left:880*k,top:1204*k,width:40*k,height:40*k,borderRadius:20*k,borderWidth:5*k,borderColor:'#E7CE8E'}}/>
   <View style={{position:'absolute',left:898*k,top:1212*k,width:4*k,height:14*k,backgroundColor:'#E7CE8E'}}/><View style={{position:'absolute',left:898*k,top:1222*k,width:12*k,height:4*k,backgroundColor:'#E7CE8E'}}/><View style={{position:'absolute',left:894*k,top:1197*k,width:12*k,height:5*k,backgroundColor:'#E7CE8E'}}/>
  </>}
  {cardLayout(data).map(b=><Text key={b.key} accessible={false} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.7} style={{position:'absolute',left:b.x*k,top:b.y*k,width:b.width*k,fontSize:b.size*k,lineHeight:b.size*k*1.18,includeFontPadding:false,fontFamily:'sans-serif',fontWeight:b.weight,textAlign:b.align??'left',letterSpacing:(b.spacing??0)*k,color:b.color}}>{b.text}</Text>)}
 </View>;
});
export default forwardRef<View,Props>(function CourierCard({data,width,onReady},ref){
 if(Platform.OS==='web')return <Image accessibilityLabel={cardDescription(data)} source={{uri:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(cardSvg(data))}} onLoadStart={()=>onReady?.(false)} onLoad={()=>onReady?.(true)} onError={()=>onReady?.(false)} style={{width,height:width*cardHeight(data)/CARD_WIDTH}}/>;
 return <CourierCardSurface ref={ref} data={data} width={width} onReady={onReady}/>;
});
