import React from 'react';
import {Image,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';

const layers={mint:require('../../assets/leaderboard-v3/card-mint.webp'),row:require('../../assets/leaderboard-v3/row-dark.webp'),gold:require('../../assets/leaderboard-v3/row-gold.webp'),button:require('../../assets/leaderboard-v3/button-mint.webp'),glow:require('../../assets/leaderboard-v3/header-glow.webp')};
/** Baked lighting only; names, ranks and controls always remain native UI. */
export function LeagueSurface({kind='mint'}:{kind?:keyof typeof layers}){
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image accessible={false} source={layers[kind]} resizeMode="stretch" style={{width:'100%',height:'100%'}}/></View>;
}
export function RankMedal({rank}:{rank:number}){
 if(rank<1||rank>3)return null;
 return <View pointerEvents="none" style={s.medal}><Image accessible={false} source={rank===1?require('../../assets/leaderboard-v3/crown.webp'):rank===2?require('../../assets/leaderboard-v3/silver.webp'):require('../../assets/leaderboard-v3/bronze.webp')} style={{width:rank===1?23:22,height:rank===1?23:27}}/>{rank>1&&<Text style={[s.medalNumber,{color:rank===2?'#3F524B':'#694128'}]}>{rank}</Text>}</View>;
}
const s=StyleSheet.create({
 header:{minHeight:147,paddingTop:16,paddingHorizontal:6,justifyContent:'space-between',overflow:'hidden'},
 hero:{position:'absolute',right:0,top:5,width:146,height:142,overflow:'hidden'},heroImage:{width:'100%',height:166},
 headingCopy:{alignItems:'flex-start',zIndex:1},title:{fontSize:29,lineHeight:35,fontWeight:'900',color:'#F4F3E9',letterSpacing:-.8},resetButton:{minHeight:36,justifyContent:'center'},reset:{color:'#E2F4EA',fontSize:15,fontWeight:'700',fontVariant:['tabular-nums']},refresh:{fontSize:14,color:'#94B1A3'},resetNote:{color:'#A5B9B0',fontSize:11,lineHeight:16},
 headerBottom:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:4,marginTop:11,minHeight:38},mode:{flex:1,fontSize:8,lineHeight:12,letterSpacing:.7,fontWeight:'700',color:'#8FAD9D'},help:{flexDirection:'row',alignItems:'center',gap:6,borderWidth:1,borderColor:'#536D60',backgroundColor:'#0C1814E8',borderRadius:20,minHeight:36,paddingHorizontal:10},helpIcon:{width:17,height:17,borderRadius:9,backgroundColor:'#A6B9B0',color:'#19352A',fontSize:13,lineHeight:17,textAlign:'center',fontWeight:'900'},helpText:{fontSize:12,color:'#C3D2CB'},
 playDock:{flexShrink:0,paddingTop:9,paddingBottom:2},play:{minHeight:50,borderRadius:12,borderWidth:1,borderColor:'#C8F7E8',overflow:'hidden',justifyContent:'center',alignItems:'center',padding:12},playText:{fontSize:17,fontWeight:'800',color:'#062A1D',textAlign:'center'},medal:{width:25,height:29,alignItems:'center',justifyContent:'center'},medalNumber:{position:'absolute',top:11,fontSize:9,fontWeight:'900'},
});
