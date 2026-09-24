import type {GameState} from '../game/simulation';
export function encounterHint(s:GameState):string|undefined{
 if((s.definition?.combat?.revision??0)<10)return;
 if(s.guards.some(g=>g.hp>0&&!g.spawned&&(g.heist?.arrivalUntil??0)>0))return 'RESPONSE INBOUND · KEEP CLEAR OF THE DOORS';
 if(s.guards.some(g=>g.hp>0&&(g.heist?.broadcastUntil??0)>s.ticks))return 'DRONE REPORT SENT · ALL ENEMIES HUNTING';
 if(s.guards.some(g=>g.hp>0&&(g.heist?.charge??0)>0))return 'DRONE REPORT CHARGING · BREAK SIGHT';
 if(s.guards.some(g=>g.flash>0&&g.heist?.armorHit==='front'))return 'FRONT ARMOR · FLANK TO THE MINT WEAK POINT';
 if(s.guards.some(g=>g.flash>0&&g.heist?.armorHit==='rear'))return 'REAR WEAK POINT · CLEAN HIT';
 if(s.combat?.hunt)return 'SPOTTED · ALL ENEMIES HUNTING';
 if((s.combat?.grateNoise?.until??0)>s.ticks)return 'METAL GRATE · NEARBY GUARDS HEARD YOU';
}
