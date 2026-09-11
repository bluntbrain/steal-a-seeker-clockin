import React,{useEffect,useRef,useState} from 'react';
import {Linking,Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useMobileWallet} from '@wallet-ui/react-native-kit';
import {signature as parseSignature} from '@solana/kit';
import {getAddMemoInstruction} from '@solana-program/memo';
import {transactionLink} from './config';
import CommerceSection from '../commerce/CommerceSection';
export default function WalletPanel({visible,onClose}:{visible:boolean;onClose:()=>void}){
 const wallet=useMobileWallet();const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[balance,setBalance]=useState<string>(),[receipt,setReceipt]=useState<string>();const mounted=useRef(true),accountRef=useRef(wallet.account?.address);accountRef.current=wallet.account?.address;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{setBalance(undefined);setReceipt(undefined);setMessage('');let cancelled=false;const address=wallet.account?.address;if(address&&visible)wallet.client.rpc.getBalance(address).send().then(r=>{if(!cancelled)setBalance((Number(r.value)/1e9).toFixed(5));}).catch(()=>{if(!cancelled)setMessage('Could not read devnet balance. Check your connection.');});return()=>{cancelled=true;};},[wallet.account?.address,visible]);
 async function act(action:()=>Promise<void>){if(busy)return;setBusy(true);setMessage('');try{await action();}catch(e){if(mounted.current)setMessage(e instanceof Error?e.message:'The wallet request did not finish. You can try again.');}finally{if(mounted.current)setBusy(false);}}
 async function sendTest(){
  const address=wallet.account?.address;if(!address)throw new Error('Connect your wallet first.');
  setMessage('Approve the devnet transaction in your wallet.');
  const tx=await wallet.sendTransactions([getAddMemoInstruction({memo:'Steal a Seeker: devnet wallet connection test'})]);
  if(!mounted.current||accountRef.current!==address)return;
  setReceipt(tx);setMessage('Submitted on devnet. Waiting for finality…');
  for(let n=0;n<30;n++){
   const response=await wallet.client.rpc.getSignatureStatuses([parseSignature(tx)]).send();const status=response.value[0];
   if(!mounted.current||accountRef.current!==address)return;
   if(status?.err){setMessage('The test transaction failed on chain. Check its receipt.');return;}
   if(status?.confirmationStatus==='finalized'){setMessage('Devnet transaction finalized. This was a connection test, not a purchase.');return;}
   await new Promise(resolve=>setTimeout(resolve,1200));
  }
  setMessage('Still pending. Check the receipt before submitting another transaction.');
 }
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.backdrop}><ScrollView style={styles.card} contentContainerStyle={{padding:24,gap:16}}>
  <Text style={styles.tag}>SOLANA DEVNET</Text><Text style={styles.title}>Your wallet</Text><Text style={styles.body}>Connect Phantom on this Android device. Testnet Mode must be enabled in Phantom. Only devnet SOL is used here.</Text>
  <View style={styles.account}><Text selectable style={styles.address}>{wallet.account?.address||'No wallet connected'}</Text><Text style={styles.body}>{balance===undefined?'':`${balance} devnet SOL`}</Text></View>
  {!wallet.account?<Pressable accessibilityRole="button" disabled={busy} style={styles.primary} onPress={()=>act(async()=>{await wallet.connect();setMessage('Wallet connected on devnet.');})}><Text style={styles.primaryText}>{busy?'OPENING WALLET…':'CONNECT PHANTOM / WALLET'}</Text></Pressable>:<>
   <Text style={styles.body}>Developer test: sign a small memo transaction. It costs a devnet network fee and does not buy campaign access.</Text>
   <Pressable accessibilityRole="button" disabled={busy} style={styles.primary} onPress={()=>act(sendTest)}><Text style={styles.primaryText}>{busy?'WAITING…':'SEND DEVNET TEST'}</Text></Pressable>
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>act(async()=>{await wallet.disconnect();setMessage('Disconnected.');})}><Text style={styles.link}>Disconnect wallet</Text></Pressable>
  </>}
  {!!message&&<Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
  {!!receipt&&<Pressable accessibilityRole="link" onPress={()=>Linking.openURL(transactionLink(receipt))}><Text style={styles.link}>View devnet transaction ↗</Text></Pressable>}
  {wallet.account&&<CommerceSection/>}
  <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}><Text style={styles.link}>Back to game</Text></Pressable>
 </ScrollView></View></Modal>;
}
const styles=StyleSheet.create({backdrop:{flex:1,backgroundColor:'#081210e8',justifyContent:'center',padding:20},card:{flexGrow:0,maxHeight:'90%',backgroundColor:'#152724',borderRadius:24,borderWidth:1,borderColor:'#3c6257'},tag:{color:'#a8ecd7',fontSize:11,letterSpacing:2,fontWeight:'700'},title:{color:'#edf1e6',fontSize:30,fontWeight:'800'},body:{color:'#bacbc2',fontSize:14,lineHeight:22},account:{padding:14,backgroundColor:'#0e1d1b',borderRadius:12,gap:8},address:{color:'#d4eee2',fontSize:12,lineHeight:20},primary:{backgroundColor:'#bfe5d7',padding:17,borderRadius:12},primaryText:{color:'#152d24',textAlign:'center',fontSize:12,fontWeight:'800'},link:{color:'#b9e8d5',fontSize:14,textAlign:'center'},close:{padding:14}});
