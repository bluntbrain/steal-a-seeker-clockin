import {useEffect,useRef} from 'react';
import {useGameAudio} from './useGameAudio';
import {combatSoundEvents,type CombatSoundCounters} from './combat-events';
import type {GameState} from '../game/simulation';
const zero:CombatSoundCounters={shots:0,enemyShots:0,hitEvents:0,damageTaken:0,kills:0,aimEvents:0,commandSeen:0};
export function useCombatAudio(state:GameState,enabled:boolean,volume:number){
 const shotA=useGameAudio(require('../../assets/audio-combat-v3/shot-a.wav'));
 const shotB=useGameAudio(require('../../assets/audio-combat-v3/shot-b.wav'));
 const enemyA=useGameAudio(require('../../assets/audio-combat-v3/enemy-a.wav'));
 const enemyB=useGameAudio(require('../../assets/audio-combat-v3/enemy-b.wav'));
 const hit=useGameAudio(require('../../assets/audio-combat-v3/hit.wav'));
 const damage=useGameAudio(require('../../assets/audio-combat-v3/damage.wav'));
 const knockout=useGameAudio(require('../../assets/audio-combat-v3/knockout.wav'));
 const aim=useGameAudio(require('../../assets/audio-combat-v3/aim.wav'));
 const previous=useRef<CombatSoundCounters>(zero),lastTick=useRef(0),lastAim=useRef(-100),epoch=useRef(0),allowed=useRef(enabled);
 allowed.current=enabled;
 useEffect(()=>()=>{allowed.current=false;epoch.current++;},[]);
 useEffect(()=>{
  const players=[shotA,shotB,enemyA,enemyB,hit,damage,knockout,aim];
  if(!enabled||state.ticks<lastTick.current){epoch.current++;for(const p of players)p.pause();}
  const c=state.combat??zero,events=combatSoundEvents(previous.current,c);
  if(enabled&&state.ticks>=lastTick.current){
   for(const cue of events){
    if(cue==='aim'&&state.ticks-lastAim.current<18)continue;
    if(cue==='aim')lastAim.current=state.ticks;
    const heavy=state.guards.some(g=>g.active&&g.gunPhase==='fire'&&(g.combatRole==='heavy'||g.combatRole==='warden'));
    const player={shot:c.shots%2?shotA:shotB,enemy:heavy?enemyB:enemyA,hit,damage,knockout,aim}[cue];
    player.volume=volume*({shot:.48,enemy:.36,hit:.28,damage:.58,knockout:.5,aim:.48}[cue]);
    const run=epoch.current;
    void player.seekTo(0).then(()=>{if(allowed.current&&epoch.current===run)player.play();}).catch(()=>{});
   }
  }
  if(state.ticks<lastTick.current)lastAim.current=-100;
  previous.current={shots:c.shots,enemyShots:c.enemyShots,hitEvents:c.hitEvents,damageTaken:c.damageTaken,kills:c.kills,aimEvents:c.aimEvents,commandSeen:c.commandSeen};lastTick.current=state.ticks;
 },[state,enabled,volume,shotA,shotB,enemyA,enemyB,hit,damage,knockout,aim]);
}
