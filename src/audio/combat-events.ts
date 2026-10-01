export type CombatSoundCounters={melee?:{swings:number;hits:number;blocks:number};shots:number;enemyShots:number;hitEvents:number;damageTaken:number;kills:number;aimEvents:number;commandSeen:number};
export type CombatSound='swing'|'slash'|'clang'|'shot'|'enemy'|'hit'|'damage'|'knockout'|'aim';
/** One event per cue per HUD update. Never replay a whole burst after resuming. */
export function combatSoundEvents(before:CombatSoundCounters,after:CombatSoundCounters):CombatSound[]{
 const cues:CombatSound[]=[];
 if((after.melee?.swings??0)>(before.melee?.swings??0))cues.push('swing');
 if((after.melee?.blocks??0)>(before.melee?.blocks??0))cues.push('clang');
 if((after.melee?.hits??0)>(before.melee?.hits??0)&&after.kills===before.kills)cues.push('slash');
 if(after.shots>before.shots)cues.push('shot');
 if(after.enemyShots>before.enemyShots)cues.push('enemy');
 if(after.damageTaken>before.damageTaken)cues.push('damage');
 if(after.kills>before.kills)cues.push('knockout');
 else if(!after.melee&&after.hitEvents>before.hitEvents)cues.push('hit');
 if(after.aimEvents>before.aimEvents)cues.push('aim');
 return cues;
}
