// kill-all exit rule: from level 2 the final exit stays shut until every guard is down. it lives outside the pinned
// game rules, so published levels and older replays stay valid: the app steps the courier back out of the exit, and
// the server refuses a won run that left any guard standing. level 1 stays the guided tutorial
import type {GameState} from '../src/game/simulation';
import type {CombatCommand} from '../src/game/combat';

export const CLEAR_ALL_FROM_LEVEL=2;
export const requiresClearAll=(level:number)=>level>=CLEAR_ALL_FROM_LEVEL;
// a published definition keeps its zone edition in number; its campaign level is in the id (campaign:13)
export const campaignLevelOf=(d:{id:string;number:number})=>Number(/^campaign:(\d+)$/.exec(d.id)?.[1]??d.number);

// kills rise exactly once per guard death (dead guards cannot be hit again), so this matches the server's count
export function guardsLeft(s:Pick<GameState,'guards'|'combat'>){'worklet';return Math.max(0,s.guards.length-(s.combat?.kills??0));}

/** true while carrying the last phone with guards still standing; earlier phones in multi-phone levels may be delivered */
export function exitShut(s:GameState){'worklet';return !!s.combat&&s.status==='playing'&&s.carrying&&s.delivered+1>=(s.definition?.targets?.length??1)&&guardsLeft(s)>0;}

export function insideExit(s:GameState){'worklet';const e=s.definition?.exit;return !!e&&s.x>=e.x&&s.x<=e.x+e.w&&s.y>=e.y&&s.y<=e.y+e.h;}

/** a move back to where the courier last stood outside the exit, issued before the extraction hold can finish */
export function exitGuard(s:GameState,back:{x:number;y:number},seq:number):CombatCommand|null{
 'worklet';
 if(!exitShut(s)||!insideExit(s))return null;
 return {seq,kind:'move',target:-1,x:Math.round(back.x*100)/100,y:Math.round(back.y*100)/100};
}
