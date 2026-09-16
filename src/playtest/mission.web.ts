import {CAMPAIGN_IDS,type MissionId} from '../game/level';
/** Local browser review only. This module never ships as Android entitlement logic. */
export function localTestMission():MissionId|undefined{
 if(typeof window==='undefined'||!['localhost','127.0.0.1','::1'].includes(window.location.hostname))return;
 const id=new URLSearchParams(window.location.search).get('testMission');return CAMPAIGN_IDS.find(m=>m===id);
}
