import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import CreditCoin from './CreditIcon';

/** Shared balance appearance. Only actionable chips show the add affordance. */
export default function CreditChip({balance,ready=true,onPress,testID='credit-balance',accessibilityLabel}:{balance:number;ready?:boolean;onPress?:()=>void;testID?:string;accessibilityLabel?:string}){
 const label=accessibilityLabel??(ready?`${balance} credits${onPress?'. Buy credits':''}`:'Loading credits');
 const content=<><CreditCoin size={22}/><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.75} style={s.amount}>{ready?balance.toLocaleString():'…'}</Text>{onPress&&<Text style={s.plus}>+</Text>}</>;
 return onPress?<Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.chip}>{content}</Pressable>:<View testID={testID} accessible accessibilityLabel={label} style={s.chip}>{content}</View>;
}
const s=StyleSheet.create({
 chip:{minHeight:40,maxWidth:180,flexShrink:0,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:11,paddingVertical:4,borderWidth:1.3,borderColor:'#80B7A3',borderRadius:24,backgroundColor:'#0C1A15'},
 amount:{flexShrink:1,color:'#E0F3E9',fontSize:17,fontWeight:'800',fontVariant:['tabular-nums']},
 plus:{fontSize:18,color:'#AFDECD'},
});
