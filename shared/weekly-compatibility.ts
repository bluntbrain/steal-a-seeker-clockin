import engine from './weekly-engine.json';
import rules from './rules-manifest.json';
import type {Contract} from './contracts';

// Audited against the pinned verifier and the frozen September 14 manifests.
// Do not replace this fingerprint automatically when changing engine code.
export const LEGACY_WEEKLY_ENGINES:Readonly<Record<string,string>>={
 '5f8cc7939b12bd941e07ed3bca9ed0c0e3fece3892d7272e6cb248f107955d21':'874448d1059a1f2bacaf8f3f1c40bd6e0dd422755d2aa93ba92e44bb8b72f895',
};
// Revision 3 keeps its original mechanics. Its winning and delayed replays
// are compared with the archived verifier in weekly-compatibility.test.ts.
export const PRESERVED_REVISION_3_ENGINE='874448d1059a1f2bacaf8f3f1c40bd6e0dd422755d2aa93ba92e44bb8b72f895';
export type WeeklyCompatibility={rulesHash:string;engineHash?:string;contracts:Contract[]};
export function weeklyEngineHash(manifest:WeeklyCompatibility):string|undefined{
 return manifest.engineHash??(manifest.rulesHash===rules.rulesHash?engine.engineHash:LEGACY_WEEKLY_ENGINES[manifest.rulesHash]);
}
export function isWeeklyCompatible(manifest:WeeklyCompatibility):boolean{
 const legacy=!manifest.engineHash&&manifest.rulesHash!==rules.rulesHash;
 const hash=weeklyEngineHash(manifest),preserved=hash===PRESERVED_REVISION_3_ENGINE;
 return (hash===engine.engineHash||preserved)&&manifest.contracts.length===3&&manifest.contracts.every(c=>c.level.combat?.version===2&&[3,4,5,6].includes(c.level.combat.revision??0)&&(!(legacy||preserved)||c.level.combat.revision===3));
}
