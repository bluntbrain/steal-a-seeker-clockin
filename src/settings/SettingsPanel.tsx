import PromotionEntry from '../commerce/PromotionEntry';
import {useEconomy} from '../commerce/EconomyProvider';
import {useHaptics} from '../feedback/useHaptics';
import {HapticPressable as Pressable} from '../feedback/HapticPressable';
import PlaytestControls from '../telemetry/PlaytestControls';
import React,{useEffect,useRef} from 'react';
import {Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSettings} from './SettingsProvider';
import app from '../../app.json';
import BrandWordmark from '../components/BrandWordmark';
import {IS_MAINNET} from '../wallet/config';
import type {MissionId} from '../game/level';

export default function SettingsPanel({visible, onClose, mission, onReplayTips}: {visible: boolean; onClose: () => void; mission?:MissionId;onReplayTips?:()=>void}) {
  const economy=useEconomy();
  const {settings, ready, error, update, retry} = useSettings();
  const haptic=useHaptics(),previewWhenEnabled=useRef(false);
  useEffect(()=>{if(settings.haptics&&previewWhenEnabled.current){previewWhenEnabled.current=false;haptic('select');}},[settings.haptics,haptic]);
  const toggle = (label: string, detail: string, checked: boolean, onChange: (on: boolean) => void) =>
    <View style={styles.row}><View style={{flex: 1, gap: 5}}><Text style={styles.label}>{label}</Text><Text style={styles.detail}>{detail}</Text></View>
      <Switch accessibilityLabel={label} disabled={!ready} value={checked} onValueChange={on=>{if(label==='Vibration')previewWhenEnabled.current=on;else haptic('select');onChange(on);}} trackColor={{false: '#42584e', true: '#8abfad'}} thumbColor="#e1eee6"/>
    </View>;
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType={settings.reducedEffects ? 'none' : 'slide'} onRequestClose={onClose}>
    <View style={[styles.scrim, {paddingTop: 12 + insets.top, paddingBottom: 12 + insets.bottom}]}><View style={styles.panel}><ScrollView keyboardShouldPersistTaps="handled" style={{flexGrow:0,flexShrink:1}} contentContainerStyle={{padding: 24, gap: 22}}>
      <BrandWordmark/><Text style={styles.title}>Make yourself comfortable.</Text>
      {toggle('Game sound', 'Knife swings, guard gunfire, impacts and alarms.', settings.sound, sound => update({sound}))}
      <View style={{gap: 10}}><Text style={styles.label}>Volume · {Math.round(settings.volume * 100)}%</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Game volume" style={{flexDirection: 'row', gap: 8}}>{[.25, .5, .75, 1].map(volume => <Pressable key={volume} accessibilityRole="radio" accessibilityLabel={`Volume ${volume * 100}%`} accessibilityState={{checked: settings.volume === volume}} aria-checked={settings.volume === volume} disabled={!ready} onPress={() => update({volume})} style={[styles.volume, settings.volume === volume && {backgroundColor: '#415D60'}]}><Text style={styles.label}>{volume * 100}%</Text></Pressable>)}</View>
      </View>
      {toggle('Vibration', Platform.OS === 'web' ? 'Saved for this browser. Vibration feedback is used on Android.' : 'Distinct feedback for knife hits, damage, takedowns and controls.', settings.haptics, haptics => update({haptics}))}
      {toggle('Reduced effects', 'Use a steady alarm border; hide the red screen pulse, escape trails and decorative motion. Guard cones and movement stay visible.', settings.reducedEffects, reducedEffects => update({reducedEffects}))}
      {!!error && <View style={{gap: 10}}><Text accessibilityLiveRegion="polite" style={styles.detail}>{error}</Text><Pressable accessibilityRole="button" onPress={retry} style={styles.button}><Text style={styles.buttonText}>Save preferences again</Text></Pressable></View>}
      <View style={{gap: 10}}><Text style={styles.label}>Controls</Text><Text style={styles.detail}>Tap the floor to move. Tap a guard to approach and slash with your knife. Tap elsewhere to escape its aim. Tap the phone to collect it, then tap the exit. Walls stop bullets. Your outfit does not change combat stats.</Text><Text style={styles.detail}>Opening a menu pauses gameplay. Choose Resume when you return. Daily submission deadlines keep counting while paused.</Text></View>
      <View style={{gap:12}}><Text style={styles.label}>Help & privacy</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{[['Support','support'],['Privacy','privacy'],['Terms','terms'],['Delete account','delete-account']].map(([label,path])=><Pressable key={path} accessibilityRole="link" accessibilityLabel={label} onPress={()=>{void Linking.openURL(`https://stealaseeker.bluntbrain.com/${path}`).catch(()=>Alert.alert('Could not open page','Visit stealaseeker.bluntbrain.com or email hello@kraneapps.com.'));}} style={{padding:12,borderRadius:10,backgroundColor:'#294139'}}><Text style={styles.label}>{label}</Text></Pressable>)}</View></View>
      <PromotionEntry onDiscount={code=>{onClose();economy.openPass(code);}}/>
      <PlaytestControls/>
      {onReplayTips&&<Pressable accessibilityRole="button" onPress={onReplayTips} style={styles.button}><Text style={styles.buttonText}>Replay first-mission tips</Text></Pressable>}
      <Text style={styles.detail}>Version {app.expo.version} · {Platform.OS === 'web' ? 'Browser preview · no payments' : IS_MAINNET ? 'Solana Mainnet · real payments' : 'Devnet · test tokens'}{'\n'}Preferences are saved on this device.</Text>
    </ScrollView><Pressable accessibilityRole="button" accessibilityLabel="Close settings" onPress={onClose} style={[styles.button,{margin:12}]}><Text style={styles.buttonText}>Close settings</Text></Pressable></View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: {flex: 1, backgroundColor: '#0C0C0E99', padding: 12, justifyContent: 'flex-end', alignItems: 'center'},
  panel: {width: '100%', maxWidth: 700, flexGrow: 0, maxHeight: '84%', borderRadius: 24, backgroundColor: '#161618'},
  title: {color: '#edf2e8', fontSize: 28, fontWeight: '700'},
  row: {flexDirection: 'row', gap: 15, alignItems: 'center'},
  label: {color: '#dcece2', fontSize: 15, fontWeight: '600'},
  detail: {color: '#adc8b8', fontSize: 13, lineHeight: 21},
  volume: {flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: '#252E35', justifyContent: 'center', alignItems: 'center'},
  button: {padding: 16, borderRadius: 12, backgroundColor: '#cfe6e4'},
  buttonText: {color: '#19362c', fontWeight: '700', textAlign: 'center'},
});
