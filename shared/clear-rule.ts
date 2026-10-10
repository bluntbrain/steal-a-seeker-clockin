// kill-all exit rule: from level 2 the final exit stays shut until every guard is down. it lives outside the pinned
// game rules, so published levels and older replays stay valid: the app steps the courier back out of the exit, and
// the server refuses a won run that left any guard standing. level 1 stays the guided tutorial
import type {GameState} from '../src/game/simulation';
import type {CombatCommand} from '../src/game/combat';
import type {Point} from '../src/game/level';
import {findPath} from '../src/game/navigation';
import {intersectsBox} from '../src/game/geometry';

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

/** a tap that would walk into a shut exit (the exit itself or a floor spot inside it) explains the rule instead */
export function blocksTap(s:GameState,c:CombatCommand|null|undefined){'worklet';return !!c&&exitShut(s)&&(c.kind==='exit'||c.kind==='move'&&insideExit({x:c.x,y:c.y,definition:s.definition},.4));}

// the simulation drops a move it cannot path to (combat.ts setPath: validPoint, then findPath) without a word,
// so the retreat checks the same before it is sent
function reachable(s:GameState,p:Point){'worklet';const l={...s.definition!,blockers:s.blockers};return p.x>.65&&p.y>.65&&p.x<l.width-.65&&p.y<l.height-.65&&!l.blockers.some(b=>intersectsBox(p.x,p.y,b,.32))&&findPath(s,p,l).length>0;}

/** where to retreat: the last spot clear of the exit, else the phone's spot, else the spawn */
export function retreatPoint(s:GameState,back:Point,skipBack=false):Point{
 'worklet';
 const l=s.definition!,candidates=skipBack?[l.phone,l.spawn]:[back,l.phone,l.spawn];
 for(const p of candidates)if(!insideExit({x:p.x,y:p.y,definition:l},.3)&&reachable(s,p))return p;
 return l.phone;
}

/** a move out of the shut exit, or null when the exit may be used */
export function exitGuard(s:GameState,back:Point,seq:number,skipBack=false):CombatCommand|null{
 'worklet';
 if(!exitShut(s)||!insideExit(s))return null;
 const p=retreatPoint(s,back,skipBack);
 return {seq,kind:'move',target:-1,x:p.x,y:p.y};
}

export type ExitWatch={epoch:number;issued:number;at:number;backX:number;backY:number};
/** the app's exit guard for one frame, shared with the tests and the solvers. it resets when a new run starts, keeps the
 * retreat point and issues one recorded move per entry. a newer player command inside the exit gets a fresh move, and a
 * courier still inside well into the extraction hold gets another that avoids the retreat point */
export function watchExit(s:GameState,w:ExitWatch,epoch:number,lastSeq:number):CombatCommand|null{
 'worklet';
 if(w.epoch!==epoch){w.epoch=epoch;w.issued=0;w.at=-99;const p=s.definition?.phone;w.backX=p?.x??s.x;w.backY=p?.y??s.y;}
 if(!insideExit(s,EXIT_CLEARANCE)){w.backX=s.x;w.backY=s.y;}
 if(!s.carrying)return null;
 const stuck=s.extraction>.3&&s.ticks-w.at>=6;
 if(lastSeq===w.issued&&w.issued>0&&!stuck)return null;
 const guard=exitGuard(s,{x:w.backX,y:w.backY},lastSeq+1,stuck);
 if(guard){w.issued=guard.seq;w.at=s.ticks;}
 return guard;
}
