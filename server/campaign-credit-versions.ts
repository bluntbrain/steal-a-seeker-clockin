import rules from '../shared/rules-manifest.json';
import {combatLevel,legacyCombatLevel} from '../src/game/combat-levels';
import {CAMPAIGN_IDS,type MissionId} from '../src/game/level';
// Keep the immediately preceding published campaign earning its original stars
// while players install the scout update. Verification still uses its pinned bundle;
// campaign_credit_stars prevents earning the same mission reward twice across versions.
export const PRE_SCOUT_RULES='7f90be28b3c04449c9b16ad06de65b5bc688aac1c0de36b2e727dd04f394a55b';
const previousTargets=[100,65,65,65,65,65,65,100,80,80,80,80];
const roamingTargets=[100,75,75,75,90,90,90,125,90,100,100,100];
export function campaignCreditTarget(hash:string,mission:MissionId):number|undefined{
 // Preserve the pre-targeting campaign rewards during rollout.
 if(hash==='a44303bf08233f54f9edc45d156f1d9f7400ab6a00f982dd1355b94cb1a1c26a'||hash==='6def64a8028a9aacdd926441f15e07135318a88609042d9a17a635b94367d354')return [100,65,65,80,80,80,80,115,95,95,95,95][CAMPAIGN_IDS.indexOf(mission)];
 if(hash===rules.rulesHash)return combatLevel(mission).targetSeconds;
 // Code 36 (revision 16 guards) keeps its thresholds while the revision 17 campaign rolls out.
 if(hash==='dccdef3f350858895875bb13f786e3e40cbcaa55ce3c91c9acb1f11e8b3da71b')return [100,65,65,80,80,80,80,115,95,95,95,95][CAMPAIGN_IDS.indexOf(mission)];
 // Codes 29–32 retain their original sight ranges and reward thresholds.
 if(hash==='07efc6e9b1a109c2af85397b2a0b87633c6378f6236d8533f5a29835068b79fd')return [100,65,65,80,80,80,80,115,95,95,95,95][CAMPAIGN_IDS.indexOf(mission)];
 // Code 28 retains its original pace and rewards as district speed boosts ship.
 if(hash==='fc58093a3480dc87c58673c20c7cf44e34aa75a87c9c92c839f50c7c797a745a')return [100,65,65,80,80,80,80,115,95,95,95,95][CAMPAIGN_IDS.indexOf(mission)];
 // Code 27 keeps its faster revision-11 replay and original credit thresholds.
 if(hash==='8325f1cc68a4847c185a412c1c95f5ec00d2e8b41d80950024b27307902d1d19')return [100,65,65,80,80,80,80,115,95,95,95,95][CAMPAIGN_IDS.indexOf(mission)];
 // Keep the shipped 0.3.23 campaign claims working during the pressure update.
 if(hash==='f4597c232c4bf00b5c1f2d43be08db491fa37812472b656f3fbfb441ec19db74')return [100,65,65,80,80,80,80,115,95,95,95,95][CAMPAIGN_IDS.indexOf(mission)];
 // The first local heist build remains verifiable after pursuit is corrected.
 if(hash==='823fd367df66595100be15112e238859fbd716c649c21aba5b86a22a6d4748f0')return [100,65,65,80,80,80,80,115,95,95,95,95][CAMPAIGN_IDS.indexOf(mission)];
 // The contact-tracking campaign retains its original star thresholds while
 // the revision-10 encounter campaign rolls out. Claims still deduplicate.
 if(hash==='3cd85446cf6d8e15c00fb7e4b57f6d58f4a08b849425ec581ae23d4624fee8cb')return roamingTargets[CAMPAIGN_IDS.indexOf(mission)];
 // 0.3.18 roaming maps keep their original first-clear rewards after the
 // contact-tracking patch. Its replay is always checked by the archived engine.
 if(hash==='2f1ddb3558e47bf719db7e44744192414fcce8f0f91d05c61f37996c6f4a5125')return roamingTargets[CAMPAIGN_IDS.indexOf(mission)];
 if(hash==='8c9a48902b47a267149ec1f46d37d25fa3df89f9b2ab1098f9ecaba151dfbae6')return legacyCombatLevel(mission).targetSeconds;
 if(hash===PRE_SCOUT_RULES)return previousTargets[CAMPAIGN_IDS.indexOf(mission)];
 return undefined;
}
