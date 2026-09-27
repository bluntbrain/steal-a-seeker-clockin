/** Repeatable reckless-input probes. These measure pressure, not human difficulty. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {combatLevel} from '../src/game/combat-levels';
import {combatTap} from '../src/game/combat';
import {CAMPAIGN_IDS} from '../src/game/level';
import {recordStep} from '../src/game/recording';
import {initialState,idleInput} from '../src/game/simulation';
import {verifyReplay} from '../server/replay';
import type {ReplayChunk} from '../shared/replay';

const results=CAMPAIGN_IDS.map(id=>{
 const level=combatLevel(id);
 const probes=[0,30,90].map(delay=>{
  const state=initialState(id,level),chunks:ReplayChunk[]=[],costs:number[]=[];let seq=0;
  while(state.status==='playing'){
   let command;
   if(state.ticks>=delay&&state.ticks%30===0&&!state.combat!.order){
    const goal=level.switches?.length&&!state.power?level.switches[0]!:state.carrying?{x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2}:level.targets?.[state.delivered]??level.phone;
    command=combatTap(state,goal.x,goal.y,++seq);
   }
   const start=performance.now();recordStep(state,{...idleInput(),command},chunks);costs.push(performance.now()-start);
  }
  const verified=verifyReplay(id,{version:2,chunks},level);
  if(verified.status!==state.status||verified.score!==state.score||verified.hp!==state.combat!.hp)throw Error(`${id}: replay diverged`);
  costs.sort((a,b)=>a-b);
  return {delayTicks:delay,status:state.status,hp:state.combat!.hp,seconds:+(state.ticks/30).toFixed(2),enemyShots:state.combat!.enemyShots,p95StepMs:+costs[Math.floor(costs.length*.95)]!.toFixed(3)};
 });
 console.log(level.number,level.title,probes.map(p=>`${p.status}/${p.hp}HP`).join(' '));
 return {mission:id,number:level.number,revision:level.combat?.revision,probes};
});
mkdirSync('verification/guard-pressure',{recursive:true});
const name=process.argv[2]==='before'?'before':process.argv[2]==='grounded'?'grounded':'after';
writeFileSync(`verification/guard-pressure/${name}.json`,JSON.stringify({description:'Objective-only input probes at three start delays. Not human win rates or Android frame measurements.',results},null,2)+'\n');
