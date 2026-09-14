import React from 'react';
import {ImageBackground,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {CAMPAIGN_USD_CENTS,usdLabel} from '../../shared/pricing';
import {CAMPAIGN_OFFER} from '../../shared/economy';

type Props={local:boolean;stage:'offer'|'review'|'cancelled';trialAvailable:boolean;busy?:boolean;message?:string;onBuy:()=>void;onCancel:()=>void;onTrial:()=>void;onBack:()=>void};

export default function Paywall({local,stage,trialAvailable,busy,message,onBuy,onCancel,onTrial,onBack}:Props){
 const {height,fontScale}=useWindowDimensions();
 const compact=height<720, cancelled=stage==='cancelled', review=stage==='review';
 const currency=local?'test credits':'TEST SKR';
 // Normal phone layouts fit without scrolling. Large accessibility text and very
 // short landscape windows retain access to every term and control.
 const needsScroll=height<500||fontScale>1.2;
 const primaryLabel=cancelled?(trialAvailable?'Play free trial':'Back to campaign'):review?(local?`Confirm campaign · ${CAMPAIGN_OFFER.price} ${currency}`:'Review payment method'):local?`Buy campaign · ${CAMPAIGN_OFFER.price} playtest credits`:'Continue · $10 in SKR or SOL';
 const body=<View style={[s.card,needsScroll&&{minHeight:700}]}>
  <ImageBackground accessible accessibilityLabel="Game illustration: the courier escapes a guarded vault with a mint phone" source={require('../../assets/paywall-v3/courier-heist.png')} resizeMode={compact?'contain':'cover'} imageStyle={{width:'100%',height:'100%'}} style={[s.art,{maxHeight:cancelled?360:310,...(compact&&message?{display:'none' as const}:{})}]}>
   <View style={s.topline}><Text style={s.brand}>STEAL A SEEKER</Text><View style={s.testBadge}><Text style={s.testLabel}>{local?'LOCAL TEST':'DEVNET'}</Text></View></View>
   <View style={s.artCaption}><Text style={s.captionText}>THE GAME PASS</Text></View>
  </ImageBackground>
  <View style={[s.content,{paddingHorizontal:compact?20:24,gap:compact?8:15,paddingTop:compact?12:20}]}>
   <View><Text accessibilityRole="header" style={[s.title,{fontSize:compact?30:39,lineHeight:compact?32:41}]}>{cancelled?(trialAvailable?'One run.\nSee if you like it.':'Ready for\nanother heist?'):review?'Make it\nyour next heist.':'Your next\ngreat escape.'}</Text>
    <Text style={[s.subtitle,{marginTop:compact?5:8}]}>{cancelled?(trialAvailable?'Try the first mission before you buy.':'Your free attempt is used. The full campaign is still here.'):review?'Check your pass. Then start the first mission.':'All 12 missions, weekly competition and unlimited retries.'}</Text>
   </View>
   {cancelled?<View style={s.trialCard}><Text style={s.trialTitle}>{trialAvailable?'1 attempt. No payment required.':local?'Campaign pass · '+CAMPAIGN_OFFER.price+' '+currency:'Campaign pass · $10.00'}</Text><Text style={s.detail}>{trialAvailable?'Practice only: no saved progress, rank or rebate. Leaving or restarting ends the attempt.':'All 12 missions and unlimited retries. Buy once to keep playing.'}</Text></View>:<>
    <View style={s.benefits}>{[['12','missions'],['∞','retries'],['Weekly','competition']].map(([value,label],i)=><View key={label} style={[s.benefit,i>0&&s.benefitBorder]}><Text style={[s.stat,{fontSize:compact?18:22}]}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>)}</View>
    <View style={[s.pass,{padding:compact?13:17}]}><View style={s.passName}><Text style={s.passTitle}>Game pass</Text><Text style={s.passNote}>Pay once. No subscription.</Text></View><View style={s.priceBlock}><Text style={[s.price,{fontSize:compact?30:36}]}>{local?CAMPAIGN_OFFER.price:usdLabel(CAMPAIGN_USD_CENTS)}</Text><Text style={s.currency}>{local?currency:'PAY IN SKR OR SOL'}</Text></View></View>
    <View style={s.rebate}><Text style={s.rebateIcon}>↳</Text><View style={{flex:1}}><Text style={s.rebateTitle}>Clear all 12. Earn {CAMPAIGN_OFFER.rebate} {currency}.</Text><Text style={s.detail}>{local?`Pay ${CAMPAIGN_OFFER.price}; earn ${CAMPAIGN_OFFER.rebate} back once.`:'One TEST SKR reward after all 12 wins are verified, whether you pay in SKR or SOL.'}</Text></View></View>
   </>}
   {!!message&&<Text accessibilityLiveRegion="polite" style={s.error}>{message}</Text>}
   <View style={s.checkout}>
    <Text style={s.fineprint}>{local?'Browser credits only. No real money or wallet payments.':'Devnet test tokens only. USD is a market reference. Exact token amount and network fee shown before approval.'} Outfits sold separately.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={primaryLabel} accessibilityState={{disabled:!!busy,busy:!!busy}} disabled={busy} onPress={cancelled?(trialAvailable?onTrial:onBack):onBuy} style={({pressed})=>[s.primary,pressed&&{backgroundColor:'#9AE5C0',transform:[{scale:.985}]},busy&&{opacity:.55}]}><Text style={s.primaryText}>{busy?'Please wait…':cancelled?(trialAvailable?'Play one free run':'Back to campaign'):review?(local?`Confirm · ${CAMPAIGN_OFFER.price} ${currency}`:'Choose SKR or SOL'):local?`Unlock game · ${CAMPAIGN_OFFER.price} credits`:'Continue · $10 in SKR or SOL'}</Text><Text style={s.arrow}>{busy?'…':'→'}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={cancelled?'Back to campaign offer':review?'Cancel payment':'Not now'} onPress={cancelled?onBack:onCancel} disabled={busy} style={s.secondaryButton}><Text style={s.secondary}>{cancelled?'Back to campaign offer':review?'Cancel payment':'Not now'}</Text></Pressable>
   </View>
  </View>
 </View>;
 return <View style={s.page}>{needsScroll?<ScrollView style={{width:'100%'}} contentContainerStyle={{alignItems:'center'}}>{body}</ScrollView>:body}</View>;
}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#050E0D',alignItems:'center',justifyContent:'center'},
 card:{width:'100%',maxWidth:460,flex:1,maxHeight:900,backgroundColor:'#091917',overflow:'hidden'},
 art:{flex:1,minHeight:72,overflow:'hidden',backgroundColor:'#091917',justifyContent:'space-between'},
 topline:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20,paddingTop:16},
 brand:{color:'#E6F8EE',fontSize:10,letterSpacing:2,fontWeight:'900',textShadowColor:'#000',textShadowRadius:6},
 testBadge:{borderRadius:20,backgroundColor:'#091917CC',borderWidth:1,borderColor:'#86B4A36B',paddingVertical:5,paddingHorizontal:8},
 testLabel:{color:'#BEDBCF',fontSize:8,letterSpacing:1.2,fontWeight:'700'},
 artCaption:{alignSelf:'flex-start',margin:16,marginBottom:0,paddingHorizontal:9,paddingVertical:5,borderRadius:5,backgroundColor:'#091917DE'},
 captionText:{color:'#D1E7DD',fontWeight:'800',fontSize:8,letterSpacing:2},
 content:{paddingBottom:4,flexShrink:0,backgroundColor:'#091917'},
 title:{color:'#EFF6DF',fontWeight:'900',letterSpacing:-1.6},
 subtitle:{fontSize:12,lineHeight:17,color:'#ADCCC0'},
 benefits:{flexDirection:'row',paddingVertical:2},
 benefit:{flex:1,alignItems:'center',gap:2},
 benefitBorder:{borderLeftWidth:1,borderLeftColor:'#264039'},
 stat:{fontWeight:'800',color:'#DCF3E6'},statLabel:{fontSize:11,color:'#A7C3B7'},
 pass:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,backgroundColor:'#E9F0D9',borderRadius:17},
 passName:{flex:1},passTitle:{color:'#172D25',fontWeight:'800',fontSize:16},passNote:{color:'#4C6658',fontSize:10,lineHeight:15,marginTop:4},
 priceBlock:{alignItems:'flex-end'},price:{color:'#15352A',fontWeight:'900',letterSpacing:-1,lineHeight:36},currency:{color:'#425F51',fontSize:10,fontWeight:'600'},
 rebate:{flexDirection:'row',gap:10,alignItems:'flex-start'},rebateIcon:{color:'#AADABB',fontSize:24,lineHeight:23},
 rebateTitle:{color:'#D2E8D5',fontSize:12,fontWeight:'700',lineHeight:17},detail:{color:'#A3BDB1',fontSize:10,lineHeight:15,marginTop:3},
 fineprint:{color:'#9CB9AC',fontSize:10,lineHeight:14,textAlign:'center'},
 checkout:{gap:8},primary:{minHeight:52,backgroundColor:'#C4F7DC',borderRadius:15,paddingHorizontal:18,paddingVertical:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,borderBottomWidth:3,borderBottomColor:'#7FB69A'},
 primaryText:{fontSize:14,fontWeight:'800',color:'#133229',flexShrink:1},arrow:{color:'#173E2D',fontSize:23,lineHeight:23},
 secondaryButton:{minHeight:44,justifyContent:'center',alignItems:'center'},secondary:{color:'#AFCCBD',fontSize:12},
 trialCard:{padding:17,backgroundColor:'#142D26',borderWidth:1,borderColor:'#315443',borderRadius:15},trialTitle:{color:'#DEF2D7',fontSize:14,fontWeight:'700'},
 error:{color:'#FFCBAC',fontSize:11,lineHeight:15,padding:8,borderRadius:8,backgroundColor:'#3D241C'}
});
