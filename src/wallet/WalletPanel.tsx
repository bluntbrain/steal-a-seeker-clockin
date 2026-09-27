import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useEconomy} from '../commerce/EconomyProvider';
import type {ProductId} from '../../shared/commerce';
import PaywallVideo from '../commerce/PaywallVideo';
import {IS_MAINNET,NETWORK_LABEL} from './config';
import React,{useEffect,useRef,useState} from 'react';
import {Modal,ScrollView,Share,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useLoggedWallet as useMobileWallet} from './useLoggedWallet';
import {walletReport,walletStep,walletLog} from './diagnostics';
import WalletConnectionError from './WalletConnectionError';
import CommerceSection from '../commerce/CommerceSection';
import {isSolanaCostume,costumeFor} from '../../shared/costumes';
import SkinPurchaseHero from '../commerce/SkinPurchaseHero';
import PaymentMethods from '../commerce/PaymentMethods';
import CreditBalance from '../components/CreditBalance';
import type {PaymentCurrency} from '../../shared/pricing';
export default function WalletPanel({visible,onClose,checkout=false,sku='campaign',fullScreen=false}:{visible:boolean;onClose:()=>void;checkout?:boolean;sku?:ProductId;fullScreen?:boolean;onDemoComplete?:(credits:number)=>Promise<void>}){
 const economy=useEconomy(),wallet=useMobileWallet(),insets=useSafeAreaInsets(),{height}=useWindowDimensions();
 const [busy,setBusy]=useState(false),[message,setMessage]=useState<unknown>(null),[balance,setBalance]=useState<string>();
 const [skinCurrency,setSkinCurrency]=useState<PaymentCurrency>('SKR');
 const mounted=useRef(true),lock=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{setBalance(undefined);setMessage(null);let cancelled=false;const address=wallet.account?.address,premium=isSolanaCostume(sku);if(address&&visible)walletStep('rpc.fee-balance',()=>wallet.client.rpc.getBalance(address).send()).then(r=>{if(!cancelled)setBalance((Number(r.value)/1e9).toFixed(3));}).catch(()=>{if(!cancelled)setBalance('Unavailable');});return()=>{cancelled=true;};},[wallet.account?.address,visible]);
 async function act(action:()=>Promise<unknown>){if(lock.current)return;lock.current=true;setBusy(true);setMessage(null);try{await action();}catch(e){if(mounted.current)setMessage(e);}finally{lock.current=false;if(mounted.current)setBusy(false);}}
 useEffect(()=>{walletLog(visible?'checkout.sheet.visible':'checkout.sheet.hidden',{connected:!!wallet.account?.address});},[visible,wallet.account?.address]);
 const autoOpened=useRef(false);
 useEffect(()=>{
  if(!visible){autoOpened.current=false;return;}
  // Only the explicit pass CTA opts into opening Phantom; normal wallet visits never do.
  if(checkout&&!wallet.account?.address&&!autoOpened.current){autoOpened.current=true;void act(()=>wallet.connect());}
 },[visible,checkout,wallet.account?.address]);
 const address=wallet.account?.address,premium=isSolanaCostume(sku);
 if(premium){const look=costumeFor(sku);return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#0B1612',alignItems:'center',paddingHorizontal:18,paddingTop:insets.top+8,paddingBottom:Math.max(insets.bottom,12)}}><View style={{width:'100%',maxWidth:430,flex:1}}>
  <View style={{height:46,flexShrink:0,flexDirection:'row',alignItems:'center',gap:8}}><Pressable accessibilityRole="button" accessibilityLabel="Back from checkout" onPress={onClose} style={{width:36,height:44,justifyContent:'center'}}><Text style={{fontSize:32,color:'#E0EFE3'}}>‹</Text></Pressable><Text accessibilityRole="header" numberOfLines={2} style={{flex:1,fontSize:17,lineHeight:20,fontWeight:'800',color:'#F3F2E9'}}>Unlock {look.name} skin</Text><CreditBalance readOnly/></View>
  {address?<CommerceSection sku={sku} onComplete={onClose} fullScreen initialCurrency={skinCurrency} renderSelection={(_locked,selected)=><SkinPurchaseHero sku={selected} balance={economy.balance}/>} beforeSelection={<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontSize:10,color:'#9AB5A8'}}>{address.slice(0,4)}…{address.slice(-4)} · {NETWORK_LABEL}</Text><Pressable accessibilityRole="button" accessibilityLabel="Disconnect wallet" disabled={busy} onPress={()=>act(()=>wallet.disconnect())} style={{minHeight:32,justifyContent:'center'}}><Text style={{fontSize:10,color:'#9AB5A8'}}>Disconnect</Text></Pressable></View>}/>:<>
   <ScrollView testID="skin-checkout-scroll" style={{flex:1,minHeight:0}} contentContainerStyle={{gap:16,paddingBottom:18}} showsVerticalScrollIndicator={false}><SkinPurchaseHero sku={sku} balance={economy.balance}/><PaymentMethods currency={skinCurrency} onChange={setSkinCurrency} unconnected large disabled={busy}/></ScrollView>
   <View testID="skin-checkout-footer" style={{flexShrink:0,gap:10,paddingTop:12,borderTopWidth:1,borderColor:'#34483C'}}><WalletConnectionError error={message}/><Pressable accessibilityRole="button" accessibilityLabel="Connect wallet to unlock skin" disabled={busy} onPress={()=>act(()=>wallet.connect())} style={[s.primary,{backgroundColor:'#B6F0DF',borderRadius:13}]}><Text style={s.primaryText}>{busy?'Opening wallet…':'Connect wallet to unlock skin'}</Text></Pressable><Text style={[s.caption,{textAlign:'center'}]}>View the live price, then approve in your wallet.</Text></View>
  </>}
 </View></View></Modal>;}
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={[s.backdrop,fullScreen&&{backgroundColor:'#0C1012',justifyContent:'flex-start',paddingTop:insets.top+8,paddingBottom:insets.bottom+8}]}>
 <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close wallet" onPress={onClose}/>
 <View testID="wallet-sheet" accessibilityViewIsModal style={[s.card,fullScreen&&{borderWidth:0,borderRadius:0,backgroundColor:'#0C1012',flex:1},{paddingBottom:Math.max(insets.bottom,12),paddingTop:height<700?10:16}]}>
 <Pressable accessibilityRole="button" accessibilityLabel="Share wallet diagnostic log" onLongPress={()=>void Share.share({message:walletReport()})}>{!fullScreen&&<View style={s.handle}/>} </Pressable><View style={s.header}>{fullScreen&&<Pressable accessibilityRole="button" accessibilityLabel="Back from checkout" onPress={onClose} style={s.close}><Text style={s.closeText}>‹</Text></Pressable>}<Text accessibilityRole="header" style={s.title}>{checkout?sku==='campaign'?'Game Pass':premium?'Unlock skin':'Add credits':address?'Your wallet':'Connect your wallet'}</Text><CreditBalance readOnly/>{!fullScreen&&<Pressable accessibilityRole="button" accessibilityLabel="Close wallet" onPress={onClose} style={s.close}><Text style={s.closeText}>✕</Text></Pressable>}</View>
 <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{gap:12,paddingBottom:12}}>
 {premium&&!address&&<SkinPurchaseHero sku={sku}/>}
 {checkout&&sku==='campaign'&&!address&&<View style={{height:Math.min(190,height*.23),overflow:'hidden',borderRadius:18}}><PaywallVideo active={visible&&!busy}/></View>}
 {address?<><View style={s.account}><View style={{flex:1,gap:3}}><Text selectable accessibilityLabel={`Connected wallet ${address}`} style={s.address}>{address.slice(0,4)}…{address.slice(-4)} <Text style={s.badge}> · {NETWORK_LABEL}</Text></Text><Text style={s.caption}>{balance===undefined?'Checking fee balance…':balance==='Unavailable'?'Fee balance unavailable':`${balance} SOL for fees`}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Disconnect wallet" disabled={busy} onPress={()=>act(()=>wallet.disconnect())} style={s.disconnect}><Text style={s.caption}>{busy?'…':'Disconnect'}</Text></Pressable></View><CommerceSection sku={sku} onComplete={onClose} renderSelection={premium?(_locked,selected)=><SkinPurchaseHero sku={selected}/>:undefined}/></>:<View style={{gap:14,paddingVertical:10}}><Text style={s.body}>{IS_MAINNET?'Use Phantom on Mainnet. Purchases spend real SOL or SKR.':'Use Phantom on Solana Devnet. You’ll approve purchases in your wallet.'}</Text><Pressable accessibilityRole="button" disabled={busy} style={s.primary} onPress={()=>act(()=>wallet.connect())}><Text style={s.primaryText}>{busy?'Opening wallet…':message?'Retry wallet connection':'Connect wallet'}</Text></Pressable><Text style={s.caption}>{IS_MAINNET?'Your wallet shows the exact amount before you approve.':'TEST SKR and devnet SOL have no real value.'}</Text></View>}
 {!!message&&<View><WalletConnectionError error={message}/><Pressable accessibilityRole="button" style={{minHeight:44,justifyContent:'center'}} onPress={()=>void Share.share({message:walletReport()})}><Text style={s.caption}>Share diagnostic log</Text></Pressable></View>}
 </ScrollView></View></View></Modal>;
}
const s=StyleSheet.create({backdrop:{flex:1,backgroundColor:'#050B10B8',justifyContent:'flex-end',alignItems:'center'},card:{width:'100%',maxWidth:460,backgroundColor:'#131D20',borderTopLeftRadius:28,borderTopRightRadius:28,paddingHorizontal:20,borderWidth:1,borderColor:'#35494B',gap:10},handle:{alignSelf:'center',width:34,height:3,borderRadius:2,backgroundColor:'#57716D'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},title:{flex:1,flexShrink:1,color:'#F0F6EC',fontSize:24,fontWeight:'800',letterSpacing:-.6},close:{width:44,height:44,alignItems:'center',justifyContent:'center'},closeText:{color:'#BFD6CE',fontSize:19},account:{flexDirection:'row',alignItems:'center',padding:12,borderRadius:14,backgroundColor:'#0B1417'},address:{color:'#E0F0E7',fontSize:14,fontWeight:'700'},badge:{fontSize:9,color:'#9BDDC4',letterSpacing:1},caption:{color:'#9FB9B2',fontSize:11,lineHeight:16},disconnect:{minHeight:44,paddingLeft:14,justifyContent:'center'},body:{color:'#BFD0C9',fontSize:14,lineHeight:21},primary:{minHeight:50,justifyContent:'center',backgroundColor:'#C4F7DC',borderRadius:15,padding:12},primaryText:{color:'#17352B',textAlign:'center',fontSize:14,fontWeight:'800'},error:{color:'#FFD0B1',fontSize:12,lineHeight:17,paddingBottom:8}});
