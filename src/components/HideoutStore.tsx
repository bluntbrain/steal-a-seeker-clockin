import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import {useHaptics} from '../feedback/useHaptics';
import React,{useEffect,useRef,useState} from 'react';
import {Image,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {useEconomy} from '../commerce/EconomyProvider';
import type {StoreItemId} from '../../shared/store';
import {COSTUMES,costumeFor,isSolanaCostume,type CostumeId} from '../../shared/costumes';
import {CAMPAIGN_IDS} from '../game/level';
import {PHONE_EDITIONS} from '../game/collection';
import type {Progress} from '../progress/model';
import PhoneArt from './PhoneArt';
import {costumePortrait} from './costumeAssets';
import {CharacterStage,CreditCoin,SkinGlow} from './SkinVisuals';
type Props={active?:boolean;progress:Progress;onInspect:(i:number)=>void;ghostEarned:boolean;onEquipGhost:()=>Promise<void>;onOpenWeekly:()=>void};
export default function HideoutStore({active=true,progress,onInspect,ghostEarned,onEquipGhost,onOpenWeekly}:Props){
 const haptic=useHaptics(),e=useEconomy(),{width,height}=useWindowDimensions(),scroll=useRef<ScrollView>(null);
 const defaultSkin=()=>isSolanaCostume(e.equipment.outfit)?costumeFor(e.equipment.outfit).id:'solana-toly';
 const [section,setSection]=useState<'outfits'|'solana'|'collection'>('solana'),[selected,setSelected]=useState<CostumeId>(defaultSkin),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(active){setSection('solana');setSelected(defaultSkin());setMessage('');scroll.current?.scrollTo({y:0,animated:false});}},[active]);
 const look=costumeFor(selected),product=e.items.find(p=>p.id===selected),equippedLook=costumeFor(e.equipment.outfit),premium=isSolanaCostume(look.id);
 const outfits=COSTUMES.filter(c=>isSolanaCostume(c.id)===(section==='solana'));
 const cardWidth=(Math.min(width-24,430)-16)/3,portraitHeight=Math.round(cardWidth*1.4),stageHeight=Math.max(240,Math.min(290,height*.34));
 const equipped=equippedLook.id===look.id,owned=look.unlock==='free'||(look.unlock==='weekly'?ghostEarned:e.owned.includes(look.id));
 const price=product?.price??0,lockedWeekly=look.unlock==='weekly'&&!ghostEarned;
 const label=busy?'Saving…':lockedWeekly?'Earn in weekly missions':equipped?'Equipped':owned?`Equip ${look.name} skin`:e.balance<price?premium?`Unlock ${look.name} skin`:`Get ${(price-e.balance).toLocaleString()} more credits`:`Unlock skin · ${price.toLocaleString()} credits`;
 function changeSection(tab:typeof section){setSection(tab);setMessage('');scroll.current?.scrollTo({y:0,animated:false});if(tab!=='collection'&&isSolanaCostume(selected)!==(tab==='solana'))setSelected(tab==='solana'?defaultSkin():!isSolanaCostume(e.equipment.outfit)?equippedLook.id:'default');}
 async function act(){if(busy)return;if(lockedWeekly){onOpenWeekly();return;}if(!owned&&e.balance<price){if(premium)e.openProduct(look.id as StoreItemId);else e.openCredits();return;}setBusy(true);setMessage('');try{
  if(look.unlock==='free')await e.unequip('outfit');else if(look.unlock==='weekly')await onEquipGhost();else await (owned?e.equip(look.id as StoreItemId):e.redeem(look.id as StoreItemId));
  haptic('confirm');setMessage(`${look.name} skin equipped.`);
 }catch(err){haptic('caught');setMessage(err instanceof Error?err.message:'Try again.');}finally{setBusy(false);}}
 return <View testID="hideout-store" style={s.root}>
  <View style={s.tabs}>{(['outfits','solana','collection'] as const).map((tab,index)=><React.Fragment key={tab}>{index>0&&<View style={s.tabDivider}/>}<Pressable accessibilityRole="tab" accessibilityState={{selected:section===tab}} aria-selected={section===tab} onPress={()=>changeSection(tab)} style={s.tab}><Text style={[s.tabText,section===tab&&s.activeTabText]}>{tab==='outfits'?'Outfits':tab==='solana'?'Solana':'Phones'}</Text>{section===tab&&<View style={s.underline}/>}</Pressable></React.Fragment>)}</View>
  <ScrollView ref={scroll} testID="hideout-scroll" style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} bounces={false}>
   {section==='collection'?<><View style={s.phoneGrid}>{CAMPAIGN_IDS.map((id,i)=>{const won=!!progress.missions[id];return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`View ${PHONE_EDITIONS[i]!.name}, ${won?'recovered':'locked'}`} onPress={()=>onInspect(i)} style={[s.phone,{borderColor:won?'#466B5A':'#253B31'}]}>{won?<PhoneArt index={i} height={86}/>:<Text style={{fontSize:32,color:'#546F62'}}>◇</Text>}<Text numberOfLines={1} style={s.phoneName}>{PHONE_EDITIONS[i]!.name}</Text></Pressable>;})}</View><Text style={s.collectionNote}>{CAMPAIGN_IDS.filter(id=>progress.missions[id]).length}/12 recovered · tap a phone to inspect</Text></>:<>
    <View style={s.stage}><CharacterStage sku={look.id} height={stageHeight} badges={premium} equipped={equipped}/></View>
    <View testID="outfit-grid" style={s.grid}>{outfits.map(c=>{
     const p=e.items.find(i=>i.id===c.id),has=c.unlock==='free'||(c.unlock==='weekly'?ghostEarned:e.owned.includes(c.id)),worn=equippedLook.id===c.id,chosen=selected===c.id;
     return <Pressable key={c.id} accessibilityRole="button" accessibilityState={{selected:chosen}} accessibilityLabel={`Preview ${c.name} skin${worn?', equipped':has?', owned':c.unlock==='weekly'?', earn weekly':`, ${p!.price} credits`}`} onPress={()=>{setSelected(c.id);setMessage('');scroll.current?.scrollTo({y:0,animated:true});}} style={[s.outfit,{width:cardWidth},chosen&&s.selectedOutfit]}>
      {chosen&&<View pointerEvents="none" style={StyleSheet.absoluteFill}><SkinGlow/></View>}
      <Image source={costumePortrait(c.id)} resizeMode="contain" style={{height:portraitHeight,width:'100%'}}/>
      <Text numberOfLines={1} style={s.itemName}>{c.name}</Text>
      <View style={s.cardPrice}>{!has&&c.unlock!=='weekly'&&<CreditCoin size={14}/>}<Text style={s.price}>{worn?'✓ Equipped':has?c.unlock==='free'?'Free':'Owned':c.unlock==='weekly'?'Earn weekly':p!.price.toLocaleString()}</Text></View>
     </Pressable>;
    })}</View>
    {section==='outfits'&&e.owned.includes('escape-trail')&&<Pressable accessibilityRole="switch" accessibilityState={{checked:e.equipment.trail==='escape-trail'}} onPress={()=>void (e.equipment.trail==='escape-trail'?e.unequip('trail'):e.equip('escape-trail')).catch(err=>setMessage(String(err)))} style={{paddingVertical:10}}><Text style={s.description}>Your escape trail · {e.equipment.trail==='escape-trail'?'On':'Off'}</Text></Pressable>}
   </>}
  </ScrollView>
  {section!=='collection'&&<View testID="outfit-fixed-footer" style={s.footer}>
   <View testID="outfit-details" style={{gap:3}}><View style={s.detailHeading}><Text numberOfLines={1} style={s.title}>{look.name}</Text>{!owned&&!lockedWeekly&&<View style={s.detailPrice}><CreditCoin size={15}/><Text style={s.price}>{price.toLocaleString()}</Text></View>}</View><Text numberOfLines={2} style={s.description}>{lockedWeekly?'Clear all three weekly missions to earn this skin.':look.description}</Text></View>
   <Pressable testID="outfit-action" accessibilityRole="button" accessibilityLabel={label} disabled={busy||!e.ready||equipped} onPress={()=>void act()} style={[s.cta,(busy||equipped)&&s.ctaDisabled]}><Text style={[s.ctaText,equipped&&{color:'#B9E4D3'}]}>{label}</Text></Pressable>
   {!!(message||e.notice)&&<Text accessibilityLiveRegion="polite" numberOfLines={2} style={s.status}>{message||e.notice}</Text>}
  </View>}
 </View>;
}
const s=StyleSheet.create({
 root:{flex:1,minHeight:0},tabs:{height:46,flexShrink:0,flexDirection:'row',alignItems:'center'},tab:{flex:1,height:46,alignItems:'center',justifyContent:'center'},tabDivider:{width:1,height:25,backgroundColor:'#3A4842'},tabText:{color:'#A7ADB2',fontSize:14,fontWeight:'600'},activeTabText:{color:'#F3F4EC',fontWeight:'800'},underline:{position:'absolute',bottom:0,left:9,right:9,height:3,borderRadius:3,backgroundColor:'#ACEDDB'},
 scroll:{flex:1,minHeight:0},content:{paddingTop:5,paddingBottom:12},stage:{borderWidth:1,borderColor:'#223A31',borderRadius:17,backgroundColor:'#0C1814',marginBottom:8,overflow:'hidden'},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},outfit:{paddingTop:2,paddingBottom:7,borderRadius:11,borderWidth:1,borderColor:'#2B3C34',backgroundColor:'#121F19',alignItems:'center',overflow:'hidden'},selectedOutfit:{borderWidth:2,paddingTop:1,paddingBottom:6,borderColor:'#B7F7E5',backgroundColor:'#152E24'},itemName:{color:'#E5F3EB',fontWeight:'700',fontSize:12,lineHeight:16,paddingHorizontal:2},cardPrice:{flexDirection:'row',alignItems:'center',gap:4,minHeight:20},price:{fontSize:11,fontWeight:'600',color:'#DFEBE3'},
 footer:{flexShrink:0,paddingTop:10,paddingBottom:4,gap:10,borderTopWidth:1,borderColor:'#263C32',backgroundColor:'#0B1612'},detailHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},detailPrice:{flexDirection:'row',alignItems:'center',gap:4},title:{fontSize:22,lineHeight:27,fontWeight:'800',color:'#F4F3E9',flexShrink:1},description:{fontSize:12,lineHeight:17,color:'#ACB8B2'},cta:{minHeight:51,borderRadius:13,borderWidth:1,borderColor:'#CBFCEF',backgroundColor:'#B6F0DF',alignItems:'center',justifyContent:'center',paddingHorizontal:10,paddingVertical:10},ctaDisabled:{backgroundColor:'#203E30',borderColor:'#395747'},ctaText:{fontWeight:'800',fontSize:15,color:'#0B2920',textAlign:'center'},status:{fontSize:10,lineHeight:14,color:'#AAC6B8'},phoneGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingTop:10},phone:{width:'31.5%',height:132,borderWidth:1,borderRadius:12,backgroundColor:'#13231B',alignItems:'center',justifyContent:'center'},phoneName:{fontSize:10,color:'#C7E2D4',marginTop:6},collectionNote:{fontSize:11,lineHeight:16,color:'#96B5A2',paddingVertical:14,textAlign:'center'},
});
