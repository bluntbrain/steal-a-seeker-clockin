import rules from '../shared/rules-manifest.json';
import {combatLevel} from '../src/game/combat-levels';
import {CAMPAIGN_IDS,type MissionId} from '../src/game/level';
// Keep the immediately preceding published campaign earning its original stars
// while players install the scout update. Verification still uses its pinned bundle;
// campaign_credit_stars prevents earning the same mission reward twice across versions.
export const PRE_SCOUT_RULES='7f90be28b3c04449c9b16ad06de65b5bc688aac1c0de36b2e727dd04f394a55b';
const previousTargets=[100,65,65,65,65,65,65,100,80,80,80,80];
export function campaignCreditTarget(hash:string,mission:MissionId):number|undefined{
 if(hash===rules.rulesHash)return combatLevel(mission).targetSeconds;
 if(hash===PRE_SCOUT_RULES)return previousTargets[CAMPAIGN_IDS.indexOf(mission)];
 return undefined;
}
