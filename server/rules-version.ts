import {readFile} from 'node:fs/promises';
import {URL} from 'node:url';
import {createHash} from 'node:crypto';
import {CAMPAIGN_IDS,getLevel} from '../src/game/level';
import {checkRuleBundle} from './rule-bundle';
export const RULE_FILES=['src/game/level.ts','src/game/combat.ts','src/game/combat-levels.ts','src/game/simulation.ts','src/game/guards.ts','src/game/geometry.ts','src/game/navigation.ts','shared/replay.ts','server/replay.ts'];
// Weekly runs supply their entire level definition. Campaign map data is not
// part of their engine compatibility, but remains in the archived rules hash.
export const WEEKLY_ENGINE_FILES=RULE_FILES.filter(file=>file!=='src/game/combat-levels.ts');
export async function currentWeeklyEngine(){
 const hash=createHash('sha256');
 for(const file of WEEKLY_ENGINE_FILES){hash.update(file+'\0');hash.update((await readFile(new URL(`../${file}`,import.meta.url),'utf8')).replace(/\r\n/g,'\n'));hash.update('\0');}
 return {version:1,engineHash:hash.digest('hex')};
}
export async function currentRules(){
 const hash=createHash('sha256');
 for(const file of RULE_FILES){hash.update(file+'\0');hash.update((await readFile(new URL(`../${file}`,import.meta.url),'utf8')).replace(/\r\n/g,'\n'));hash.update('\0');}
 return {version:1 as const,rulesHash:hash.digest('hex'),levelHashes:Object.fromEntries(CAMPAIGN_IDS.map(id=>[id,createHash('sha256').update(JSON.stringify(getLevel(id))).digest('hex')]))};
}
export async function assertRulesCurrent(){const actual=await currentRules(),expected=JSON.parse(await readFile(new URL('../shared/rules-manifest.json',import.meta.url),'utf8'));if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error('Ranked rules manifest is stale. Generate a new rules version before serving runs.');await checkRuleBundle(actual.rulesHash);return actual;}
