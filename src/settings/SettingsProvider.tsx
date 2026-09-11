import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {readSave, writeSave} from '../progress/storage';

type Settings = {sound: boolean; volume: number; haptics: boolean; reducedEffects: boolean};
const defaults: Settings = {sound: true, volume: .65, haptics: true, reducedEffects: false};
const key = 'seeker.settings.v1';
type SettingsContext = {
  settings: Settings;
  ready: boolean;
  error: string;
  update: (patch: Partial<Settings>) => void;
  retry: () => void;
};
const Context = createContext<SettingsContext | null>(null);

export default function SettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [ready, setReady] = useState(false), [error, setError] = useState('');
  const latest = useRef(defaults), writes = useRef(Promise.resolve()), revision = useRef(0);
  useEffect(() => {
    let active = true;
    void readSave(key).then(raw => {
      if (!active || !raw) return;
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object') throw new Error('Invalid settings');
      const data = value as Record<string, unknown>;
      const restored: Settings = {
        sound: typeof data.sound === 'boolean' ? data.sound : defaults.sound,
        volume: typeof data.volume === 'number' && Number.isFinite(data.volume) ? Math.max(0, Math.min(1, data.volume)) : defaults.volume,
        haptics: typeof data.haptics === 'boolean' ? data.haptics : defaults.haptics,
        reducedEffects: typeof data.reducedEffects === 'boolean' ? data.reducedEffects : defaults.reducedEffects,
      };
      latest.current = restored;
      setSettings(restored);
    }).catch(() => {
      if (active) setError('Could not load your preferences. Default settings are in use.');
    }).finally(() => { if (active) setReady(true); });
    return () => {active = false;};
  }, []);
  function save(value: Settings) {
    const version = ++revision.current;
    // Serialize writes so a slower older write cannot replace a newer preference.
    writes.current = writes.current.then(() => writeSave(key, JSON.stringify(value))).then(() => {
      if (version === revision.current) setError('');
    }).catch(() => {
      if (version === revision.current) setError('Preferences work now but could not be saved. Try saving again.');
    });
  }
  function update(patch: Partial<Settings>) {
    if (!ready) return;
    const next = {...latest.current, ...patch};
    next.volume = Math.max(0, Math.min(1, next.volume));
    latest.current = next;
    setSettings(next);
    save(next);
  }
  return <Context.Provider value={{settings, ready, error, update, retry: () => save(latest.current)}}>{children}</Context.Provider>;
}

export function useSettings() {
  const value = useContext(Context);
  if (!value) throw new Error('SettingsProvider is missing.');
  return value;
}
