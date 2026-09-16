import {mkdirSync,writeFileSync} from 'node:fs';
import {CAMPAIGN_IDS} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {initialState,idleInput,step} from '../src/game/simulation';
import {combatTap} from '../src/game/combat';
import {solveCombat} from './qa-combat';
import {verifyReplay} from '../server/replay';
import {walkableSegment} from '../src/game/navigation';
const results=CAMPAIGN_IDS.map(id=>{
 const level=combatLevel(id),s=initialState(id,level);let seq=0;
 for(let i=0;i<level.hardLimitSeconds*30&&s.status==='playing';i++){
  let command;if(!s.combat!.order){const p=level.switches?.length&&!s.power?level.switches[0]!:s.carrying?{x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2}:level.targets?.[s.delivered]??level.phone;command=combatTap(s,p.x,p.y,++seq);}
  step(s,{...idleInput(),command});
 }
 for(const g of level.patrols)for(let i=0;i<g.route.length;i++)if(!walkableSegment(g.route[i]!,g.route[(i+1)%g.route.length]!,level))throw Error(`${id} patrol crosses cover`);
 const win=solveCombat(level);if(!win)throw Error(id+' has no verified solution');const verified=verifyReplay(id,win.replay,level);if(verified.status!=='won'||verified.score!==win.score)throw Error('Replay mismatch');
 const result={id,title:level.title,guards:level.patrols.filter(g=>g.reserveAfter===undefined).length,reserves:level.patrols.filter(g=>g.reserveAfter!==undefined).length,blindRush:{status:s.status,hp:s.combat!.hp,seconds:s.ticks/30},solution:{strategy:win.strategy,hp:win.hp,seconds:win.ticks/30,kills:win.kills},replay:win.replay};console.log(result.title,result.blindRush.status,JSON.stringify(result.solution));return result;
});
mkdirSync('verification/difficulty',{recursive:true});writeFileSync('verification/difficulty/level-audit.json',JSON.stringify(results));
writeFileSync('verification/difficulty/levels.json',JSON.stringify(CAMPAIGN_IDS.map(combatLevel)));
if(results.slice(1).filter(r=>r.blindRush.status==='won').length>5)throw Error('Too many blind-rush wins');
