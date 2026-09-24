import React from 'react';
import {Image,StyleSheet,Text,View} from 'react-native';

/** One wordmark for every screen that displays the game title. */
export default function BrandWordmark({accessibilityLabel='Steal a Seeker'}:{accessibilityLabel?:string}){
 return <View accessible accessibilityRole="header" accessibilityLabel={accessibilityLabel} style={s.root}>
  <View style={s.firstLine}><Text allowFontScaling={false} style={s.text}>STEAL</Text><Image accessible={false} source={require('../../assets/skin-ui/mask.png')} style={s.icon}/></View>
  <Text allowFontScaling={false} style={s.text}>A SEEKER</Text>
 </View>;
}
const s=StyleSheet.create({
 root:{flexShrink:0},
 firstLine:{flexDirection:'row',alignItems:'center',gap:6},
 text:{fontSize:20,lineHeight:22,color:'#F4F3E9',fontWeight:'900'},
 icon:{width:27,height:18},
});
