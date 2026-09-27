import type {LevelDefinition} from './level';

/** Authored district progression, never account state or a repeat-clear counter.
 * Weekly definitions use different IDs and keep the same speed for everyone. */
export function courierSpeedBonus(level:LevelDefinition):number{
 'worklet';
 if((level.combat?.revision??0)<13||level.id!==`combat-v2:${level.mission}`||level.mission==='night-shift'||level.number<1||level.number>12)return 0;
 return Math.min(2,Math.floor((level.number-1)/4))*8;
}

export function courierSpeedMultiplier(level:LevelDefinition):number{
 'worklet';return 1+courierSpeedBonus(level)/100;
}
