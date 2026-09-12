import React,{useEffect,useState} from 'react';
import {Modal,Pressable,Text,View,useWindowDimensions} from 'react-native';
import {useGameAudio as useAudioPlayer} from '../audio/useGameAudio';
import {Button,ui} from '../playtest/Panel';
import {changePlaytest,equip,purchase,usePlaytest} from '../playtest/store';
import {PRODUCTS} from '../../shared/commerce';
import {courierPalette} from '../commerce/appearance';
import CourierArt from '../components/CourierArt';
import {useSettings} from '../settings/SettingsProvider';
const items=PRODUCTS.filter(p=>p.kind!=='access');
export default function WalletPanel({visible,onClose}:{visible:boolean;onClose:()=>void}){
 const state=usePlaytest(),[index,setIndex]=useState(0),[confirm,setConfirm]=useState(false),[error,setError]=useState(''),{height}=useWindowDimensions(),{settings}=useSettings(),audio=useAudioPlayer(require('../../assets/audio/purchase.wav'));
 const p=items[index]!,owned=state.owned.includes(p.id),equipped=state.equipment[p.kind]===p.id,palette=courierPalette(p.id);
 useEffect(()=>{if(!visible){audio.pause();setConfirm(false);}},[visible]);
 function next(n:number){setIndex((index+n+items.length)%items.length);setConfirm(false);setError('');}
 function act(){try{if(!owned&&!confirm){setConfirm(true);return;}changePlaytest(s=>owned?equip(s,p.id):purchase(s,p.id));setConfirm(false);if(settings.sound){audio.volume=settings.volume*.6;void audio.seekTo(0).then(()=>audio.play());}setError(owned?'Equipped. Same stats, new look.':'Purchased. Equip it when you’re ready.');}catch(e){setError(String(e));}}
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#000A',alignItems:'center',justifyContent:'center',padding:16}}><View style={{width:'100%',maxWidth:420,backgroundColor:'#101C23',borderWidth:1,borderColor:'#3A515D',padding:20,borderRadius:24,gap:height<700?10:16}}>
 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={[ui.title,{fontSize:26}]}>Wardrobe</Text><Pressable accessibilityRole="button" accessibilityLabel="Close Shop & wardrobe" onPress={onClose}><Text style={{color:'#C5EADC',fontSize:20,padding:5}}>✕</Text></Pressable></View><Text style={ui.label}>{state.balance} LOCAL TEST CREDITS · {index+1} / {items.length}</Text>
 <View style={{height:height<700?120:190,borderRadius:18,backgroundColor:palette.dark,borderColor:palette.mint,borderWidth:1,justifyContent:'center',alignItems:'center'}}>{p.kind==='outfit'?<CourierArt height={height<700?98:155} outfit={p.id}/>:<Text style={{fontSize:65,color:palette.mint}}>{p.kind==='trail'?'···↗':p.kind==='frame'?'▣':'▤'}</Text>}<Text style={[ui.label,{color:palette.cream,position:'absolute',bottom:7,right:10}]}>{equipped?'EQUIPPED':owned?'OWNED':p.kind.toUpperCase()}</Text></View>
 <View style={{flexDirection:'row',gap:10,justifyContent:'space-between',alignItems:'center'}}><Button label="Previous item" onPress={()=>next(-1)}/><Text style={[ui.title,{fontSize:18,flex:1,textAlign:'center'}]}>{p.name}</Text><Button label="Next item" onPress={()=>next(1)}/></View>
 <Text style={ui.body}>{p.description}</Text><Text style={{color:'#D5F5E0',fontWeight:'800',fontSize:17}}>{owned?'Yours to keep':`${p.price} test credits · one purchase`}</Text>
 {confirm&&<Text accessibilityLiveRegion="polite" style={ui.body}>Confirm {p.price} credits for {p.name}? Balance after purchase: {state.balance-p.price}. No real tokens move.</Text>}
 <Button label={equipped?`${p.name} equipped`:owned?`Equip ${p.name}`:confirm?`Confirm ${p.name} · ${p.price} credits`:`Buy ${p.name} · ${p.price} credits`} disabled={equipped} onPress={act}/>
 {confirm?<Button label="Cancel outfit purchase" onPress={()=>setConfirm(false)}/>:<Pressable accessibilityRole="button" accessibilityLabel="Wear original courier" onPress={()=>{changePlaytest(s=>({...s,equipment:{...s.equipment,outfit:''}}));setError('Original courier equipped.');}}><Text style={{color:'#C5DCD9',textAlign:'center',padding:5,fontSize:11}}>Wear original courier</Text></Pressable>}
 {!!error&&<Text accessibilityLiveRegion="polite" style={{color:'#B8EFD5',fontSize:11,lineHeight:16}}>{error}</Text>}<Text style={{color:'#839DA8',fontSize:10,lineHeight:15}}>Cosmetic only. No NFTs, speed boosts, or score bonuses. Your campaign already includes every mission and retry.</Text>
 </View></View></Modal>;
}
