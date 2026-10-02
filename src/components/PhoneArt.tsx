import React from 'react';
import {Image,View} from 'react-native';
import atlas from '../../assets/world-v3/phones.frames.json';
// Measured bounds include the complete silhouette, buttons and breathing room.
export default function PhoneArt({index,height=90,dim=false}:{index:number;height?:number;dim?:boolean}){
 const f=atlas.frames[index]??atlas.frames[0]!,scale=height/f.height;
 return <View testID={`phone-edition-${index}`} style={{width:f.width*scale,height,overflow:'hidden',opacity:dim?.2:1,borderRadius:3}}><Image source={require('../../assets/world-v3/phones.webp')} resizeMode="stretch" style={{position:'absolute',width:atlas.width*scale,height:atlas.height*scale,left:-f.x*scale,top:-f.y*scale}} accessible={false}/></View>;
}
