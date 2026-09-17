import React from 'react';
import {Image} from 'react-native';
import {costumePortrait} from './costumeAssets';
import {costumeFor} from '../../shared/costumes';
export default function CourierArt({height=80,outfit}:{height?:number;outfit?:string}){
 return <Image accessibilityLabel={`${costumeFor(outfit).name} courier`} source={costumePortrait(outfit)} resizeMode="contain" style={{height,width:height*2/3}}/>;
}
