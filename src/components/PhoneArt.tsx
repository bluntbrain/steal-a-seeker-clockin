import React from 'react';
import {Image,View} from 'react-native';
// Each source cell is 256 × 512; inset crops remove unused atlas margins.
export default function PhoneArt({index,height=90,dim=false}:{index:number;height?:number;dim?:boolean}){
 const scale=height/405;
 return <View testID={`phone-edition-${index}`} style={{width:208*scale,height,overflow:'hidden',opacity:dim?.2:1,borderRadius:5}}><Image source={require('../../assets/world-v3/phones.png')} resizeMode="stretch" style={{position:'absolute',width:1536*scale,height:1024*scale,left:-((index%6)*256+32)*scale,top:-(Math.floor(index/6)*512+55)*scale}} accessible={false}/></View>;
}
