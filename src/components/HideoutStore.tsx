import React,{useEffect,useRef,useState} from 'react';
import {Animated,Image,Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {useEconomy} from '../commerce/EconomyProvider';
import {creditReward,type StoreItemId} from '../../shared/store';
import {COSTUMES,costumeFor,type CostumeId} from '../../shared/costumes';
import {CAMPAIGN_IDS} from '../game/level';
import {PHONE_EDITIONS} from '../game/collection';
import type {Progress} from '../progress/model';
import CourierArt from './CourierArt';
import PhoneArt from './PhoneArt';
import {costumePortrait} from './costumeAssets';

function TrailPreview({outfit}:{outfit?:string}){
 const motion=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const loop=Animated.loop(Animated.sequence([Animated.timing(motion,{toValue:1,duration:1300,useNativeDriver:true}),Animated.timing(motion,{toValue:0,duration:0,useNativeDriver:true})]));loop.start();return()=>loop.stop();},[motion]);
 return <View accessibilityLabel="Escape trail preview: mint light behind a courier carrying a phone" style={{height:180,width:'100%',alignItems:'center',justifyContent:'center'}}><View style={{position:'absolute',height:1,left:20,right:20,top:149,backgroundColor:'#34554C'}}/><Animated.View style={{flexDirection:'row',alignItems:'flex-end',transform:[{translateX:motion.interpolate({inputRange:[0,1],outputRange:[-45,45]})}]}}><View style={{width:85,gap:5,marginBottom:18,opacity:.75}}><View style={{height:4,backgroundColor:'#CFE6E4',borderRadius:2}}/><View style={{height:2,width:55,backgroundColor:'#8CCDBE',borderRadius:2}}/></View><CourierArt height={130} outfit={outfit}/><View style={{width:13,height:23,borderRadius:3,borderWidth:2,borderColor:'#D7EFE8',backgroundColor:'#315E56',marginBottom:40,marginLeft:-18}}/></Animated.View></View>;
}

