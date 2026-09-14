import {IS_MAINNET,NETWORK_LABEL} from './config';
import React,{useEffect,useRef,useState} from 'react';
import {Modal,Share,Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useLoggedWallet as useMobileWallet} from './useLoggedWallet';
import {walletErrorMessage,walletReport,walletStep,walletLog} from './diagnostics';
import CommerceSection from '../commerce/CommerceSection';
export default function WalletPanel({visible,onClose,checkout=false}:{visible:boolean;onClose:()=>void;checkout?:boolean}){
 const wallet=useMobileWallet(),insets=useSafeAreaInsets(),{height}=useWindowDimensions();
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[balance,setBalance]=useState<string>();
 const mounted=useRef(true),lock=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{setBalance(undefined);setMessage('');let cancelled=false;const address=wallet.account?.address;if(address&&visible)walletStep('rpc.fee-balance',()=>wallet.client.rpc.getBalance(address).send()).then(r=>{if(!cancelled)setBalance((Number(r.value)/1e9).toFixed(3));}).catch(()=>{if(!cancelled)setBalance('Unavailable');});return()=>{cancelled=true;};},[wallet.account?.address,visible]);
 async function act(action:()=>Promise<unknown>){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');try{await action();}catch(e){if(mounted.current)setMessage(walletErrorMessage(e));}finally{lock.current=false;if(mounted.current)setBusy(false);}}
 useEffect(()=>{walletLog(visible?'checkout.sheet.visible':'checkout.sheet.hidden',{connected:!!wallet.account?.address});},[visible,wallet.account?.address]);
 const autoOpened=useRef(false);
 useEffect(()=>{
  if(!visible){autoOpened.current=false;return;}
  // Only the explicit pass CTA opts into opening Phantom; normal wallet visits never do.
  if(checkout&&!wallet.account?.address&&!autoOpened.current){autoOpened.current=true;void act(()=>wallet.connect());}
 },[visible,checkout,wallet.account?.address]);
 const address=wallet.account?.address;
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={s.backdrop}>
 <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close wallet" onPress={onClose}/>
 <View testID="wallet-sheet" accessibilityViewIsModal style={[s.card,{paddingBottom:Math.max(insets.bottom,12),paddingTop:height<700?10:16}]}>
 <Pressable accessibilityRole="button" accessibilityLabel="Share wallet diagnostic log" onLongPress={()=>void Share.share({message:walletReport()})}><View style={s.handle}/></Pressable><View style={s.header}><Text accessibilityRole="header" style={s.title}>{checkout?'Unlock the game':address?'Your wallet':'Connect your wallet'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close wallet" onPress={onClose} style={s.close}><Text style={s.closeText}>✕</Text></Pressable></View>
 {address?<><View style={s.account}><View style={{flex:1,gap:3}}><Text selectable accessibilityLabel={`Connected wallet ${address}`} style={s.address}>{address.slice(0,4)}…{address.slice(-4)} <Text style={s.badge}> · {NETWORK_LABEL}</Text></Text><Text style={s.caption}>{balance===undefined?'Checking fee balance…':balance==='Unavailable'?'Fee balance unavailable':`${balance} SOL for fees`}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Disconnect wallet" disabled={busy} onPress={()=>act(()=>wallet.disconnect())} style={s.disconnect}><Text style={s.caption}>{busy?'…':'Disconnect'}</Text></Pressable></View><CommerceSection/></>:<View style={{gap:14,paddingVertical:10}}><Text style={s.body}>{IS_MAINNET?'Use Phantom on Mainnet. Purchases spend real SOL or SKR.':'Use Phantom on Solana Devnet. You’ll approve purchases in your wallet.'}</Text><Pressable accessibilityRole="button" disabled={busy} style={s.primary} onPress={()=>act(()=>wallet.connect())}><Text style={s.primaryText}>{busy?'Opening wallet…':'Connect wallet'}</Text></Pressable><Text style={s.caption}>{IS_MAINNET?'Mainnet test · real funds · reduced prices':'TEST SKR and devnet SOL have no real value.'}</Text></View>}
 {!!message&&<View><Text accessibilityLiveRegion="polite" style={s.error}>{message}</Text><Pressable accessibilityRole="button" style={{minHeight:44,justifyContent:'center'}} onPress={()=>void Share.share({message:walletReport()})}><Text style={s.caption}>Share diagnostic log</Text></Pressable></View>}
 </View></View></Modal>;
}
const s=StyleSheet.create({backdrop:{flex:1,backgroundColor:'#050B10B8',justifyContent:'flex-end',alignItems:'center'},card:{width:'100%',maxWidth:460,backgroundColor:'#131D20',borderTopLeftRadius:28,borderTopRightRadius:28,paddingHorizontal:20,borderWidth:1,borderColor:'#35494B',gap:10},handle:{alignSelf:'center',width:34,height:3,borderRadius:2,backgroundColor:'#57716D'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{color:'#F0F6EC',fontSize:24,fontWeight:'800',letterSpacing:-.6},close:{width:44,height:44,alignItems:'center',justifyContent:'center'},closeText:{color:'#BFD6CE',fontSize:19},account:{flexDirection:'row',alignItems:'center',padding:12,borderRadius:14,backgroundColor:'#0B1417'},address:{color:'#E0F0E7',fontSize:14,fontWeight:'700'},badge:{fontSize:9,color:'#9BDDC4',letterSpacing:1},caption:{color:'#9FB9B2',fontSize:11,lineHeight:16},disconnect:{minHeight:44,paddingLeft:14,justifyContent:'center'},body:{color:'#BFD0C9',fontSize:14,lineHeight:21},primary:{minHeight:50,justifyContent:'center',backgroundColor:'#C4F7DC',borderRadius:15,padding:12},primaryText:{color:'#17352B',textAlign:'center',fontSize:14,fontWeight:'800'},error:{color:'#FFD0B1',fontSize:12,lineHeight:17,paddingBottom:8}});
