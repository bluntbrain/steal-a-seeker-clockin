import {CAMPAIGN_IDS,type MissionId} from '../src/game/level';
import type {LeaderboardEntry} from './ranked';
export function dailyMission(date:Date):MissionId{
 const day=Math.floor(date.getTime()/86400000);
 if(!Number.isFinite(day))throw new Error('Invalid daily date');
 return CAMPAIGN_IDS[((day%CAMPAIGN_IDS.length)+CAMPAIGN_IDS.length)%CAMPAIGN_IDS.length]!;
}
export function dailyResetLabel(endsAt:string,now=Date.now()){
 const remaining=Math.max(0,Math.ceil((Date.parse(endsAt)-now)/60000));
 if(!Number.isFinite(remaining))return 'Reset time unavailable';
 return remaining===0?'New daily available · refresh':`Resets in ${Math.floor(remaining/60)}h ${remaining%60}m · 00:00 UTC`;
}
export function rivalGap(personal:LeaderboardEntry,rival:LeaderboardEntry|null|undefined){
 if(!rival)return 'You share the top rank. Keep your cleanest run.';
 if(rival.score>personal.score)return `${rival.score-personal.score} points to match rank #${rival.rank}; time breaks a tie.`;
 return `${((personal.ticks-rival.ticks)/30).toFixed(2)}s faster to match rank #${rival.rank}.`;
}
