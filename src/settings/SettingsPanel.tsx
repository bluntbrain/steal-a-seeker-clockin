import React from 'react';
import {Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {useSettings} from './SettingsProvider';
import app from '../../app.json';
import type {MissionId} from '../game/level';

export default function SettingsPanel({visible, onClose, mission}: {visible: boolean; onClose: () => void; mission?:MissionId}) {
  const {settings, ready, error, update, retry} = useSettings();
  const toggle = (label: string, detail: string, checked: boolean, onChange: (on: boolean) => void) =>
    <View style={styles.row}><View style={{flex: 1, gap: 5}}><Text style={styles.label}>{label}</Text><Text style={styles.detail}>{detail}</Text></View>
      <Switch accessibilityLabel={label} disabled={!ready} value={checked} onValueChange={onChange} trackColor={{false: '#42584e', true: '#8abfad'}} thumbColor="#e1eee6"/>
    </View>;
  return <Modal visible={visible} transparent animationType={settings.reducedEffects ? 'none' : 'slide'} onRequestClose={onClose}>
    <View style={styles.scrim}><ScrollView style={styles.panel} contentContainerStyle={{padding: 24, gap: 22}}>
      <Text style={styles.eyebrow}>STEAL A SEEKER</Text><Text style={styles.title}>Make yourself comfortable.</Text>
      {mission==='silent-circuit'&&<View style={{gap:8}}><Text style={styles.label}>Level 11 · Silent Circuit</Text><Text style={styles.detail}>1. Go up the left side to the lower relay. Release the stick, then press ACT. Cross the left door within 9 seconds.</Text><Text style={styles.detail}>2. Cross the middle room toward the right relay. Stay outside the guard cone. Stop, press ACT, and cross the upper-right door.</Text><Text style={styles.detail}>3. Reach the top-right phone. Stop and hold TAKE. The alarm speeds up the guards.</Text><Text style={styles.detail}>4. Use the relay above the right door to reopen it. Cross down, then head left through the middle room.</Text><Text style={styles.detail}>5. Use the relay above the left door. Cross down and return to the bottom-left EXIT. Stay inside for one second.</Text><Text style={styles.detail}>If ACT does nothing, stop moving first. Release and press it again to refresh a relay. Decoys lure guards toward the landing ring; aim away from your route.</Text></View>}
      {toggle('Game sound', 'Pickup, dash, extraction and the theft alarm.', settings.sound, sound => update({sound}))}
      <View style={{gap: 10}}><Text style={styles.label}>Volume · {Math.round(settings.volume * 100)}%</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Game volume" style={{flexDirection: 'row', gap: 8}}>{[.25, .5, .75, 1].map(volume => <Pressable key={volume} accessibilityRole="radio" accessibilityLabel={`Volume ${volume * 100}%`} accessibilityState={{checked: settings.volume === volume}} aria-checked={settings.volume === volume} disabled={!ready} onPress={() => update({volume})} style={[styles.volume, settings.volume === volume && {backgroundColor: '#415D60'}]}><Text style={styles.label}>{volume * 100}%</Text></Pressable>)}</View>
      </View>
      {toggle('Vibration', Platform.OS === 'web' ? 'Saved for this browser. Vibration feedback is used on Android.' : 'Feedback when taking the phone, dashing, escaping or getting caught.', settings.haptics, haptics => update({haptics}))}
      {toggle('Reduced effects', 'Use a steady alarm border; hide the red screen pulse, escape trails and decorative motion. Guard cones and movement stay visible.', settings.reducedEffects, reducedEffects => update({reducedEffects}))}
      {!!error && <View style={{gap: 10}}><Text accessibilityLiveRegion="polite" style={styles.detail}>{error}</Text><Pressable accessibilityRole="button" onPress={retry} style={styles.button}><Text style={styles.buttonText}>Save preferences again</Text></Pressable></View>}
      <View style={{gap: 10}}><Text style={styles.label}>Controls</Text><Text style={styles.detail}>Drag the left stick to move. Stop near a phone and hold TAKE. ACT operates nearby switches. DASH spends 20 charge while carrying. DECOY throws a six-second noise beacon toward the landing ring. Mobile guards within nine tiles walk over and search. Scanners ignore it; guards watching you must lose sight first. Blocked throws do not spend an item.</Text><Text style={styles.detail}>Opening a menu pauses gameplay. Choose Resume when you return. Daily submission deadlines keep counting while paused.</Text></View>
      <Text style={styles.detail}>Version {app.expo.version} · Devnet test build{Platform.OS === 'web' ? ' · Browser preview' : ''}{'\n'}Preferences are saved on this device. TEST SKR has no monetary value.</Text>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Close settings</Text></Pressable>
    </ScrollView></View>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: {flex: 1, backgroundColor: '#0C0C0E99', padding: 12, justifyContent: 'flex-end', alignItems: 'center'},
  panel: {width: '100%', maxWidth: 700, flexGrow: 0, maxHeight: '84%', borderRadius: 24, backgroundColor: '#161618'},
  eyebrow: {color: '#a8ecd7', fontSize: 11, letterSpacing: 2},
  title: {color: '#edf2e8', fontSize: 28, fontWeight: '700'},
  row: {flexDirection: 'row', gap: 15, alignItems: 'center'},
  label: {color: '#dcece2', fontSize: 15, fontWeight: '600'},
  detail: {color: '#adc8b8', fontSize: 13, lineHeight: 21},
  volume: {flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: '#252E35', justifyContent: 'center', alignItems: 'center'},
  button: {padding: 16, borderRadius: 12, backgroundColor: '#cfe6e4'},
  buttonText: {color: '#19362c', fontWeight: '700', textAlign: 'center'},
});
