import {useEffect,useMemo} from 'react';
import {useAudioPlayer} from 'expo-audio';
import {protectAudioPlayer} from './safePlayer';
export function useGameAudio(source:number){
 const native=useAudioPlayer(source);
 const player=useMemo(()=>protectAudioPlayer(native,(operation,error)=>console.warn('[SeekerAudio]',operation,error instanceof Error?error.message:'Audio unavailable')),[native]);
 useEffect(()=>{player.activate();return()=>player.deactivate();},[player]);
 return player;
}
