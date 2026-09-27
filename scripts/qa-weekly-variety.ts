import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {makeCombatContracts} from '../shared/contracts';
import {solveCombat} from './qa-combat';
import {solveWeeklyRush} from './qa-weekly-rush';
import {verifyReplay} from '../server/replay';
import {checkRuleBundle} from '../server/rule-bundle';
import rules from '../shared/rules-manifest.json';
async function main(){const weeks=Number(process.env.QA_WEEKS??2),results=[];const archived=await import((await checkRuleBundle(rules.rulesHash)).href);for(let w=0;w<weeks;w++)for(const c of makeCombatContracts(new Date(Date.UTC(2026,8,28+w*7)))){console.log('Solving',c.id,c.name,c.generation);const win=solveCombat(c.level)??solveWeeklyRush(c.level);assert(win,`No winning replay found for ${c.id} ${c.name}`);const result=verifyReplay(c.level.mission,win.replay,c.level);assert.equal(result.status,'won');assert.deepEqual(result,archived.verifyReplay(c.level.mission,win.replay,c.level));results.push({id:c.id,name:c.name,generation:c.generation,seconds:win.ticks/30,hp:win.hp,kills:win.kills,pinnedReplayParity:true,replay:win.replay});console.log('WIN',win.ticks/30,'seconds',win.hp,'HP');mkdirSync('verification/weekly-v3',{recursive:true});writeFileSync('verification/weekly-v3/winning-replays.json',JSON.stringify(results));}console.log('All scheduled missions have a verified ordinary-tap win.');}main().catch(e=>{console.error(e);process.exitCode=1});
