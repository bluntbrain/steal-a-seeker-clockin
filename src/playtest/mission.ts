// native qa builds can open straight on one level: EXPO_PUBLIC_TEST_LEVEL is inlined at build time and unset in releases
import {BUNDLED_LEVELS,campaignEntries} from '../campaign/levels';
import {CAMPAIGN_IDS,type MissionId} from '../game/level';
const level=Number(process.env.EXPO_PUBLIC_TEST_LEVEL??0);
export function localTestMission():MissionId|undefined{return level>=1&&level<=12?CAMPAIGN_IDS[level-1]:localTestEntry()?.mission;}

export function localTestEntry():import('../campaign/levels').CampaignEntry|undefined{return level>12?campaignEntries(BUNDLED_LEVELS).find(e=>e.number===level):undefined;}
