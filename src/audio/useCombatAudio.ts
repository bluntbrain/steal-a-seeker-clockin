import type {HapticCue} from '../feedback/haptic-policy';
import {useEffect,useRef} from 'react';
import {playImpact} from './impact-feedback';
import {useGameAudio} from './useGameAudio';
import {combatSoundEvents,type CombatSoundCounters} from './combat-events';
import type {GameState} from '../game/simulation';
const zero:CombatSoundCounters={shots:0,enemyShots:0,hitEvents:0,damageTaken:0,kills:0,aimEvents:0,commandSeen:0};
export function useCombatAudio(state:GameState,enabled:boolean,volume:number,onDamage?:()=>void,feedbackEnabled=enabled,onHaptic?:(cue:HapticCue)=>void){
 const shotA=useGameAudio(require('../../assets/audio-combat-v3/shot-a.wav'));
 const shotB=useGameAudio(require('../../assets/audio-combat-v3/shot-b.wav'));
 const enemyA=useGameAudio(require('../../assets/audio-combat-v3/enemy-a.wav'));
 const enemyB=useGameAudio(require('../../assets/audio-combat-v3/enemy-b.wav'));
 const hit=useGameAudio(require('../../assets/audio-combat-v3/hit.wav'));
 const damage=useGameAudio(require('../../assets/audio-combat-v3/damage.wav'));
 const knockout=useGameAudio(require('../../assets/audio-defeats/guard-a.wav'));
 const knockoutB=useGameAudio(require('../../assets/audio-defeats/guard-b.wav')),heavyKO=useGameAudio(require('../../assets/audio-defeats/heavy.wav')),droneKO=useGameAudio(require('../../assets/audio-defeats/drone.wav'));
 const previousHP=useRef<number[]>([]);
 const aim=useGameAudio(require('../../assets/audio-combat-v3/aim.wav'));
 const previous=useRef<CombatSoundCounters>(zero),lastTick=useRef(0),lastAim=useRef(-100),epoch=useRef(0),allowed=useRef(enabled);
 const damageFeedback=useRef(onDamage);damageFeedback.current=onDamage;
 allowed.current=enabled;
 useEffect(()=>()=>{allowed.current=false;epoch.current++;},[]);
 useEffect(()=>{
  const players=[shotA,shotB,enemyA,enemyB,hit,damage,knockout,knockoutB,heavyKO,droneKO,aim];
  if(!enabled||state.ticks<lastTick.current){epoch.current++;for(const p of players)p.pause();}
  const c=state.combat??zero,events=combatSoundEvents(previous.current,c);
  if(feedbackEnabled&&state.ticks>=lastTick.current&&!events.includes('damage')){if(events.includes('knockout'))onHaptic?.('kill');else if(events.includes('shot'))onHaptic?.('shot');}
  if(!enabled&&feedbackEnabled&&state.ticks>=lastTick.current&&events.includes('damage'))damageFeedback.current?.();
  if(enabled&&state.ticks>=lastTick.current){
   for(const cue of events){
    if(cue==='aim'&&state.ticks-lastAim.current<18)continue;
    if(cue==='aim')lastAim.current=state.ticks;
    const heavy=state.guards.some(g=>g.active&&g.gunPhase==='fire'&&(g.combatRole==='heavy'||g.combatRole==='warden'));
    const defeated=state.guards.filter((g,i)=>g.hp<=0&&(previousHP.current[i]??0)>0);
    const finish=defeated.some(g=>g.combatRole==='heavy'||g.combatRole==='warden')?heavyKO:defeated.some(g=>g.combatRole==='drone')?droneKO:c.kills%2?knockout:knockoutB;
    const player={shot:c.shots%2?shotA:shotB,enemy:heavy?enemyB:enemyA,hit,damage,knockout:finish,aim}[cue];
    player.volume=volume*({shot:.48,enemy:.36,hit:.28,damage:.58,knockout:.68,aim:.48}[cue]);
    const run=epoch.current;
    if(cue==='damage')void playImpact(player,()=>allowed.current&&epoch.current===run,()=>damageFeedback.current?.()).catch(()=>{});
    else void player.seekTo(0).then(()=>{if(allowed.current&&epoch.current===run)player.play();}).catch(()=>{});
   }
  }
  if(state.ticks<lastTick.current)lastAim.current=-100;
  previousHP.current=state.guards.map(g=>g.hp);
  previous.current={shots:c.shots,enemyShots:c.enemyShots,hitEvents:c.hitEvents,damageTaken:c.damageTaken,kills:c.kills,aimEvents:c.aimEvents,commandSeen:c.commandSeen};lastTick.current=state.ticks;
 },[state,enabled,volume,feedbackEnabled,onHaptic,shotA,shotB,enemyA,enemyB,hit,damage,knockout,knockoutB,heavyKO,droneKO,aim]);
}
