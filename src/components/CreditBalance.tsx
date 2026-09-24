import {useHaptics} from '../feedback/useHaptics';
import React from 'react';
import {useEconomy} from '../commerce/EconomyProvider';
import CreditChip from './CreditChip';
export default function CreditBalance({onPress,readOnly=false}:{onPress?:()=>void;readOnly?:boolean}){
 const e=useEconomy(),haptic=useHaptics();
 return <CreditChip balance={e.balance} ready={e.ready} onPress={readOnly?undefined:()=>{haptic('select');(onPress??e.openCredits)();}}/>;
}
