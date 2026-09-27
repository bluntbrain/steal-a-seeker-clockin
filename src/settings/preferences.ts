export type Settings = {sound:boolean;volume:number;haptics:boolean;reducedEffects:boolean};
export const DEFAULT_SETTINGS:Settings={sound:true,volume:1,haptics:true,reducedEffects:false};

export function restoreSettings(data:Record<string,unknown>):Settings{
 // 65% was the old factory default, never a selectable volume. Upgrade it once;
 // preserve deliberate 25/50/75/100% choices and mute/accessibility preferences.
 const volume=data.volume===.65?1:data.volume;
 return {
  sound:typeof data.sound==='boolean'?data.sound:DEFAULT_SETTINGS.sound,
  volume:typeof volume==='number'&&Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):DEFAULT_SETTINGS.volume,
  haptics:typeof data.haptics==='boolean'?data.haptics:DEFAULT_SETTINGS.haptics,
  reducedEffects:typeof data.reducedEffects==='boolean'?data.reducedEffects:DEFAULT_SETTINGS.reducedEffects,
 };
}
