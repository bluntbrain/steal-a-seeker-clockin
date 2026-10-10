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

/** reinforcements still outside count as standing guards; they enter only once the courier keeps clear of their door */
export function reinforcementsPending(s:GameState){'worklet';return s.guards.some((g,i)=>g.hp>0&&!g.spawned&&s.definition?.patrols[i]?.reserveAfter!==undefined);}

// the retreat point is a spot the courier stood on well clear of the exit, so rounding can never put it on the edge
export const EXIT_CLEARANCE=.6;
export function insideExit(s:Pick<GameState,'x'|'y'|'definition'>,margin=0){'worklet';const e=s.definition?.exit;return !!e&&s.x>=e.x-margin&&s.x<=e.x+e.w+margin&&s.y>=e.y-margin&&s.y<=e.y+e.h+margin;}

/** a move back to the retreat point (or the phone's spot if that point is not clearly outside), or null */
export function exitGuard(s:GameState,back:{x:number;y:number},seq:number):CombatCommand|null{
 'worklet';
 if(!exitShut(s)||!insideExit(s))return null;
 const p=insideExit({x:back.x,y:back.y,definition:s.definition},.3)?s.definition!.phone:back;
 return {seq,kind:'move',target:-1,x:Math.round(p.x*100)/100,y:Math.round(p.y*100)/100};
}

export type ExitWatch={epoch:number;issued:number;backX:number;backY:number};
/** the app's exit guard for one frame, shared with the tests and the solvers. it resets when a new run starts, keeps the
 * retreat point and issues one recorded move per entry; a newer player command inside the exit gets a fresh one */
export function watchExit(s:GameState,w:ExitWatch,epoch:number,lastSeq:number):CombatCommand|null{
 'worklet';
 if(w.epoch!==epoch){w.epoch=epoch;w.issued=0;const p=s.definition?.phone;w.backX=p?.x??s.x;w.backY=p?.y??s.y;}
 if(!insideExit(s,EXIT_CLEARANCE)){w.backX=s.x;w.backY=s.y;}
 if(!s.carrying||lastSeq===w.issued&&w.issued>0)return null;
 const guard=exitGuard(s,{x:w.backX,y:w.backY},lastSeq+1);
 if(guard)w.issued=guard.seq;
 return guard;
}
