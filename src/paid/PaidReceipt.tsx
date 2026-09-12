import React from 'react';
import {Linking,Pressable,Text,View} from 'react-native';
import type {PaidEntry} from '../../shared/paid';
import {tokenAmount} from '../../shared/commerce';
import {transactionLink} from '../wallet/config';
export default function PaidReceipt({entry}:{entry:PaidEntry}){
 const link=(label:string,signature:string)=><Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(transactionLink(signature))} style={{paddingVertical:9}}><Text style={{color:'#bce7d2',fontSize:12}}>{label} ↗</Text></Pressable>;
 return <View style={{gap:7}}><Text accessibilityLiveRegion="polite" style={{color:'#d8e9df',lineHeight:20}}>{entry.detail??entry.status}</Text>
  <Text selectable style={{color:'#91ac9d',fontSize:10}}>Entry: {entry.id}</Text>
  {entry.quote.signature&&link('Entry payment · devnet explorer',entry.quote.signature)}
  {entry.return&&<><Text style={{color:'#d8e9df',fontWeight:'700'}}>{entry.return.outcome==='refund'?'Refund':'Gross return'}: {tokenAmount(entry.return.amount,entry.return.decimals)} TEST SKR · {entry.return.state}</Text>{entry.return.detail&&<Text style={{color:'#abc8b6',fontSize:12}}>{entry.return.detail}</Text>}{entry.return.receipt&&link('Finalized return · devnet explorer',entry.return.receipt.signature)}</>}
 </View>;
}
