import React from 'react';
import {Image,StyleSheet,Text,View} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {tokenAmount} from '../../shared/commerce';
import {usdLabel,type PaymentCurrency,type ProductPricing} from '../../shared/pricing';
import {IS_MAINNET} from '../wallet/config';
import {currencyLabel} from '../../shared/pricing';
export default function PaymentMethods({currency,onChange,prices,disabled=false,preview=false,unconnected=false,large=false}:{currency:PaymentCurrency;onChange:(c:PaymentCurrency)=>void;prices?:ProductPricing;disabled?:boolean;preview?:boolean;unconnected?:boolean;large?:boolean}){
 return <View style={{gap:10}}>{large&&<Text style={s.heading}>Choose payment method</Text>}<View accessibilityRole="radiogroup" accessibilityLabel="Pay with" style={s.row}>{(['SKR','SOL'] as const).map(c=>{
  const selected=currency===c,option=prices?.options.find(p=>p.currency===c),symbol=preview?c:currencyLabel(c,IS_MAINNET);
  const price=preview?'DEMO · NO PAYMENT':option?`${tokenAmount(option.amount,option.decimals)} ${symbol}`:unconnected?'Connect for price':'Updating price…';
  return <Pressable key={c} accessibilityRole="radio" accessibilityLabel={`Pay with ${symbol}`} accessibilityState={{checked:selected,disabled}} aria-checked={selected} disabled={disabled} onPress={()=>onChange(c)} style={[s.card,large&&s.largeCard,selected&&s.selected]}>
   <View style={[s.check,selected&&s.checked]}>{selected&&<Text style={s.checkText}>✓</Text>}</View>
   <Image accessible={false} source={c==='SKR'?require('../../assets/skin-ui/skr.png'):require('../../assets/skin-ui/sol.png')} resizeMode="contain" style={{width:large?43:25,height:large?43:25,marginBottom:large?7:3}}/>
   <Text style={[s.symbol,large&&{fontSize:20,lineHeight:25}]}>{symbol}</Text>
   {large&&<Text style={s.label}>Pay with {symbol}</Text>}
   <Text numberOfLines={2} style={[s.price,large&&s.pricePill]}>{price}</Text>
   {!!option&&<Text style={s.usd}>≈ {usdLabel(option.usdCents)}</Text>}
  </Pressable>;
 })}</View></View>;
}
const s=StyleSheet.create({heading:{fontSize:13,fontWeight:'600',color:'#F2F2E8'},row:{flexDirection:'row',gap:10},card:{flex:1,minWidth:0,paddingHorizontal:8,paddingVertical:12,minHeight:112,borderWidth:2,borderRadius:13,borderColor:'#3B4A43',backgroundColor:'#0F1A16',alignItems:'center',justifyContent:'center'},largeCard:{minHeight:160,paddingTop:18,paddingBottom:12},selected:{borderColor:'#B2F3E1',backgroundColor:'#15281F'},check:{position:'absolute',top:10,right:10,width:18,height:18,borderRadius:10,borderWidth:1,borderColor:'#718078',alignItems:'center',justifyContent:'center'},checked:{backgroundColor:'#B2F3E1',borderColor:'#B2F3E1'},checkText:{color:'#14362A',fontSize:12,fontWeight:'800'},symbol:{color:'#F6F4E9',fontWeight:'800',fontSize:14,lineHeight:20},label:{color:'#B9C3BE',fontSize:12,marginTop:2},price:{color:'#D4E7DC',fontSize:10,lineHeight:14,textAlign:'center',marginTop:5},pricePill:{borderWidth:1,borderColor:'#53635A',borderRadius:6,paddingHorizontal:8,paddingVertical:3},usd:{fontSize:10,lineHeight:14,marginTop:4,color:'#91AB9E'}});