type Props={progress:Progress;onInspect:(i:number)=>void;ghostEarned:boolean;onEquipGhost:()=>Promise<void>;onOpenWeekly:()=>void};
export default function HideoutStore({progress,onInspect,ghostEarned,onEquipGhost,onOpenWeekly}:Props){
 const e=useEconomy(),{height}=useWindowDimensions(),[storeHeight,setStoreHeight]=useState(0),compact=storeHeight>0?storeHeight<650:height<780;
 const portraitHeight=compact?(storeHeight>560?57:38):76;
 const [section,setSection]=useState<'outfits'|'effects'|'collection'>('outfits'),[selected,setSelected]=useState<CostumeId>(()=>costumeFor(e.equipment.outfit).id),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const look=costumeFor(selected),product=e.items.find(p=>p.id===selected),trail=e.items.find(p=>p.id==='escape-trail')!;
 const equippedLook=costumeFor(e.equipment.outfit),isEffect=section==='effects';
 const equipped=isEffect?e.equipment.trail==='escape-trail':equippedLook.id===look.id;
 const owned=isEffect?e.owned.includes('escape-trail'):look.unlock==='free'||(look.unlock==='weekly'?ghostEarned:e.owned.includes(look.id));
 const price=isEffect?trail.price:product?.price??0;
 const title=isEffect?'Escape trail':look.name;
 const lockedWeekly=!isEffect&&look.unlock==='weekly'&&!ghostEarned;
 const label=busy?'Saving…':lockedWeekly?'Earn in weekly missions':equipped?isEffect?'Remove trail':'Equipped':owned?'Equip':e.balance<price?`Get ${price-e.balance} more credits`:`Unlock · ◈ ${price}`;
 async function act(){if(busy)return;if(lockedWeekly){onOpenWeekly();return;}if(!owned&&e.balance<price){e.openCredits();return;}setBusy(true);setMessage('');try{
  if(isEffect)await (equipped?e.unequip('trail'):owned?e.equip('escape-trail'):e.redeem('escape-trail'));
  else if(look.unlock==='free')await e.unequip('outfit');
  else if(look.unlock==='weekly')await onEquipGhost();
  else await (owned?e.equip(look.id as StoreItemId):e.redeem(look.id as StoreItemId));
  setMessage(isEffect&&equipped?'Trail removed.':`${title} equipped for campaign and weekly runs.`);
 }catch(err){setMessage(err instanceof Error?err.message:'Try again.');}finally{setBusy(false);}}
 return <View testID="hideout-store" onLayout={event=>{const h=Math.round(event.nativeEvent.layout.height);setStoreHeight(previous=>previous===h?previous:h);}} style={{flex:1,minHeight:0,gap:compact?6:10}}>
 <View style={s.tabs}>{(['outfits','effects','collection'] as const).map(tab=><Pressable key={tab} accessibilityRole="tab" accessibilityState={{selected:section===tab}} aria-selected={section===tab} onPress={()=>{setSection(tab);setMessage('');}} style={[s.tab,section===tab&&s.activeTab]}><Text style={[s.tabText,section===tab&&{color:'#E4F2EB'}]}>{tab==='outfits'?'Outfits':tab==='effects'?'Effects':'Phones'}</Text></Pressable>)}</View>
 {section==='collection'?<><View style={{flex:1,minHeight:0,justifyContent:'center'}}><View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{CAMPAIGN_IDS.map((id,i)=>{const won=!!progress.missions[id];return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`View ${PHONE_EDITIONS[i]!.name}, ${won?'recovered':'locked'}`} onPress={()=>onInspect(i)} style={{width:'23%',height:compact?85:115,borderWidth:1,borderColor:won?'#538875':'#2B4037',borderRadius:11,backgroundColor:'#17271F',alignItems:'center',justifyContent:'center'}}>{won?<PhoneArt index={i} height={compact?57:79}/>:<Text style={{fontSize:28,color:'#546F62'}}>◇</Text>}<Text numberOfLines={1} style={{fontSize:8,color:won?'#C7E2D4':'#779184',marginTop:4}}>{PHONE_EDITIONS[i]!.name}</Text></Pressable>;})}</View></View><Text style={s.note}>{CAMPAIGN_IDS.filter(id=>progress.missions[id]).length}/12 recovered · tap a phone to inspect</Text></>:<>
 <View testID="outfit-preview-stage" style={[s.stage,{flex:1,minHeight:compact?90:145,maxHeight:290}]}>
 <View style={s.stageLines}/>{isEffect?<TrailPreview outfit={e.equipment.outfit}/>:<Image source={costumePortrait(look.id)} resizeMode="contain" style={{position:'absolute',width:'100%',height:'95%',bottom:3}} accessibilityLabel={`${look.name} outfit preview`}/>}
 <View style={s.stageTop}><Text style={s.eyebrow}>{isEffect?'CARRY THE PHONE TO ACTIVATE':equipped?'EQUIPPED':'PREVIEW'}</Text>{!isEffect&&<Text style={s.eyebrow}>SAME STATS</Text>}</View>
 </View>
 {section==='outfits'&&<View testID="outfit-grid" style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{COSTUMES.map(c=>{const p=e.items.find(i=>i.id===c.id),has=c.unlock==='free'||(c.unlock==='weekly'?ghostEarned:e.owned.includes(c.id)),active=equippedLook.id===c.id;return <Pressable key={c.id} accessibilityRole="button" accessibilityState={{selected:selected===c.id}} accessibilityLabel={`Preview ${c.name}${active?', equipped':has?', owned':c.unlock==='weekly'?', earn weekly':`, ${p!.price} credits`}`} onPress={()=>{setSelected(c.id);setMessage('');}} style={[s.outfit,{borderColor:selected===c.id?'#CFE6E4':'#30463E',backgroundColor:selected===c.id?'#233D34':'#131E1B'}]}><Image source={costumePortrait(c.id)} resizeMode="contain" style={{height:portraitHeight,width:'100%'}}/><Text numberOfLines={1} style={s.itemName}>{c.name}</Text><Text style={s.price}>{active?'✓ Equipped':has?c.unlock==='free'?'Free':'Owned':c.unlock==='weekly'?'Earn weekly':`◈ ${p!.price}`}</Text></Pressable>;})}</View>}
 <View testID="outfit-details" style={{gap:5}}><Text numberOfLines={1} style={[s.title,{height:22,lineHeight:22}]}>{title}</Text><Text numberOfLines={2} style={[s.note,{height:28}]}>{isEffect?trail.description:lockedWeekly?'Clear all three scored weekly missions to earn this outfit.':look.description}</Text>
 <View testID="outfit-progress-slot" style={{height:23,gap:5}}>{!owned&&!lockedWeekly&&<><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={s.note}>◈ {Math.min(e.balance,price)} / {price}</Text><Text style={s.note}>{creditReward(1)}–{creditReward(3)} per first clear</Text></View><View accessibilityRole="progressbar" accessibilityLabel={`Credits towards ${title}`} accessibilityValue={{min:0,max:price,now:Math.min(e.balance,price)}} style={{height:4,borderRadius:2,backgroundColor:'#263D36',overflow:'hidden'}}><View style={{height:4,width:`${Math.min(100,e.balance/price*100)}%`,backgroundColor:'#BCE6D7'}}/></View></>}</View>
 </View>
 <Pressable testID="outfit-action" accessibilityRole="button" accessibilityLabel={label} disabled={busy||!e.ready||(!isEffect&&equipped)} onPress={()=>void act()} style={[s.cta,(busy||(!isEffect&&equipped))&&{backgroundColor:'#284237'}]}><Text style={{fontWeight:'800',fontSize:13,color:!isEffect&&equipped?'#B7D4C5':'#15392C'}}>{label}</Text></Pressable>
 </>}
 <Text accessibilityLiveRegion="polite" numberOfLines={compact?1:2} style={[s.note,{height:compact?14:28}]}>{message||e.notice||(e.local?'Saved on this device. Credits buy cosmetics, not better stats.':'Saved to your wallet. Cosmetics never change weekly stats.')}</Text>
 </View>;
}
const s=StyleSheet.create({tabs:{flexDirection:'row',borderBottomWidth:1,borderColor:'#34483E'},tab:{flex:1,minHeight:40,alignItems:'center',justifyContent:'center',borderBottomWidth:3,borderColor:'transparent'},activeTab:{borderColor:'#CFE6E4'},tabText:{color:'#839D91',fontSize:12,fontWeight:'800'},stage:{overflow:'hidden',borderRadius:14,borderWidth:1,borderColor:'#2C403B',backgroundColor:'#141D20',alignItems:'center',justifyContent:'center'},stageLines:{position:'absolute',bottom:10,width:'72%',height:17,borderRadius:99,backgroundColor:'#253F3C'},stageTop:{position:'absolute',top:10,left:12,right:12,flexDirection:'row',justifyContent:'space-between'},eyebrow:{color:'#9BB6AA',fontSize:8,fontWeight:'800',letterSpacing:1.2},outfit:{width:'32%',padding:5,borderRadius:10,borderWidth:1,alignItems:'center'},itemName:{color:'#E0EEE6',fontWeight:'700',fontSize:9},price:{fontSize:8,color:'#9BBEAC',marginTop:3},title:{fontSize:18,fontWeight:'800',color:'#EDF4EB'},note:{fontSize:10,lineHeight:14,color:'#96B5A2'},cta:{height:45,borderRadius:12,backgroundColor:'#CFE6E4',alignItems:'center',justifyContent:'center'}});
