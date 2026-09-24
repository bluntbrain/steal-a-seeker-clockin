import {welcomeOffer} from './welcome-offer';
import React,{useEffect,useState} from 'react';
import {ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import PaywallVideo from './PaywallVideo';
import BrandWordmark from '../components/BrandWordmark';
import {commerceApi} from './client';
import {usdLabel} from '../../shared/pricing';

type Props={local:boolean;mediaActive?:boolean;onBuy:()=>void;onSkip:()=>void};
/** Optional weekly offer. No wallet connection, order or entitlement is created here. */
export default function Paywall({local,mediaActive=true,onBuy,onSkip}:Props){
 const {height,fontScale}=useWindowDimensions(),compact=height<720;
 const [price,setPrice]=useState<{skr:number;usdCents:number;test:boolean}>();
 useEffect(()=>{let active=true;void commerceApi.catalog().then(c=>{const p=c.products.find(p=>p.id==='campaign');if(active&&p?.skrPrice&&p.usdCents)setPrice({skr:Number(p.skrPrice),usdCents:p.usdCents,test:!!c.testPricing});}).catch(()=>{});return()=>{active=false;};},[local]);
 const offer=price?welcomeOffer(price.skr,price.usdCents):null;
 const scroll=height<680||fontScale>1.2;
 const body=<View style={[s.card,scroll&&{minHeight:690}]}>
  <View style={[s.art,{minHeight:compact?140:200}]}>
   <PaywallVideo active={mediaActive}/>
   <View style={s.top}><BrandWordmark/><Pressable accessibilityRole="button" accessibilityLabel="Skip Game Pass and play free" onPress={onSkip} style={s.skip}><Text style={s.skipText}>Skip ›</Text></Pressable></View>
   <View pointerEvents="none" style={s.caption}><Text style={s.captionText}>CONCEPT TRAILER</Text></View>
  </View>
  <View style={[s.content,{gap:compact?12:18}]}>
   <Text style={s.eyebrow}>WELCOME OFFER · GAME PASS</Text>
   <View><Text accessibilityRole="header" style={[s.title,{fontSize:compact?32:39,lineHeight:compact?35:42}]}>Your next heist.{'\n'}Your name on top.</Text><Text style={s.subtitle}>Get the Game Pass. Make every escape count.</Text></View>
   <View style={s.stats}>{[['3','weekly missions'],['5','chances each'],['1','best run counts*']].map(([value,label],i)=><View key={value} style={[s.stat,i>0&&s.divider]}><Text style={s.number}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>)}</View>
   <View style={s.pass}><View style={{flex:1}}><Text style={s.passTitle}>Game Pass</Text><Text style={s.passNote}>Buy once · Compete every week</Text></View><View style={{alignItems:'flex-end'}}>{offer&&<><Text style={[s.passNote,{fontSize:9}]}>Planned regular price</Text><Text accessibilityLabel={`Planned regular price: ${offer.plannedSkr} SKR or ${usdLabel(offer.plannedUsdCents)} in SOL`} style={[s.passNote,{textDecorationLine:'line-through'}]}>{offer.plannedSkr} SKR / {usdLabel(offer.plannedUsdCents)}</Text></>}<Text style={s.price}>{offer?`${offer.skr} SKR`:'SKR / SOL'}</Text><Text style={s.passNote}>{offer?`or ≈ ${usdLabel(offer.usdCents)} in SOL`:'Live price at checkout'}</Text></View></View>
   <Text style={s.detail}>*Your best escape on each mission adds to your rank. New missions every Monday. Clear all three to earn an outfit.</Text>
   <View style={{gap:8}}><Pressable accessibilityRole="button" onPress={onBuy} style={s.primary}><Text style={s.primaryText}>{local?'Preview Game Pass':'Get Game Pass'}  →</Text></Pressable><Text style={s.free}>All 12 campaign missions are free. Skip to play.</Text><Text style={s.fine}>{local?'Browser demo · No real payment':`${price?.test?'Test price · ':''}Pay in SKR or SOL · Network fee extra`}{'\n'}Weekly token prizes are not active.</Text></View>
  </View>
 </View>;
 return <View style={s.page}>{scroll?<ScrollView contentContainerStyle={{alignItems:'center'}} style={{width:'100%'}}>{body}</ScrollView>:body}</View>;
}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#071311',alignItems:'center'},card:{flex:1,width:'100%',maxWidth:480,maxHeight:1000,backgroundColor:'#091917'},
 art:{flex:1,maxHeight:390,overflow:'hidden',backgroundColor:'#142A25'},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingLeft:20,paddingRight:10,paddingTop:8},skip:{minWidth:58,minHeight:44,justifyContent:'center',alignItems:'center',backgroundColor:'#091917DD',borderRadius:22},skipText:{fontSize:12,color:'#E0EDE6',fontWeight:'700'},caption:{position:'absolute',left:18,bottom:14,backgroundColor:'#091917CC',padding:6,borderRadius:5},captionText:{color:'#C6D9D2',fontSize:8,letterSpacing:1.4},
 content:{padding:22,paddingTop:20},eyebrow:{color:'#A7DBC6',fontSize:10,fontWeight:'800',letterSpacing:2},title:{color:'#F0F6E8',fontWeight:'900',letterSpacing:-1.3},subtitle:{color:'#ADC5BA',fontSize:12,lineHeight:18,marginTop:8},stats:{flexDirection:'row',paddingVertical:4},stat:{flex:1,alignItems:'center',gap:4},divider:{borderLeftWidth:1,borderLeftColor:'#345044'},number:{fontSize:28,fontWeight:'900',color:'#D9F3E4'},statLabel:{fontSize:10,color:'#ADC5BA'},pass:{padding:16,backgroundColor:'#E6EFD7',borderRadius:17,flexDirection:'row',alignItems:'center',gap:8},passTitle:{color:'#173A2C',fontSize:17,fontWeight:'800'},passNote:{color:'#4C6658',fontSize:10,lineHeight:15,marginTop:3},price:{color:'#173A2C',fontSize:21,fontWeight:'900'},detail:{color:'#A5BFB2',fontSize:11,lineHeight:17},primary:{minHeight:54,backgroundColor:'#C4F7DC',borderRadius:16,alignItems:'center',justifyContent:'center'},primaryText:{color:'#173A2C',fontSize:16,fontWeight:'900'},free:{color:'#D9E7DE',fontSize:11,lineHeight:17,textAlign:'center'},fine:{color:'#92AEA0',fontSize:10,lineHeight:15,textAlign:'center'}
});
