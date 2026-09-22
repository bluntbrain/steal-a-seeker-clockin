import {CAMPAIGN_IDS,type MissionId} from '../game/level';
import {recordWin,type Progress} from '../progress/model';
import type {GameState} from '../game/simulation';
export function completedCampaign(progress:Progress,state:GameState){const result=recordWin(progress,state);return state.status==='won'&&state.mission===CAMPAIGN_IDS[CAMPAIGN_IDS.length-1]&&CAMPAIGN_IDS.every(id=>!!result.missions[id]);}
export function campaignSummary(progress:Progress,state:GameState){
 const result=recordWin(progress,state);return CAMPAIGN_IDS.reduce((a,id)=>{const b=result.missions[id];if(b){a.cleared++;a.stars+=b.stars;a.score+=b.score;a.seconds+=b.seconds;}return a;},{cleared:0,stars:0,score:0,seconds:0});
}
export function nextCampaignMission(mission:MissionId):MissionId|undefined{const i=CAMPAIGN_IDS.indexOf(mission);return i<0?undefined:CAMPAIGN_IDS[i+1];}
