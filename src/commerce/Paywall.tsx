import PromotionEntry from './PromotionEntry';
import {welcomeOffer} from './welcome-offer';
import React,{useEffect,useState} from 'react';
import {ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import PaywallVideo from './PaywallVideo';
import BrandWordmark from '../components/BrandWordmark';
import {commerceApi} from './client';
import {usdLabel} from '../../shared/pricing';

type Props={local:boolean;onCode?:(code:string)=>void;mediaActive?:boolean;onBuy:()=>void;onSkip:()=>void};
/** Optional pass offer. Purchases open checkout; community codes may connect a wallet and grant a free offer. */
export default function Paywall({local,mediaActive=true,onBuy,onSkip,onCode}:Props){
 const {height,fontScale}=useWindowDimensions(),compact=height<720;
 const [price,setPrice]=useState<{skr:number;usdCents:number;test:boolean}>(),[rebate,setRebate]=useState(0);
 useEffect(()=>{let active=true;void commerceApi.catalog().then(c=>{const p=c.products.find(p=>p.id==='campaign');if(active&&p?.skrPrice&&p.usdCents)setPrice({skr:Number(p.skrPrice),usdCents:p.usdCents,test:!!c.testPricing});}).catch(()=>{});
  // the completion rebate is a server offer; the screen promises it only when the live offer carries one
  void commerceApi.pricing('campaign').then(p=>{if(active)setRebate(p.campaignOffer?.rebateSkr??0);}).catch(()=>{});return()=>{active=false;};},[local]);
 const offer=price?welcomeOffer(price.skr,price.usdCents):null;
 // the primary action lives in a pinned footer so it is visible on landing; the offer above it scrolls
 const body=<View style={s.card}>
  <ScrollView keyboardShouldPersistTaps="handled" style={{flex:1}} contentContainerStyle={{flexGrow:1}}>
  <View style={[s.art,{minHeight:compact?140:200}]}>
   <PaywallVideo active={mediaActive}/>
   {/* the trailer sits behind a dark wash so the centred wordmark and the offer below read first */}
   <View pointerEvents="none" style={s.wash}/>
   <View pointerEvents="none" style={s.brand}><BrandWordmark/></View>
   <View style={s.top}><Pressable accessibilityRole="button" accessibilityLabel="Skip Game Pass and play free" onPress={onSkip} style={s.skip}><Text style={s.skipText}>Skip ›</Text></Pressable></View>
   <View pointerEvents="none" style={s.caption}><Text style={s.captionText}>CONCEPT TRAILER</Text></View>
  </View>
  <View style={[s.content,{gap:compact?12:18}]}>
   <Text style={s.eyebrow}>WELCOME OFFER · GAME PASS</Text>
   <View><Text accessibilityRole="header" style={[s.title,{fontSize:compact?28:34,lineHeight:compact?31:37}]}>Gear up before{'\n'}the first heist.</Text><Text style={s.subtitle}>One purchase. Everything below is yours to keep.</Text></View>
   <View style={s.perks}>{[
    ['3,500 credits','Spend them on outfits in the hideout.'],
    ['Ghost Signal outfit','Only comes with the pass. Never sold for credits.'],
    ...(rebate>0?[[`${rebate} SKR back after 12 heists*`,'The rebate returns to your wallet when you clear the first 12 heists.']]:[]),
    ['Yours for good','No subscription. Buy once, keep every perk on this wallet.'],
   ].map(([head,body])=><View key={head} style={s.perk}><View style={s.bullet}><Text style={s.bulletText}>✓</Text></View><View style={{flex:1}}><Text style={s.perkHead}>{head}</Text><Text style={s.perkBody}>{body}</Text></View></View>)}</View>
   <View style={s.pass}><View style={{flex:1}}><Text style={s.passTitle}>Game Pass</Text><Text style={s.passNote}>Buy once · Keep every perk</Text></View><View style={{alignItems:'flex-end'}}>{offer&&<><Text style={[s.passNote,{fontSize:9}]}>Planned regular price</Text><Text accessibilityLabel={`Planned regular price: ${offer.plannedSkr} SKR or ${usdLabel(offer.plannedUsdCents)} in SOL`} style={[s.passNote,{textDecorationLine:'line-through'}]}>{offer.plannedSkr} SKR / {usdLabel(offer.plannedUsdCents)}</Text></>}<Text style={s.price}>{offer?`${offer.skr} SKR`:'SKR / SOL'}</Text><Text style={s.passNote}>{offer?`or ≈ ${usdLabel(offer.usdCents)} in SOL`:'Live price at checkout'}</Text></View></View>
   <PromotionEntry onDiscount={onCode}/>
   <Text style={s.detail}>{rebate>0?`*Clear the first 12 heists and ${rebate} SKR comes back to your wallet. `:''}Credits and the outfit are granted to the paying wallet once payment is confirmed.</Text>
  </View>
  </ScrollView>
  <View testID="paywall-footer" style={[s.footer,{gap:compact?6:8}]}><Pressable accessibilityRole="button" onPress={onBuy} style={s.primary}><Text style={s.primaryText}>{local?'Preview Game Pass':'Get Game Pass'}  →</Text></Pressable><Text style={s.free}>The whole campaign is free. Skip to play.</Text><Text style={s.fine}>{local?'Browser demo · No real payment':`${price?.test?'Test price · ':''}Pay in SKR or SOL · Network fee extra`}</Text></View>
 </View>;
 return <View style={s.page}>{body}</View>;
}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#071311',alignItems:'center'},card:{flex:1,width:'100%',maxWidth:480,backgroundColor:'#091917'},
 art:{flex:1,maxHeight:390,overflow:'hidden',backgroundColor:'#142A25'},top:{flexDirection:'row',justifyContent:'flex-end',alignItems:'center',paddingLeft:20,paddingRight:10,paddingTop:8},skip:{minWidth:58,minHeight:44,justifyContent:'center',alignItems:'center',backgroundColor:'#091917DD',borderRadius:22},skipText:{fontSize:12,color:'#E0EDE6',fontWeight:'700'},wash:{...StyleSheet.absoluteFillObject,backgroundColor:'#040C0A99'},brand:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center',transform:[{scale:1.5}]},perks:{gap:12},perk:{flexDirection:'row',gap:12,alignItems:'flex-start'},bullet:{width:22,height:22,borderRadius:11,backgroundColor:'#C4F7DC',alignItems:'center',justifyContent:'center',marginTop:1},bulletText:{color:'#173A2C',fontSize:12,fontWeight:'900'},perkHead:{color:'#E6F4EC',fontSize:14,fontWeight:'800'},perkBody:{color:'#A5BFB2',fontSize:11,lineHeight:16,marginTop:2},caption:{position:'absolute',left:18,bottom:14,backgroundColor:'#091917CC',padding:6,borderRadius:5},captionText:{color:'#C6D9D2',fontSize:8,letterSpacing:1.4},
 content:{padding:22,paddingTop:20,paddingBottom:14},footer:{paddingHorizontal:22,paddingTop:12,paddingBottom:10,borderTopWidth:1,borderTopColor:'#1C352C',backgroundColor:'#091917'},eyebrow:{color:'#A7DBC6',fontSize:10,fontWeight:'800',letterSpacing:2},title:{color:'#F0F6E8',fontWeight:'900',letterSpacing:-1.3},subtitle:{color:'#ADC5BA',fontSize:12,lineHeight:18,marginTop:8},pass:{padding:16,backgroundColor:'#E6EFD7',borderRadius:17,flexDirection:'row',alignItems:'center',gap:8},passTitle:{color:'#173A2C',fontSize:17,fontWeight:'800'},passNote:{color:'#4C6658',fontSize:10,lineHeight:15,marginTop:3},price:{color:'#173A2C',fontSize:21,fontWeight:'900'},detail:{color:'#A5BFB2',fontSize:11,lineHeight:17},primary:{minHeight:54,backgroundColor:'#C4F7DC',borderRadius:16,alignItems:'center',justifyContent:'center'},primaryText:{color:'#173A2C',fontSize:16,fontWeight:'900'},free:{color:'#D9E7DE',fontSize:11,lineHeight:17,textAlign:'center'},fine:{color:'#92AEA0',fontSize:10,lineHeight:15,textAlign:'center'}
});
