import {useEffect} from 'react';
import {useGameAudio} from './useGameAudio';
import {musicIndex} from './music';
const tracks=[
 require('../../assets/music-v1/02-blind-corner.m4a'),
 require('../../assets/music-v1/03-crossfire.m4a'),require('../../assets/music-v1/04-loading-lockdown.m4a'),
 require('../../assets/music-v1/10-vault-window.m4a'),require('../../assets/music-v1/12-last-seeker.m4a'),
];
/** One player at a time. Weekly maps reuse their authored level's track. */
export function useLevelMusic(levelNumber:number,enabled:boolean,volume:number,alarm:boolean){
 const source=tracks[musicIndex(levelNumber)]!,player=useGameAudio(source);
 const target=enabled?volume*(alarm?.48:.42):0;
 useEffect(()=>{
  player.loop=true;player.volume=0;
  if(!enabled){player.pause();return;}
  player.play();
  return()=>{player.pause();player.volume=0;};
 },[player,source,enabled]);
 // the fade timer runs only until the volume settles, then stops; it restarts when the target changes
 useEffect(()=>{
  if(!enabled)return;
  let timer:ReturnType<typeof setInterval>|undefined;
  const settle=()=>{const now=player.volume;if(Math.abs(target-now)<.005){player.volume=target;if(timer!==undefined)clearInterval(timer);timer=undefined;return true;}player.volume=now+(target-now)*.2;return false;};
  if(!settle())timer=setInterval(settle,50);
  return()=>{if(timer!==undefined)clearInterval(timer);};
 },[player,enabled,target]);
}
