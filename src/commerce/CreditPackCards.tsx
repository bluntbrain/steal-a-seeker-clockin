import React from 'react';
import {Image,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {CREDIT_PACKS,type CreditPackId} from '../../shared/store';
import {useEconomy} from './EconomyProvider';
import {useAccount} from './account-context';
const artwork=[require('../../assets/store/credit-pouch.png'),require('../../assets/store/credit-case.png'),require('../../assets/store/credit-vault.png')];
export default function CreditPackCards({selected,onSelect,locked=false}:{selected:CreditPackId;onSelect:(id:CreditPackId)=>void;locked?:boolean}){
 const economy=useEconomy(),account=useAccount(),{height,fontScale}=useWindowDimensions(),compact=height<740;
 return <View accessibilityRole="radiogroup" accessibilityLabel="Credit packs" style={{gap:10,marginVertical:8}}>{CREDIT_PACKS.map((pack,i)=>{
  const active=selected===pack.id,price=economy.catalog?.products.find(p=>p.id===pack.id)?.usdCents;
  return <Pressable key={pack.id} disabled={locked} accessibilityRole="radio" accessibilityLabel={`${pack.credits.toLocaleString()} credits, ${pack.name}`} accessibilityState={{checked:active,disabled:locked}} onPress={()=>onSelect(pack.id)} style={[s.card,{minHeight:compact?98:120,borderColor:active?'#CFE6E4':'#30453D',backgroundColor:active?'#203A30':'#141F1C'}]}>
   <Image source={artwork[i]} resizeMode="contain" accessibilityIgnoresInvertColors style={{width:fontScale>1.3?78:112,height:compact?86:104,borderRadius:12}}/>
   <View style={{flex:1,gap:3}}><Text style={s.amount}>{pack.credits.toLocaleString()}</Text><Text style={s.name}>{pack.name}</Text><Text style={s.price}>{account.preview?'Demo credits':price!==undefined?`≈ $${(price/100).toFixed(2)}`:'Live price at checkout'}</Text></View>
   <View style={[s.radio,active&&{backgroundColor:'#CFE6E4',borderColor:'#CFE6E4'}]}>{active&&<Text style={{color:'#18392C',fontSize:13,fontWeight:'900'}}>✓</Text>}</View>
  </Pressable>;
 })}</View>;
}
const s=StyleSheet.create({card:{borderWidth:1.5,borderRadius:20,padding:10,flexDirection:'row',gap:12,alignItems:'center'},amount:{color:'#EDF5EE',fontSize:28,fontWeight:'900',fontVariant:['tabular-nums']},name:{color:'#B4CABC',fontSize:12},price:{color:'#D0DDCD',fontSize:11,marginTop:4},radio:{width:23,height:23,borderRadius:12,borderWidth:1.5,borderColor:'#658277',alignItems:'center',justifyContent:'center',marginRight:3}});
