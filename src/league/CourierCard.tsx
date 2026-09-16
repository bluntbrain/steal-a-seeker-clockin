import React,{forwardRef} from 'react';
import {Image,Platform,Text,View} from 'react-native';
import {CARD_BACKGROUND,CARD_RATIO,CARD_WIDTH,cardDescription,cardLayout,cardSvg,type CourierCardData} from './card';
type Props={data:CourierCardData;width:number;onReady?:(ready:boolean)=>void};
export const CourierCardSurface=forwardRef<View,Props>(function CourierCardSurface({data,width,onReady},ref){
 const k=width/CARD_WIDTH,description=cardDescription(data);
 return <View ref={ref} collapsable={false} accessible accessibilityLabel={description} style={{width,height:width*CARD_RATIO,backgroundColor:'#0B1310',overflow:'hidden'}}>
  <Image accessible={false} source={{uri:CARD_BACKGROUND}} onLoadStart={()=>onReady?.(false)} onLoad={()=>onReady?.(true)} onError={()=>onReady?.(false)} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="stretch"/>
  {cardLayout(data).map(b=><Text key={b.key} accessible={false} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.7} style={{position:'absolute',left:b.x*k,top:b.y*k,width:b.width*k,fontSize:b.size*k,lineHeight:b.size*k*1.18,includeFontPadding:false,fontFamily:'sans-serif',fontWeight:b.weight,textAlign:b.align??'left',letterSpacing:(b.spacing??0)*k,color:b.color}}>{b.text}</Text>)}
 </View>;
});
export default forwardRef<View,Props>(function CourierCard({data,width,onReady},ref){
 if(Platform.OS==='web')return <Image accessibilityLabel={cardDescription(data)} source={{uri:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(cardSvg(data))}} onLoadStart={()=>onReady?.(false)} onLoad={()=>onReady?.(true)} onError={()=>onReady?.(false)} style={{width,height:width*CARD_RATIO}}/>;
 return <CourierCardSurface ref={ref} data={data} width={width} onReady={onReady}/>;
});
