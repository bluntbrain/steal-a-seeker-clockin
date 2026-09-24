import React from 'react';
import {Text,View,useWindowDimensions} from 'react-native';
import {costumeFor} from '../../shared/costumes';
import {CharacterStage} from '../components/SkinVisuals';
/** Existing portraits, with light and framing from the supplied UI reference. */
export default function SkinPurchaseHero({sku,balance}:{sku:string;balance?:number}){
 const look=costumeFor(sku),{height}=useWindowDimensions();
 return <View style={{gap:8}}>
  <CharacterStage sku={sku} height={Math.max(235,Math.min(325,height*.37))}/>
  <Text style={{color:'#F5F3E8',fontSize:29,lineHeight:35,fontWeight:'800',textAlign:'center'}}>{look.name} skin</Text>
  <Text style={{color:'#B1BABD',fontSize:13,lineHeight:20,textAlign:'center'}}>Permanent cosmetic · Same stats</Text>
  {balance!==undefined&&<View style={{borderTopWidth:1,borderColor:'#34473C',paddingTop:12,marginTop:6,marginBottom:6}}><Text style={{color:'#AEB8B3',fontSize:12,lineHeight:18,textAlign:'center'}}>Your {balance.toLocaleString()} credits stay in your stash.</Text></View>}
 </View>;
}
