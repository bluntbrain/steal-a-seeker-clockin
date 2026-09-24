import React from 'react';
import {Image} from 'react-native';
export default function CreditIcon({size=16}:{size?:number}){return <Image accessible={false} source={require('../../assets/skin-ui/credit.png')} style={{width:size,height:size}}/>;}
