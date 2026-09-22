import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useHaptics} from '../feedback/useHaptics';
import {CREDIT_PACKS} from '../../shared/store';
import CreditPackCards from './CreditPackCards';
import type {CreditCheckoutProps} from './credit-checkout-types';
export default function CreditCheckout({selected,onSelect,onClose,onDemoPurchase}:CreditCheckoutProps){
 const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState(''),haptic=useHaptics(),pack=CREDIT_PACKS.find(p=>p.id===selected)!;
 async function buy(){if(busy)return;if(done){onClose();return;}setBusy(true);setError('');try{await onDemoPurchase(selected);setDone(true);haptic('confirm');}catch(e){setError(e instanceof Error?e.message:'Could not save credits.');}finally{setBusy(false);}}
 return <View style={{gap:14}}><CreditPackCards selected={selected} onSelect={id=>{onSelect(id);setDone(false);setError('');}} locked={busy}/><View style={{flexDirection:'row',gap:10}}>{['SKR','SOL'].map(c=><View key={c} style={{flex:1,borderWidth:1,borderColor:'#344A42',borderRadius:14,padding:12,alignItems:'center'}}><Text style={{color:'#8DA79A',fontWeight:'800'}}>{c}</Text><Text style={{color:'#8DA79A',fontSize:10,marginTop:3}}>Android wallet checkout</Text></View>)}</View>{!!error&&<Text style={{color:'#E5C19D'}}>{error}</Text>}<Pressable disabled={busy} accessibilityRole="button" onPress={()=>void buy()} style={{minHeight:54,borderRadius:17,backgroundColor:'#CFE6E4',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#17382B',fontWeight:'800',fontSize:15}}>{busy?'Saving…':done?'Done — credits added':`Add ${pack.credits.toLocaleString()} demo credits`}</Text></Pressable><Text style={{color:'#A5BFAF',fontSize:11,lineHeight:16,textAlign:'center'}}>Browser demo only. No money or wallet request.{ '\n'}Android shows live prices before you approve.</Text></View>;
}
