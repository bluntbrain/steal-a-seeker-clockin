import React,{useEffect,useRef,useState} from 'react';
import {StyleSheet,Text,TextInput,View} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useHaptics} from '../feedback/useHaptics';
import {useAccount} from './account-context';
import {commerceApi} from './client';
import {PRODUCTS,type ProductId} from '../../shared/commerce';
import type {PromotionPreview} from '../../shared/promotions';
export type AppliedPromotion={code:string;offer:PromotionPreview};
export default function PromotionEntry({sku='campaign',disabled=false,onApply,onDiscount,onBusyChange,initialCode=''}:{sku?:ProductId;disabled?:boolean;onApply?:(p:AppliedPromotion|null)=>void;onDiscount?:(code:string)=>void;onBusyChange?:(busy:boolean)=>void;initialCode?:string}){
 const identity=useAccount(),haptic=useHaptics(),[open,setOpen]=useState(!!initialCode),[code,setCode]=useState(initialCode),[offer,setOffer]=useState<PromotionPreview>(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[claimed,setClaimed]=useState(false);
 const lock=useRef(false),alive=useRef(true),selected=useRef(identity.wallet);selected.current=identity.wallet;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{setClaimed(false);setError('');},[identity.wallet]);
 async function run(fn:()=>Promise<void>){if(lock.current||disabled)return;lock.current=true;setBusy(true);onBusyChange?.(true);setError('');try{await fn();}catch(e){if(alive.current)setError(e instanceof Error?e.message:'Could not apply this offer. Try again.');}finally{lock.current=false;if(alive.current){setBusy(false);onBusyChange?.(false);}}}
 useEffect(()=>{if(!initialCode)return;setCode(initialCode);setOpen(true);void run(async()=>{const result=await commerceApi.promotionPreview(initialCode.trim(),sku);if(!alive.current)return;setOffer(result);setClaimed(false);onApply?.({code:initialCode.trim(),offer:result});});},[initialCode,sku]);
 async function apply(){const result=await commerceApi.promotionPreview(code.trim(),sku);if(!alive.current)return;setOffer(result);setClaimed(false);onApply?.({code:code.trim(),offer:result});}
 async function claim(){
  if(identity.preview)throw Error('Install the Android app to claim with your wallet. This browser preview cannot grant real items.');
  if(!identity.wallet){await identity.connect();return;}
  const s=await identity.session();if(selected.current!==s.wallet)throw Error('Wallet changed. Apply the offer again.');
  // Untouched quotes can be cancelled locally; prepared payments must be reconciled, never overwritten.
  const orders=await commerceApi.orders(s.token),items=[sku,...(offer?.bonusSkus??[])];
  for(const o of orders.filter(o=>items.includes(o.sku)&&o.status==='quoted'&&!o.payment&&!o.signature))await commerceApi.cancel(s.token,o.id);
  const state=await commerceApi.claimPromotion(s.token,code.trim(),sku);
  if(selected.current!==s.wallet||!alive.current)return;await identity.update(state);setClaimed(true);haptic('confirm');
 }
 return <View style={styles.box} testID="promotion-entry"><Pressable accessibilityRole="button" accessibilityLabel="Have a promo code?" disabled={busy||disabled} onPress={()=>setOpen(v=>!v)} style={{minHeight:44,justifyContent:'center'}}><Text style={styles.title}>{open?'Community code':'Have a promo code?'} {open?'−':'+'}</Text></Pressable>{open&&<View style={{gap:10}}>
 <View style={{flexDirection:'row',gap:8}}><TextInput accessibilityLabel="Promo code" testID="promotion-code" autoCapitalize="characters" autoCorrect={false} maxLength={64} placeholder="Enter code" placeholderTextColor="#7F9D91" value={code} editable={!busy&&!disabled} onChangeText={v=>{setCode(v);setOffer(undefined);setClaimed(false);setError('');onApply?.(null);}} style={styles.input}/><Pressable accessibilityRole="button" disabled={busy||disabled||code.trim().length<4} onPress={()=>void run(apply)} style={[styles.apply,{opacity:(busy||disabled||code.trim().length<4)?0.5:1}]}><Text style={styles.dark}>{busy?'…':'Apply'}</Text></Pressable></View>
 {offer&&<View style={{gap:8}}><Text style={styles.title}>{offer.label}</Text><Text style={styles.copy}>{offer.percentOff}% off · {offer.percentOff===100?'Free': 'Discount applied at checkout'}</Text><Text style={styles.copy}>{[offer.sku,...offer.bonusSkus].map(id=>PRODUCTS.find(p=>p.id===id)?.name??id).join(' · ')}</Text><Text style={styles.small}>Redeem by {new Date(offer.expiresAt).toLocaleDateString()}. Unlocks stay with your wallet. One use per wallet.</Text>
 {offer.percentOff===100?<><Pressable accessibilityRole="button" disabled={busy||disabled||claimed} onPress={()=>void run(claim)} style={[styles.primary,{opacity:(busy||disabled)?0.6:1}]}><Text style={styles.dark}>{claimed?'Unlocked for your wallet':busy?'Please wait…':!identity.wallet?'Connect wallet to claim':offer.bonusSkus.length?'Claim free pass & skins':'Claim free Game Pass'}</Text></Pressable><Text accessibilityLiveRegion="polite" style={styles.small}>{claimed?'Game Pass is active. Find your skins in Hideout → Solana.':'Wallet sign-in only. No payment or network fee.'}</Text></>:onDiscount&&<Pressable accessibilityRole="button" onPress={()=>onDiscount(code.trim())} style={styles.primary}><Text style={styles.dark}>Continue to Game Pass checkout</Text></Pressable>}
 </View>}
 {!!error&&<Text accessibilityLiveRegion="polite" style={{color:'#FFD0B1',fontSize:12,lineHeight:18}}>{error}</Text>}
 </View>}</View>;
}
const styles=StyleSheet.create({box:{padding:14,borderWidth:1,borderColor:'#42665A',borderRadius:16,backgroundColor:'#11261E'},title:{color:'#D8F4E8',fontSize:14,fontWeight:'800'},copy:{color:'#C0D7CB',fontSize:12,lineHeight:18},small:{color:'#A2BDB0',fontSize:11,lineHeight:16},input:{flex:1,minWidth:0,minHeight:48,paddingHorizontal:12,borderWidth:1,borderColor:'#517669',borderRadius:10,color:'#F1FFF8',fontSize:16,backgroundColor:'#0A1812'},apply:{minWidth:70,minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:'#B6F0DF'},primary:{minHeight:50,padding:12,justifyContent:'center',alignItems:'center',borderRadius:12,backgroundColor:'#B6F0DF'},dark:{color:'#17382B',fontWeight:'800',fontSize:13,textAlign:'center'}});
