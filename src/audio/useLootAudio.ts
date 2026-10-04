import {useCallback,useEffect,useRef} from 'react';
import {runOnJS,useAnimatedReaction,useSharedValue,type SharedValue} from 'react-native-reanimated';
import type {GameState} from '../game/simulation';
import {addLoot,emptyLoot,lootAudioMask,newDefeats} from '../components/defeat-loot';
import {useGameAudio} from './useGameAudio';

/** Four preloaded voices, with at most five phase events per burst; no JS timers. */
export function useLootAudio(game:SharedValue<GameState>,clock:SharedValue<number>,enabled:boolean,volume:number){
 const scatter=useGameAudio(require('../../assets/audio-loot-v2/scatter.wav')),magnet=useGameAudio(require('../../assets/audio-loot-v2/magnet.wav'));
 const absorbA=useGameAudio(require('../../assets/audio-loot-v2/absorb.wav')),absorbB=useGameAudio(require('../../assets/audio-loot-v2/absorb.wav'));
 const live=useRef({enabled,volume,epoch:0});if(live.current.enabled!==enabled)live.current.epoch++;live.current.enabled=enabled;live.current.volume=volume;
 const pool=useSharedValue(emptyLoot()),masks=useSharedValue(Array(8).fill(0));
 useEffect(()=>{if(!enabled)for(const p of [scatter,magnet,absorbA,absorbB])p.pause();return()=>{live.current.epoch++;for(const p of [scatter,magnet,absorbA,absorbB])p.pause();};},[enabled,scatter,magnet,absorbA,absorbB]);
 const play=useCallback((mask:number,time:number)=>{
  if(!live.current.enabled||Math.abs(clock.value-time)>.16)return;
  if(mask===0){live.current.epoch++;for(const p of [scatter,magnet,absorbA,absorbB])p.pause();return;}
  const epoch=live.current.epoch;
  // Merge overlapping kills into one cue per phase, never stack dozens of players.
  const cues:[[number,typeof scatter,number],[number,typeof scatter,number],[number,typeof scatter,number]]=[[1,scatter,.38],[2,magnet,.2],[28,mask&8?absorbB:absorbA,mask&16?.42:.32]];
  for(const [bit,player,gain] of cues){if(!(mask&bit))continue;player.volume=live.current.volume*gain;void player.seekTo(0).then(()=>{if(live.current.enabled&&live.current.epoch===epoch&&Math.abs(clock.value-time)<.2)player.play();}).catch(()=>{});}
 },[clock,scatter,magnet,absorbA,absorbB]);
 useAnimatedReaction(()=>({time:clock.value,tick:game.value.ticks,hp:game.value.combat?game.value.guards.map(g=>g.hp):[]}), (next,previous)=>{
  if(!previous||next.tick<previous.tick||next.time<previous.time){pool.value=emptyLoot();masks.value=Array(8).fill(0);if(previous)runOnJS(play)(0,next.time);return;}
  const ids=newDefeats(previous.hp,next.hp,previous.tick,next.tick);
  if(ids.length){const updated=pool.value.map(b=>({...b}));for(const id of ids){const g=game.value.guards[id]!;addLoot(updated,{started:next.time,x:g.x,y:g.y,seed:id});}pool.value=updated;}
  let cues=0;const nextMasks=pool.value.map((b,i)=>{const mask=lootAudioMask(next.time-b.started);cues|=mask&~(b.started===next.time?0:masks.value[i]!);return mask;});masks.value=nextMasks;
  if(cues)runOnJS(play)(cues,next.time);
 });
}
