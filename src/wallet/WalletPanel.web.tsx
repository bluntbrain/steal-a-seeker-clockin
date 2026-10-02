import PromotionEntry from '../commerce/PromotionEntry';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useEconomy} from '../commerce/EconomyProvider';
import React,{useState} from 'react';
import {Modal,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import {CREDIT_PACKS} from '../../shared/store';
import type {ProductId} from '../../shared/commerce';
import PaywallVideo from '../commerce/PaywallVideo';
import {isSolanaCostume,costumeFor} from '../../shared/costumes';
import SkinPurchaseHero from '../commerce/SkinPurchaseHero';
import PaymentMethods from '../commerce/PaymentMethods';
import CreditBalance from '../components/CreditBalance';
import type {PaymentCurrency} from '../../shared/pricing';
export default function WalletPanel({initialPromotionCode,visible,onClose,sku='campaign',onDemoComplete}:{initialPromotionCode?:string;visible:boolean;onClose:()=>void;checkout?:boolean;sku?:ProductId;fullScreen?:boolean;onDemoComplete?:(credits:number)=>Promise<void>}){
 const premium=isSolanaCostume(sku),look=costumeFor(sku);
 const [currency,setCurrency]=useState<PaymentCurrency>('SKR');
 const economy=useEconomy(),pack=CREDIT_PACKS.find(p=>p.id===sku),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState(''),{height}=useWindowDimensions();
 async function pay(){if(busy||done)return;setBusy(true);try{if(!onDemoComplete)throw Error('Open checkout from Leaderboard or the credit store.');await onDemoComplete(pack?.credits??0);setDone(true);}catch(e){setError(e instanceof Error?e.message:'Try again.');}finally{setBusy(false);}}
 if(premium)return <Modal visible={visible} animationType="fade" onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#0B1612',alignItems:'center',paddingHorizontal:18,paddingTop:12,paddingBottom:14}}><View style={{width:'100%',maxWidth:430,flex:1}}>
  <View style={{height:46,flexShrink:0,flexDirection:'row',alignItems:'center',gap:8}}><Pressable accessibilityRole="button" accessibilityLabel="Back from checkout" onPress={onClose} style={{width:36,height:44,justifyContent:'center'}}><Text style={{fontSize:32,color:'#E0EFE3'}}>‹</Text></Pressable><Text accessibilityRole="header" numberOfLines={2} style={{flex:1,fontSize:17,lineHeight:20,fontWeight:'800',color:'#F3F2E9'}}>Unlock {look.name} skin</Text><CreditBalance readOnly/></View>
  <ScrollView testID="skin-checkout-scroll" style={{flex:1,minHeight:0}} contentContainerStyle={{gap:16,paddingBottom:18}} showsVerticalScrollIndicator={false}>
   <SkinPurchaseHero sku={sku} balance={economy.balance}/><PaymentMethods currency={currency} onChange={setCurrency} preview large disabled={busy||done}/>
   <Text style={{color:'#9EBAAC',fontSize:11,lineHeight:17,textAlign:'center'}}>Browser preview · No SOL or SKR is transferred.</Text>
  </ScrollView>
  <View testID="skin-checkout-footer" style={{flexShrink:0,gap:10,paddingTop:12,borderTopWidth:1,borderColor:'#34483C'}}>
   {!!error&&<Text accessibilityLiveRegion="polite" style={{color:'#E8C5AB'}}>{error}</Text>}
   <Pressable accessibilityRole="button" accessibilityLabel={done?'Done':`Try ${look.name} skin in this browser`} disabled={busy} onPress={()=>done?onClose():void pay()} style={{minHeight:53,borderRadius:13,borderWidth:1,borderColor:'#CEFAED',backgroundColor:'#B6F0DF',alignItems:'center',justifyContent:'center',paddingHorizontal:10}}><Text style={{fontSize:15,fontWeight:'800',color:'#0D2D22'}}>{busy?'Saving…':done?'Done':`Try ${look.name} skin`}</Text></Pressable>
   <Text style={{fontSize:11,lineHeight:17,color:'#9EB6AA',textAlign:'center'}}>{done?'Skin equipped for your browser game.':'Android shows live prices and requests wallet approval.'}</Text>
  </View>
 </View></View></Modal>;
 return <Modal visible={visible} animationType="fade" onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#0C1012',alignItems:'center',padding:20}}><View style={{width:'100%',maxWidth:430,flex:1,gap:18}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Pressable accessibilityRole="button" accessibilityLabel="Back from checkout" onPress={onClose} style={{padding:10}}><Text style={{fontSize:24,color:'#CFE6E4'}}>‹</Text></Pressable><CreditBalance readOnly/></View>{sku==='campaign'&&<PromotionEntry initialCode={initialPromotionCode}/>} {premium?<SkinPurchaseHero sku={sku}/>:<View style={{height:Math.min(height*.25,220),borderRadius:20,overflow:'hidden',backgroundColor:'#1C3529',alignItems:'center',justifyContent:'center'}}>{pack?<Text style={{fontSize:75,color:'#CFE6E4'}}>◈</Text>:<PaywallVideo active={visible}/>}</View>}<Text style={{fontSize:32,color:'#EDF5EE',fontWeight:'900'}}>{premium?(done?'Skin equipped.':'') :done?pack?'Demo credits added.':'You’re in.':pack?`${pack.credits.toLocaleString()} credits`:'Join the weekly climb.'}</Text><Text style={{fontSize:14,lineHeight:22,color:'#B7CFC1'}}>{premium?'Browser demo: try the skin in the game. Android uses live prices and wallet approval before granting ownership.':pack?'This adds free test credits to this browser only. In the Android app, a credit pack opens Phantom for a real SOL or SKR payment.':'3 missions each week. 5 ranked chances on each. Your best complete runs decide your rank. No buying extra attempts.'}</Text>{!pack&&!premium&&<Text style={{fontSize:13,color:'#D2E8DB'}}>Live pass: 500 SKR or $10 worth of SOL. Pay once. Existing pass owners keep access.</Text>}<View style={{flex:1}}/>{!!error&&<Text style={{color:'#E8C5AB'}}>{error}</Text>}<Pressable accessibilityRole="button" accessibilityLabel={done?'Done':premium?`Try ${look.name} in this browser`:pack?`Add ${pack.credits} demo credits`:'Unlock demo Game Pass'} disabled={busy} onPress={()=>done?onClose():void pay()} style={{minHeight:54,borderRadius:15,backgroundColor:'#CFE6E4',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:14,fontWeight:'800',color:'#16362A'}}>{busy?'Saving…':done?'Done':premium?`Try ${look.name} in this browser`:pack?`Add ${pack.credits} demo credits`:'Try the Game Pass'}</Text></Pressable><Text style={{fontSize:11,lineHeight:17,color:'#8EA99A',textAlign:'center'}}>This browser preview does not transfer SOL or SKR. Android checkout uses Phantom approval.{!pack&&!premium?' Weekly token prizes are not active.':''}</Text></View></View></Modal>;
}
