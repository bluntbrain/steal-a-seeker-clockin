import {alarmSpeed,SECURITY} from './level';
import type {GameState} from './simulation';
export function decoyResponders(s:GameState){return s.guards.filter(g=>g.active&&!g.seesPlayer&&g.lureId===s.decoy.id&&(g.mode==='investigate'||g.mode==='search'));}
export function decoyMessage(s:GameState){
 if(s.decoyFeedbackLeft>0&&s.decoyFeedback==='blocked')return 'Throw blocked by cover. Face an open lane; no distraction was used.';
 if(s.decoyFeedbackLeft>0&&s.decoyFeedback==='empty')return 'No distractions left. Use cover and dash to escape.';
 if(s.decoy.ttl<=0)return '';
 const count=decoyResponders(s).length;
 if(count)return `${count} guard${count===1?'':'s'} following the noise · ${Math.ceil(s.decoy.ttl)}s of noise. Move the other way!`;
 if(s.guards.some(g=>g.active&&g.seesPlayer))return 'Break sight first. A guard watching you will ignore the noise.';
 if(s.guards.some(g=>g.active&&g.kind!=='scanner'&&Math.hypot(g.x-s.decoy.x,g.y-s.decoy.y)<=SECURITY.decoyHearing))return 'No guard can reach that beacon. Try another landing spot.';
 return 'No mobile guard in range yet. Throw closer; scanners ignore noise.';
}
export function alarmMessage(s:GameState){
 if(s.alert>0)return 'GUARD HAS SIGHT OF YOU — GET BEHIND COVER';
 if(s.alarmSeconds<4)return 'PHONE THEFT DETECTED — SECURITY ALARM';
 return ['GUARDS ARE SEARCHING FOR THE STOLEN PHONE','SECURITY IS GETTING FASTER — KEEP MOVING','TAP DISTRACT TO DRAW GUARDS AWAY'][Math.floor(s.alarmSeconds/6)%3]!;
}
export function alarmSpeedPercent(s:GameState){return Math.round((alarmSpeed(s.alarmSeconds)-1)*100);}
