import React,{forwardRef,useEffect,useState} from 'react';
import {Image,Platform,Text,View} from 'react-native';
import {CARD_BACKGROUND,CARD_PORTRAIT,cardPortrait,CARD_RATIO,CARD_WIDTH,cardDescription,cardLayout,cardSvg,type CourierCardData} from './card';
type Props={data:CourierCardData;width:number;onReady?:(ready:boolean)=>void};
export const CourierCardSurface=forwardRef<View,Props>(function CourierCardSurface({data,width,onReady},ref){
 const k=width/CARD_WIDTH,description=cardDescription(data),portrait=cardPortrait(data);
 const [loaded,setLoaded]=useState<{bg?:string;portrait?:string}>({});
 useEffect(()=>{onReady?.(loaded.bg===CARD_BACKGROUND&&loaded.portrait===portrait);},[loaded,portrait,onReady]);
 return <View ref={ref} collapsable={false} accessible accessibilityLabel={description} style={{width,height:width*CARD_RATIO,backgroundColor:'#0B1310',overflow:'hidden'}}>
  <Image accessible={false} source={{uri:CARD_BACKGROUND}} onLoad={()=>setLoaded(s=>({...s,bg:CARD_BACKGROUND}))} onError={()=>setLoaded(s=>({...s,bg:undefined}))} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="stretch"/>
  <Image accessible={false} source={{uri:portrait}} onLoad={()=>setLoaded(s=>({...s,portrait}))} onError={()=>setLoaded(s=>({...s,portrait:undefined}))} resizeMode="contain" style={{position:'absolute',left:CARD_PORTRAIT.x*k,top:CARD_PORTRAIT.y*k,width:CARD_PORTRAIT.width*k,height:CARD_PORTRAIT.height*k}}/>
  {data.frame==='profile-frame'&&<View style={{position:'absolute',left:34*k,top:34*k,right:34*k,bottom:34*k,borderWidth:8*k,borderColor:'#CFE6E4',borderRadius:28*k}}/>}
  {cardLayout(data).map(b=><Text key={b.key} accessible={false} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.7} style={{position:'absolute',left:b.x*k,top:b.y*k,width:b.width*k,fontSize:b.size*k,lineHeight:b.size*k*1.18,includeFontPadding:false,fontFamily:'sans-serif',fontWeight:b.weight,textAlign:b.align??'left',letterSpacing:(b.spacing??0)*k,color:b.color}}>{b.text}</Text>)}
 </View>;
});
export default forwardRef<View,Props>(function CourierCard({data,width,onReady},ref){
 if(Platform.OS==='web')return <Image accessibilityLabel={cardDescription(data)} source={{uri:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(cardSvg(data))}} onLoadStart={()=>onReady?.(false)} onLoad={()=>onReady?.(true)} onError={()=>onReady?.(false)} style={{width,height:width*CARD_RATIO}}/>;
 return <CourierCardSurface ref={ref} data={data} width={width} onReady={onReady}/>;
});
