import React,{useState} from 'react';
import {View,Text} from 'react-native';
import Paywall from '../src/commerce/Paywall';
const {createRoot}=require('react-dom/client');
function Preview(){
 const [message,setMessage]=useState('Design preview · no payments');
 return <View style={{height:'100%'}}><Text style={{backgroundColor:'#D5E6DA',color:'#173329',textAlign:'center',fontSize:11,padding:5}}>{message}</Text><Paywall local onSkip={()=>setMessage('Skip opens the free campaign in the game.')} onBuy={()=>setMessage('The game opens the existing SKR / SOL checkout here.')}/></View>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
