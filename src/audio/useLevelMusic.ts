import {useEffect,useRef} from 'react';
import {useGameAudio} from './useGameAudio';
import {musicIndex} from './music';
const tracks=[
 require('../../assets/music-v1/01-first-pickup.m4a'),require('../../assets/music-v1/02-blind-corner.m4a'),
 require('../../assets/music-v1/03-crossfire.m4a'),require('../../assets/music-v1/04-loading-lockdown.m4a'),
 require('../../assets/music-v1/05-skybridge.m4a'),require('../../assets/music-v1/06-heavy-watch.m4a'),
 require('../../assets/music-v1/07-split-route.m4a'),require('../../assets/music-v1/08-twin-relay.m4a'),
 require('../../assets/music-v1/09-dark-circuit.m4a'),require('../../assets/music-v1/10-vault-window.m4a'),
 require('../../assets/music-v1/11-security-grid.m4a'),require('../../assets/music-v1/12-last-seeker.m4a'),
];
/** One player at a time. Weekly maps reuse their authored level's track. */
export function useLevelMusic(levelNumber:number,enabled:boolean,volume:number,alarm:boolean){
 const source=tracks[musicIndex(levelNumber)]!,player=useGameAudio(source);
 const target=useRef(0);target.current=enabled?volume*(alarm?.48:.42):0;
 useEffect(()=>{
  player.loop=true;player.volume=0;
  if(!enabled){player.pause();return;}
  player.play();
  const fade=setInterval(()=>{const goal=target.current,now=player.volume;player.volume=Math.abs(goal-now)<.005?goal:now+(goal-now)*.2;},50);
  return()=>{clearInterval(fade);player.pause();player.volume=0;};
 },[player,source,enabled]);
}
