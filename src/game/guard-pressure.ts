import type {LevelDefinition} from './level';

// Keep shipped revision 11 timing intact for old APK claims and frozen weeks.
// Revision 12 keeps the alertness/firepower, with a believable running pace.
const PROFILES=[
 {pursuit:4.1,vision:5.2,spot:.24,aim:20,recover:18,damage:25,report:24},
 {pursuit:4.3,vision:5.4,spot:.22,aim:18,recover:17,damage:25,report:23},
 {pursuit:4.5,vision:5.6,spot:.20,aim:17,recover:16,damage:25,report:22},
 {pursuit:4.6,vision:5.8,spot:.20,aim:17,recover:16,damage:27,report:22},
 {pursuit:4.7,vision:6,spot:.18,aim:16,recover:15,damage:28,report:21},
 {pursuit:4.8,vision:6.2,spot:.18,aim:16,recover:15,damage:30,report:21},
] as const;
const RUN_SPEEDS=[2.85,2.95,3.05,3.15,3.25,3.35];
const GROUNDED_PROFILES=PROFILES.map((profile,index)=>({...profile,pursuit:RUN_SPEEDS[index]!}));
export function guardPressure(l:LevelDefinition){
 'worklet';const profiles=(l.combat?.revision??0)>=12?GROUNDED_PROFILES:PROFILES;
 return profiles[l.number<=1?0:l.number===2?1:l.number===3?2:l.number<=6?3:l.number<=9?4:5]!;
}
export function pressureCombat(l:LevelDefinition){'worklet';return (l.combat?.revision??0)>=11;}
export function droneReportTicks(l:LevelDefinition){'worklet';return pressureCombat(l)?guardPressure(l).report:27;}
