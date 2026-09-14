import {useEffect,useMemo} from 'react';
import {Asset} from 'expo-asset';
import {protectAudioPlayer} from './safePlayer';
// Expo 55's web player discards HTMLMediaElement.play's promise. Own that
// promise so a normal pause/unmount during buffering cannot reject globally.
export function useGameAudio(source:number){
 const player=useMemo(()=>{
  const media=new Audio(Asset.fromModule(source).uri);media.preload='auto';
  const controls={get volume(){return media.volume;},set volume(value:number){media.volume=value;},get loop(){return media.loop;},set loop(value:boolean){media.loop=value;},pause(){media.pause();},play(){void media.play().catch((e:DOMException)=>{if(e.name!=='AbortError'&&e.name!=='NotAllowedError')console.warn('Game audio unavailable:',e.name);});},async seekTo(seconds:number){media.currentTime=seconds;},dispose(){media.pause();media.removeAttribute('src');media.load();}};
  const guarded=protectAudioPlayer(controls,(operation,error)=>console.warn('[SeekerAudio]',operation,error instanceof Error?error.message:'Audio unavailable'));
  return {...guarded, get volume(){return guarded.volume;},set volume(value:number){guarded.volume=value;},get loop(){return guarded.loop;},set loop(value:boolean){guarded.loop=value;},dispose(){guarded.deactivate();controls.dispose();}};
 },[source]);
 useEffect(()=>{player.activate();return()=>player.dispose();},[player]);return player;
}
