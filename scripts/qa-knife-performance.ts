import {performance} from 'node:perf_hooks';
import {writeFileSync} from 'node:fs';
import {combatLevel} from '../src/game/combat-levels';
import {initialState,idleInput,step} from '../src/game/simulation';
import {combatTap} from '../src/game/combat';
import {CAMPAIGN_IDS} from '../src/game/level';
// Measures only deterministic engine work, not display FPS or Android hardware.
const results=[0,5,11].map(index=>{
 const l=combatLevel(CAMPAIGN_IDS[index]!),samples:number[]=[];let s=initialState(l.mission,l),seq=0;
 for(let n=0;n<1200;n++){
  if(s.status!=='playing')s=initialState(l.mission,l);
  const g=s.guards.find(g=>g.active&&g.hp>0)!;
  const t=performance.now();step(s,{...idleInput(),command:combatTap(s,g.x,g.y,++seq)});samples.push(performance.now()-t);
 }
 samples.sort((a,b)=>a-b);return {mission:l.mission,scenario:'same-target tap every simulation tick',ticks:1200,p50Ms:samples[600],p95Ms:samples[1140],p99Ms:samples[1188],maxMs:samples[1199]};
});
const report={scope:'Node desktop engine only; not Android frame-rate evidence',results};writeFileSync('verification/knife-v15/engine-performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
