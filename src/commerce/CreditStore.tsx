import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import React,{useState} from 'react';
import {Modal,StyleSheet,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {CreditPackId} from '../../shared/store';
import CreditBalance from '../components/CreditBalance';
import CreditCheckout from './CreditCheckout';
export default function CreditStore({visible,onClose,onDemoPurchase}:{visible:boolean;onClose:()=>void;onDemoPurchase:(sku:CreditPackId)=>Promise<void>}){
 const safe=useSafeAreaInsets(),[selected,setSelected]=useState<CreditPackId>('credits-1500');
 return <Modal visible={visible} animationType="fade" onRequestClose={onClose}><View testID="credit-store-screen" style={[s.screen,{paddingTop:safe.top+8,paddingBottom:safe.bottom+8}]}><View style={s.container}>
  <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Back from credit store" onPress={onClose} style={s.back}><Text style={{fontSize:28,color:'#CFE6E4'}}>‹</Text></Pressable><CreditBalance readOnly/></View>
  <View style={{gap:6,marginTop:12,marginBottom:14}}><Text style={s.title}>ADD CREDITS</Text><Text style={s.subtitle}>Your next look starts here.</Text></View>
  {visible&&<CreditCheckout fullScreen selected={selected} onSelect={setSelected} onClose={onClose} onDemoPurchase={onDemoPurchase}/>}
  <Text style={[s.footer,{paddingTop:10}]}>Outfits & effects. No ranked advantage.{ '\n'}Credits have no cash value.</Text>
 </View></View></Modal>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#0C1012',paddingHorizontal:20,alignItems:'center'},container:{width:'100%',maxWidth:430,flex:1},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:52},back:{width:46,height:46,justifyContent:'center',alignItems:'center',borderRadius:15,borderWidth:1,borderColor:'#2B4037',backgroundColor:'#15211C'},title:{color:'#EDF5EE',fontSize:32,fontWeight:'900',letterSpacing:.5},subtitle:{color:'#A8C2B2',fontSize:13},footer:{color:'#8CA697',fontSize:11,lineHeight:17,textAlign:'center'}});
