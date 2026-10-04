import {solveTactical} from './qa-tactical';
import {writeFileSync,mkdirSync} from 'node:fs';
import {CAMPAIGN_IDS,type LevelDefinition,type Point} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {initialState,idleInput,stateLevel} from '../src/game/simulation';
import {combatTap,type CombatCommand} from '../src/game/combat';
import {recordStep} from '../src/game/recording';
import {sightDistance} from '../src/game/guards';
import bundled from '../src/campaign/published-levels.json';
import {verifyReplay} from '../server/replay';
import type {ReplayChunk} from '../shared/replay';
// Produces ordinary recorded taps. No position, health, damage or score overrides.
export function solveCombat(level:LevelDefinition){
 for(let strategy=0;strategy<6;strategy++){
  const s=initialState(level.mission,level),chunks:ReplayChunk[]=[];let seq=0,stage=-1,waypoints:Point[]=[],at=0;
  for(let frame=0;frame<level.hardLimitSeconds*30&&s.status==='playing';frame++){
   let command:CombatCommand|undefined;
   if(frame%6===0){
    const current=s.combat!,destination=s.carrying?{x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2}:level.targets?.[s.delivered]??level.phone;
    const phase=s.delivered*2+Number(s.carrying);
    if(phase!==stage){stage=phase;at=0;const lane=strategy%3===1?1.2:10.8;waypoints=strategy%3===0?[destination]:[{x:lane,y:s.y},{x:lane,y:destination.y},destination];}
    while(at<waypoints.length-1&&Math.hypot(s.x-waypoints[at]!.x,s.y-waypoints[at]!.y)<.3)at++;
    const target=s.guards.map((g,i)=>({g,i,d:Math.hypot(g.x-s.x,g.y-s.y)})).filter(({g,d})=>g.active&&g.hp>0&&g.combatRole!=='drone'&&d<(strategy<3?4:3.1)&&sightDistance(s.x,s.y,(g.x-s.x)/d,(g.y-s.y)/d,d,{...level,blockers:s.blockers})>=d-1e-7).sort((a,b)=>a.d-b.d)[0];
    if(target){if(current.order?.kind!=='attack'||current.order.target!==target.i)command=combatTap(s,target.g.x,target.g.y,++seq);}
    else if(current.order?.kind!=='attack'){
     const goal=waypoints[at]!;let next=combatTap(s,goal.x,goal.y,seq+1);
     if(level.switches?.length&&!s.power){const pad=level.switches[0]!;next=combatTap(s,pad.x,pad.y,seq+1);}
     if(!current.order||current.order.kind!==next.kind||Math.hypot(current.order.x-next.x,current.order.y-next.y)>.1){seq++;command=next;}
    }
   }
   recordStep(s,{...idleInput(),command},chunks);
  }
  if(s.status==='won')return {strategy,ticks:s.ticks,hp:s.combat!.hp,kills:s.combat!.kills,score:s.score,replay:{version:2 as const,chunks}};
 }
 return solveTactical(level);
}
if(process.argv[1]?.endsWith('qa-combat.ts')){
 const results=[...CAMPAIGN_IDS.map(combatLevel),...bundled.levels.map(l=>l.definition as LevelDefinition)].map(level=>{const win=solveCombat(level);if(win){const r=verifyReplay(level.mission,win.replay,level);if(r.status!=='won'||r.score!==win.score)throw Error('Replay mismatch');}console.log(level.title,win?`${win.ticks/30}s · ${win.hp} HP · ${win.kills} KOs`:'NO WIN FOUND');return {id:level.id,win};});
 mkdirSync('verification/combat',{recursive:true});writeFileSync('verification/combat/solvability.json',JSON.stringify(results));if(results.some(r=>!r.win))process.exitCode=1;
}
