import {NETWORK_NAME,IS_MAINNET,SKR_LABEL,NETWORK_LABEL} from '../wallet/config';
import React,{useEffect,useRef,useState} from 'react';
import {Linking,Share,Pressable,Text,View,useWindowDimensions} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {useLoggedWallet as useMobileWallet} from '../wallet/useLoggedWallet';
import {walletFailure,walletReport,walletLog} from '../wallet/diagnostics';
import {getBase58Decoder} from '@solana/kit';
import {currencyLabel,usdLabel,type PaymentCurrency,type ProductPricing} from '../../shared/pricing';
import {PRODUCTS,tokenAmount,type Order,type ProductId} from '../../shared/commerce';
import {commerceApi} from './client';
import {useAccount} from './account-context';
import {paymentTransaction,PAYMENT_NETWORK_FEE_LAMPORTS} from './payment';
import {matchesCheckoutPrice} from './checkout-intent';
import {needsReconciliation,restoredCheckout} from './restoration';
import {transactionLink} from '../wallet/config';
import CourierArt from '../components/CourierArt';
const pendingKey=(wallet:string)=>`seeker.order.${NETWORK_NAME}.${wallet}`;
const label=(c:PaymentCurrency)=>currencyLabel(c,IS_MAINNET);
export default function CommerceSection(){
 const {height,fontScale}=useWindowDimensions(),[index,setIndex]=useState(0);
 const [currency,setCurrency]=useState<PaymentCurrency>('SKR'),[prices,setPrices]=useState<ProductPricing>(),[priceError,setPriceError]=useState(''),[refreshPrice,setRefreshPrice]=useState(0),[now,setNow]=useState(Date.now());
 const wallet=useMobileWallet(),identity=useAccount(),{account,session,update}=identity,[order,setOrder]=useState<Order>(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const current=useRef(wallet.account?.address);current.current=wallet.account?.address;const alive=useRef(true),busyLock=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{setOrder(undefined);setMessage('');},[wallet.account?.address]);
 async function action(run:()=>Promise<void>){if(busyLock.current)return;busyLock.current=true;setBusy(true);setMessage('');try{await run();}catch(e){walletFailure('commerce.action',e);if(alive.current)setMessage(e instanceof Error?e.message:'Could not finish. Restore purchases before paying again.');}finally{busyLock.current=false;if(alive.current)setBusy(false);}}
 async function restore(){
  const s=await session(),orders=await commerceApi.orders(s.token);let failed=false;
  for(const o of orders.filter(o=>needsReconciliation(o)).slice(0,5)){try{await commerceApi.reconcile(s.token,o.id);}catch(e){failed=true;walletFailure('commerce.restore.reconcile',e);}}
  const [state,latest]=await Promise.all([commerceApi.me(s.token),commerceApi.orders(s.token)]);
  if(current.current!==s.wallet||!alive.current)return;
  await update(state);const result=restoredCheckout(state,latest,await SecureStore.getItemAsync(pendingKey(s.wallet)));
  if(current.current!==s.wallet||!alive.current)return;
  setOrder(result.order);if(result.order){setCurrency(result.order.currency??'SKR');await SecureStore.setItemAsync(pendingKey(s.wallet),result.order.id);}else await SecureStore.deleteItemAsync(pendingKey(s.wallet));
  walletLog('commerce.restore.result',{accounts:state.entitlements.length,connected:state.entitlements.includes('campaign'),cached:!!result.order});
  setMessage(failed&&!state.entitlements.includes('campaign')?'Some payment checks are unavailable. Access is not confirmed yet; try Check payment again.':result.message);
 }
 async function quote(sku:ProductId){const s=await session();const state=await commerceApi.me(s.token);if(current.current!==s.wallet||!alive.current)return;if(state.entitlements.includes(sku)){await update(state);setMessage('Already purchased. Your access is restored.');return;}const prior=await SecureStore.getItemAsync(pendingKey(s.wallet));if(prior){const previous=await commerceApi.reconcile(s.token,prior);if(previous.status==='verifying'||previous.status==='needs_review'){setOrder(previous);setCurrency(previous.currency??'SKR');setMessage(previous.signature?'Your earlier payment is being confirmed. Tap Check payment.':'An earlier wallet request is being checked. Tap Check payment.');return;}}
  const next=await commerceApi.quote(s.token,sku,crypto.randomUUID(),currency);await SecureStore.setItemAsync(pendingKey(s.wallet),next.id);if(current.current===s.wallet){setOrder(next);setCurrency(next.currency??'SKR');setMessage('');return next;}}
 async function pay(orderToPay=order){
  const order=orderToPay;
  if(!order||order.status==='fulfilled'||order.status==='needs_review')return;
  const s=await session();if(s.wallet!==order.wallet||current.current!==s.wallet)throw new Error('Wallet changed. Restore purchases for the selected wallet.');
  if(order.currency==='SOL'&&!order.payment){const balance=await wallet.client.rpc.getBalance(s.wallet as never).send();if(balance.value<BigInt(order.amount)+PAYMENT_NETWORK_FEE_LAMPORTS)throw new Error(`Not enough SOL. You need ${tokenAmount(order.amount,9)} SOL plus the network fee.`);}
  const prepared=await commerceApi.prepare(s.token,order.id);if(current.current!==s.wallet||!alive.current)return;setOrder(prepared);
  if(prepared.status==='fulfilled'){await update(await commerceApi.me(s.token));setMessage('This payment was already completed. Purchases restored.');return;}
  if(!prepared.payment)throw new Error(prepared.detail||'Quote expired. Request a new quote.');
  setMessage(`Approve the ${label(prepared.currency??'SKR')} payment in Phantom.`);
  const signed=await wallet.signAndSendTransactions(paymentTransaction(prepared),BigInt(prepared.payment.contextSlot)),signature=getBase58Decoder().decode(signed);
  walletLog('commerce.payment.signature',{bytes:signed.length});
  let next=await commerceApi.attach(s.token,prepared.id,signature);if(current.current!==s.wallet||!alive.current)return;setOrder(next);setMessage('Confirming your purchase…');
  for(let attempt=0;attempt<6&&next.status==='verifying';attempt++){
   await new Promise(resolve=>setTimeout(resolve,3000));if(current.current!==s.wallet||!alive.current)return;
   try{next=await commerceApi.reconcile(s.token,prepared.id);}catch(e){walletFailure('commerce.payment.confirmation',e);break;}
   if(current.current!==s.wallet||!alive.current)return;setOrder(next);
  }
  setMessage(next.status==='fulfilled'?'Purchase verified. Campaign access is ready.':next.detail||'Payment submitted. Tap Check payment to check finality.');await update(await commerceApi.me(s.token));
 }

 const products=account?.entitlements.includes('campaign')?PRODUCTS.filter(p=>p.kind!=='access'):PRODUCTS.filter(p=>p.kind==='access');
 const selected=products[index%products.length]!,product=order?PRODUCTS.find(p=>p.id===order.sku)??selected:selected;
 useEffect(()=>{let active=true;setPrices(undefined);setPriceError('');void commerceApi.pricing(product.id).then(p=>{if(active)setPrices(p);}).catch(()=>{if(active)setPriceError('Prices unavailable. Tap Refresh.');});return()=>{active=false;};},[product.id,refreshPrice]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),5000);return()=>clearInterval(timer);},[]);
 const preview=prices?.options.find(p=>p.currency===currency),stale=!prices||now>=new Date(prices.expiresAt).getTime();
 const selectedCurrency=order?.currency??currency,price=order?order.pricing:preview;
 const amountText=order?`${tokenAmount(order.amount,order.decimals)} ${label(selectedCurrency)}`:preview?`${tokenAmount(preview.amount,preview.decimals)} ${label(currency)}`:'Fetching price…';
 const expired=!!order&&!order.payment&&now>=new Date(order.expiresAt).getTime();
 async function backToMethods(){await action(async()=>{if(!order)return;const s=await session();await commerceApi.cancel(s.token,order.id);await SecureStore.deleteItemAsync(pendingKey(s.wallet));setOrder(undefined);setMessage('');setRefreshPrice(n=>n+1);});}
 const completionReward=order?(order.campaignTerms?.rebate??0):(prices?.campaignOffer?.rebateSkr??0);
 const owned=account?.entitlements.includes(product.id),equipped=account?.equipment[product.kind]===product.id;
 const pending=order?.status==='verifying'||order?.status==='needs_review';
 const compact=height<720||fontScale>1.2;
 function browse(delta:number){setIndex(i=>(i+delta+products.length)%products.length);setOrder(undefined);setMessage('');}
 const button=(label:string,onPress:()=>void,disabled=false)=><Pressable disabled={busy||disabled} accessibilityRole="button" accessibilityState={{disabled:busy||disabled,busy}} onPress={onPress} style={{minHeight:50,justifyContent:'center',padding:12,borderRadius:15,backgroundColor:'#C4F7DC',opacity:(busy||disabled)?0.5:1}}><Text style={{color:'#17382B',fontSize:14,fontWeight:'800',textAlign:'center'}}>{busy?'Please wait…':label}</Text></Pressable>;
 // A lost wallet callback may still mean it submitted. Reconcile before retrying.
 const mainLabel=pending?'Check payment':owned?(product.kind==='access'?'Campaign unlocked':equipped?'Equipped':'Equip item'):expired?'Get a new quote':order?`Pay ${amountText}`:stale?'Refresh prices':`Pay ${amountText}`;
 function primary(){if(expired){void backToMethods();return;}if(!order&&!owned&&stale){setRefreshPrice(n=>n+1);return;}void action(async()=>{if(pending){await restore();return;}if(owned){const s=await session();await update(await commerceApi.equip(s.token,product.id));setMessage('Item equipped.');return;}if(order){await pay();return;}const next=await quote(product.id);if(next){if(matchesCheckoutPrice(next,product.id,preview,prices?.campaignOffer?.rebateSkr))await pay(next);else setMessage('Price or reward changed. Review the updated offer, then tap Pay.');}});}
 return <View testID="wallet-purchase" style={{gap:compact?8:12}}>
 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:'#A8C7BC',fontSize:10,letterSpacing:1.5,fontWeight:'700'}}>{product.kind==='access'?'GAME PASS':'WARDROBE'}</Text><Text style={{color:'#8FAEA3',fontSize:10}}>{product.kind==='access'?'PAY ONCE':`${index%products.length+1} / ${products.length}`}</Text></View>
 <View style={{flexDirection:'row',alignItems:'center',gap:12,padding:12,backgroundColor:'#1D3031',borderRadius:17}}>
 {fontScale<=1.2&&(product.kind==='access'||product.kind==='outfit'?<CourierArt height={compact?66:96} outfit={product.kind==='outfit'?product.id:undefined}/>:<View style={{width:compact?55:78,height:compact?66:96,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#C4F7DC',fontSize:44}}>{product.kind==='trail'?'↗':product.kind==='frame'?'▣':'▤'}</Text></View>)}
 <View style={{flex:1,gap:5}}><Text style={{color:'#F0F5E8',fontSize:19,fontWeight:'800'}}>{product.name}</Text><Text style={{color:'#B9D0C5',fontSize:12,lineHeight:17}}>{product.kind==='access'?'12 missions + weekly competition. Unlimited practice.':product.description}</Text><Text style={{color:'#C4F7DC',fontSize:16,fontWeight:'800'}}>{owned?(equipped?'Equipped':'Owned'):price?`≈ ${usdLabel(price.usdCents)}`:order?amountText:'—'}</Text></View></View>
 {product.kind==='access'?completionReward>0&&<Text style={{color:'#B9CFC4',fontSize:12,lineHeight:18}}>Clear all 12 verified missions: earn {completionReward} {SKR_LABEL} once, with either payment method.</Text>:!order&&<View style={{flexDirection:'row',justifyContent:'space-between'}}>{[-1,1].map(d=><Pressable key={d} accessibilityRole="button" accessibilityLabel={d<0?'Previous item':'Next item'} disabled={busy} onPress={()=>browse(d)} style={{minHeight:44,minWidth:90,justifyContent:'center'}}><Text style={{color:'#C7E4D8',textAlign:d<0?'left':'right',fontSize:12}}>{d<0?'‹ Previous':'Next ›'}</Text></Pressable>)}</View>}
 {!owned&&!order&&<View accessibilityRole="radiogroup" accessibilityLabel="Pay with" style={{flexDirection:'row',gap:8}}>{(['SKR','SOL'] as const).map(c=>{const option=prices?.options.find(p=>p.currency===c);return <Pressable key={c} accessibilityRole="radio" accessibilityState={{checked:currency===c,disabled:busy}} disabled={busy} onPress={()=>setCurrency(c)} style={{flex:1,padding:10,minHeight:64,borderRadius:14,borderWidth:1,borderColor:currency===c?'#B4F2D1':'#3A5050',backgroundColor:currency===c?'#244438':'#17282A'}}><Text style={{color:'#E3F7EC',fontWeight:'800',fontSize:13}}>{c==='SKR'?'◈  SKR':'◎  SOL'} {currency===c?'✓':''}</Text><Text style={{color:'#B9D0C5',fontSize:11,marginTop:4}}>{option?`${tokenAmount(option.amount,option.decimals)} · ≈ ${usdLabel(option.usdCents)}`:'Loading…'}</Text></Pressable>;})}</View>}
 {!owned&&order&&<Text style={{color:'#BED7CA',fontSize:12,textAlign:'center'}}>{amountText}{order.pricing?` · ≈ ${usdLabel(order.pricing.usdCents)}`:' · Previous quote'}</Text>}
 {!owned&&!order&&(!!priceError||stale)&&<Pressable accessibilityRole="button" onPress={()=>setRefreshPrice(n=>n+1)} style={{minHeight:32,justifyContent:'center'}}><Text style={{color:'#D8EADB',fontSize:11}}>{priceError||'Refresh to get the latest exchange rate.'}</Text></Pressable>}
 {!!message&&<Text accessibilityLiveRegion="polite" numberOfLines={3} style={{color:'#D8EADB',fontSize:12,lineHeight:17}}>{message}</Text>}
 {button(mainLabel,primary,!!owned&&(product.kind==='access'||equipped))}
 <Text style={{color:'#8FAEA3',fontSize:10,lineHeight:14,textAlign:'center'}}>{NETWORK_LABEL} · USD is an estimate · Network fee extra.</Text>
 <View style={{flexDirection:'row',justifyContent:'center',gap:18}}><Pressable disabled={busy} accessibilityRole="button" onLongPress={()=>void Share.share({message:walletReport()})} onPress={()=>action(restore)} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:'#BED7CA',fontSize:12}}>Restore purchases</Text></Pressable>
 {order?.signature&&<Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(transactionLink(order.signature!))} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:'#BED7CA',fontSize:12}}>Receipt ↗</Text></Pressable>}
 {order&&!order.payment&&!pending&&<Pressable disabled={busy} accessibilityRole="button" onPress={()=>void backToMethods()} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:'#BED7CA',fontSize:12}}>Change method</Text></Pressable>}</View>
 </View>;
}
