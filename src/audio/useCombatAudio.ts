import {useEffect,useRef} from 'react';
import {useGameAudio} from './useGameAudio';
import type {GameState} from '../game/simulation';
export function useCombatAudio(state:GameState,enabled:boolean,volume:number){
 const shot=useGameAudio(require('../../assets/audio-combat/shot.wav')),enemy=useGameAudio(require('../../assets/audio-combat/enemy.wav')),hit=useGameAudio(require('../../assets/audio-combat/hit.wav')),knockout=useGameAudio(require('../../assets/audio-combat/knockout.wav')),aim=useGameAudio(require('../../assets/audio-combat/aim.wav')),tap=useGameAudio(require('../../assets/audio-combat/tap.wav'));
 const previous=useRef([0,0,0,0,0,0]);const allowed=useRef(enabled);allowed.current=enabled;
 useEffect(()=>{const players=[shot,enemy,hit,knockout,aim,tap];for(const p of players){p.volume=volume*.4;if(!enabled)p.pause();}const c=state.combat,counts=c?[c.shots,c.enemyShots,c.damageTaken,c.kills,c.aimEvents,c.commandSeen]:[0,0,0,0,0,0];counts.forEach((v,i)=>{if(enabled&&v>previous.current[i]!){const p=players[i]!;void p.seekTo(0).then(()=>{if(allowed.current)p.play()}).catch(()=>{});}});previous.current=counts;},[state,enabled,volume,shot,enemy,hit,knockout,aim,tap]);
}
