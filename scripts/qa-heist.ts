/** Ordinary-input diagnostics. No HP, position, guard or time overrides. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {CAMPAIGN_IDS} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {initialState,idleInput} from '../src/game/simulation';
import {combatTap} from '../src/game/combat';
import {recordStep} from '../src/game/recording';
import {verifyReplay} from '../server/replay';
import type {ReplayChunk} from '../shared/replay';
import {solveCombat} from './qa-combat';

const results=CAMPAIGN_IDS.map(id=>{
 const level=combatLevel(id),probes=[];
 for(const delay of [0,30,90]){
  const s=initialState(id,level),chunks:ReplayChunk[]=[],costs:number[]=[];let seq=0;
  for(let t=0;t<level.hardLimitSeconds*30&&s.status==='playing';t++){
   let command;
   if(t>=delay&&t%30===0&&!s.combat!.order){const p=level.switches?.length&&!s.power?level.switches[0]!:s.carrying?{x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2}:level.targets?.[s.delivered]??level.phone;command=combatTap(s,p.x,p.y,++seq);}
   const start=performance.now();recordStep(s,{...idleInput(),command},chunks);costs.push(performance.now()-start);
  }
  const replay={version:2 as const,chunks},verified=verifyReplay(id,replay,level);if(verified.status!==s.status||verified.score!==s.score)throw Error(`${id}: direct replay mismatch`);
  costs.sort((a,b)=>a-b);
  probes.push({delayTicks:delay,status:s.status,hp:s.combat!.hp,seconds:+(s.ticks/30).toFixed(2),shots:s.combat!.shots,enemyShots:s.combat!.enemyShots,damage:s.combat!.damageTaken,responses:s.guards.filter((g,i)=>level.patrols[i]?.reserveAfter!==undefined&&g.spawned).length,stepP95Ms:+costs[Math.floor(costs.length*.95)]!.toFixed(3),stepMaxMs:+costs.at(-1)!.toFixed(3)});
 }
 const win=solveCombat(level);if(!win)throw Error(`${id}: no ordinary-input win found`);
 const verified=verifyReplay(id,win.replay,level);if(verified.status!=='won'||verified.score!==win.score)throw Error(`${id}: winning replay mismatch`);
 console.log(level.number,level.title,probes.map(p=>`${p.status}/${p.hp}HP`).join(' '),`combat win ${win.hp}HP`);
 return {mission:level.number,title:level.title,id,revision:level.combat?.revision,probes,win};
});
mkdirSync('verification/heist-encounters',{recursive:true});writeFileSync('verification/heist-encounters/campaign.json',JSON.stringify({description:'Automated input probes, not human difficulty ratings or phone performance measurements.',results},null,2));
