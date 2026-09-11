import React from 'react';
import {Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {useSettings} from './SettingsProvider';
import app from '../../app.json';

export default function SettingsPanel({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const {settings, ready, error, update, retry} = useSettings();
  const toggle = (label: string, detail: string, checked: boolean, onChange: (on: boolean) => void) =>
    <View style={styles.row}><View style={{flex: 1, gap: 5}}><Text style={styles.label}>{label}</Text><Text style={styles.detail}>{detail}</Text></View>
      <Switch accessibilityLabel={label} disabled={!ready} value={checked} onValueChange={onChange} trackColor={{false: '#42584e', true: '#8abfad'}} thumbColor="#e1eee6"/>
    </View>;
  return <Modal visible={visible} transparent animationType={settings.reducedEffects ? 'none' : 'slide'} onRequestClose={onClose}>
    <View style={styles.scrim}><ScrollView style={styles.panel} contentContainerStyle={{padding: 24, gap: 22}}>
      <Text style={styles.eyebrow}>STEAL A SEEKER</Text><Text style={styles.title}>Make yourself comfortable.</Text>
      {toggle('Game sound', 'Pickup, dash and extraction cues.', settings.sound, sound => update({sound}))}
      <View style={{gap: 10}}><Text style={styles.label}>Volume · {Math.round(settings.volume * 100)}%</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Game volume" style={{flexDirection: 'row', gap: 8}}>{[.25, .5, .75, 1].map(volume => <Pressable key={volume} accessibilityRole="radio" accessibilityLabel={`Volume ${volume * 100}%`} accessibilityState={{checked: settings.volume === volume}} aria-checked={settings.volume === volume} disabled={!ready} onPress={() => update({volume})} style={[styles.volume, settings.volume === volume && {backgroundColor: '#38604e'}]}><Text style={styles.label}>{volume * 100}%</Text></Pressable>)}</View>
      </View>
      {toggle('Vibration', Platform.OS === 'web' ? 'Saved for this browser. Vibration feedback is used on Android.' : 'Feedback when taking the phone, dashing, escaping or getting caught.', settings.haptics, haptics => update({haptics}))}
      {toggle('Reduced effects', 'Hide escape trails and decorative bobbing, spinning and pulsing. Guard cones and movement stay visible.', settings.reducedEffects, reducedEffects => update({reducedEffects}))}
      {!!error && <View style={{gap: 10}}><Text accessibilityLiveRegion="polite" style={styles.detail}>{error}</Text><Pressable accessibilityRole="button" onPress={retry} style={styles.button}><Text style={styles.buttonText}>Save preferences again</Text></Pressable></View>}
      <View style={{gap: 10}}><Text style={styles.label}>Controls</Text><Text style={styles.detail}>Drag the left stick to move. Stop near a phone and hold TAKE. ACT operates nearby switches. DASH spends 20 charge while carrying. DECOY throws a distraction in the direction you face.</Text><Text style={styles.detail}>Opening a menu pauses gameplay. Choose Resume when you return. Daily submission deadlines keep counting while paused.</Text></View>
      <Text style={styles.detail}>Version {app.expo.version} · Devnet test build{Platform.OS === 'web' ? ' · Browser preview' : ''}{'\n'}Preferences are saved on this device. TEST SKR has no monetary value.</Text>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Close settings</Text></Pressable>
    </ScrollView></View>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: {flex: 1, backgroundColor: '#081210ed', padding: 20, justifyContent: 'center'},
  panel: {flexGrow: 0, maxHeight: '92%', borderRadius: 24, backgroundColor: '#152724'},
  eyebrow: {color: '#a8ecd7', fontSize: 11, letterSpacing: 2},
  title: {color: '#edf2e8', fontSize: 28, fontWeight: '700'},
  row: {flexDirection: 'row', gap: 15, alignItems: 'center'},
  label: {color: '#dcece2', fontSize: 15, fontWeight: '600'},
  detail: {color: '#adc8b8', fontSize: 13, lineHeight: 21},
  volume: {flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: '#233e32', justifyContent: 'center', alignItems: 'center'},
  button: {padding: 16, borderRadius: 12, backgroundColor: '#cfe6e4'},
  buttonText: {color: '#19362c', fontWeight: '700', textAlign: 'center'},
});
