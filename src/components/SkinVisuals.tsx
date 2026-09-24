import React from 'react';
import {Image,StyleSheet,Text,View} from 'react-native';
import {costumePortrait} from './costumeAssets';
import {costumeFor} from '../../shared/costumes';
export {default as CreditCoin} from './CreditIcon';
export function SkinGlow({floor=false}:{floor?:boolean}){return <Image accessible={false} source={floor?require('../../assets/skin-ui/floor-glow.png'):require('../../assets/skin-ui/glow.png')} resizeMode="stretch" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]}/>;}
export function CharacterStage({sku,height,badges=false,equipped=false}:{sku:string;height:number;badges?:boolean;equipped?:boolean}){
 const look=costumeFor(sku);
 return <View testID="outfit-preview-stage" style={{height,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
  <View pointerEvents="none" style={{position:'absolute',width:'110%',height:'115%',top:'-15%'}}><SkinGlow/></View>
  <View pointerEvents="none" style={{position:'absolute',width:'84%',height:height*.16,bottom:height*.04}}><SkinGlow floor/></View>
  <Image source={costumePortrait(sku)} accessibilityLabel={`${look.name} skin preview`} resizeMode="contain" style={{height:height*.96,width:height*.68,marginBottom:4}}/>
  {badges&&<View pointerEvents="none" style={{position:'absolute',left:12,right:12,bottom:14,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'}}>
   <View style={{gap:4}}><Image source={require('../../assets/skin-ui/crown.png')} style={{width:18,height:18}}/><Text style={s.badge}>{equipped?'EQUIPPED':'PREMIUM'}{'\n'}{equipped?'SKIN':'COSMETIC'}</Text></View>
   <View style={{gap:4,alignItems:'flex-end'}}><Image source={require('../../assets/skin-ui/stats.png')} style={{width:18,height:18}}/><Text style={[s.badge,{textAlign:'right'}]}>SAME{'\n'}STATS</Text></View>
  </View>}
 </View>;
}
const s=StyleSheet.create({badge:{fontSize:9,lineHeight:12,letterSpacing:1.1,fontWeight:'700',color:'#B8E6D7'}});
