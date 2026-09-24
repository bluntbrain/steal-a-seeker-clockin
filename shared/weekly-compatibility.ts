import engine from './weekly-engine.json';
import rules from './rules-manifest.json';
import type {Contract} from './contracts';

// Audited against the pinned verifier and the frozen September 14 manifests.
// Do not replace this fingerprint automatically when changing engine code.
export const LEGACY_WEEKLY_ENGINES:Readonly<Record<string,string>>={
 '8c9a48902b47a267149ec1f46d37d25fa3df89f9b2ab1098f9ecaba151dfbae6':'c0c72764afd7c5fa570511141fcf9d4fc52b5a98723f6398bed9f1c3bc557715',
 '5f8cc7939b12bd941e07ed3bca9ed0c0e3fece3892d7272e6cb248f107955d21':'874448d1059a1f2bacaf8f3f1c40bd6e0dd422755d2aa93ba92e44bb8b72f895',
 '7f90be28b3c04449c9b16ad06de65b5bc688aac1c0de36b2e727dd04f394a55b':'cd6dd46f097d3872f3a8e90c4b80a082febef88da20832ab2099ee8c3062e75a',
 '3cd85446cf6d8e15c00fb7e4b57f6d58f4a08b849425ec581ae23d4624fee8cb':'89c109a95f8b038107d76e587f70e06f5379247036594b9a6d7d2fc354b6bd45',
};
// Revision 3 keeps its original mechanics. Its winning and delayed replays
// are compared with the archived verifier in weekly-compatibility.test.ts.
export const PRESERVED_REVISION_3_ENGINE='874448d1059a1f2bacaf8f3f1c40bd6e0dd422755d2aa93ba92e44bb8b72f895';
// Moving drones are gated to revision 7. Revisions 3–6 retain their old branch;
// frozen revision-6 wins and delayed runs are checked against its archived bundle.
export const PRESERVED_REVISION_6_ENGINE='cd6dd46f097d3872f3a8e90c4b80a082febef88da20832ab2099ee8c3062e75a';
export const PRESERVED_REVISION_7_ENGINE='c0c72764afd7c5fa570511141fcf9d4fc52b5a98723f6398bed9f1c3bc557715';
// The archived revision-9 campaign and weekly fixtures cover the last engine.
// Revision-10 behavior uses a separate branch and cannot run under this hash.
export const PRESERVED_REVISION_9_ENGINE='89c109a95f8b038107d76e587f70e06f5379247036594b9a6d7d2fc354b6bd45';
export type WeeklyCompatibility={rulesHash:string;engineHash?:string;contracts:Contract[]};
export function weeklyEngineHash(manifest:WeeklyCompatibility):string|undefined{
 return manifest.engineHash??(manifest.rulesHash===rules.rulesHash?engine.engineHash:LEGACY_WEEKLY_ENGINES[manifest.rulesHash]);
}
export function isWeeklyCompatible(manifest:WeeklyCompatibility):boolean{
 const legacy=!manifest.engineHash&&manifest.rulesHash!==rules.rulesHash;
 const hash=weeklyEngineHash(manifest),preserved3=hash===PRESERVED_REVISION_3_ENGINE,preserved6=hash===PRESERVED_REVISION_6_ENGINE,preserved7=hash===PRESERVED_REVISION_7_ENGINE,preserved9=hash===PRESERVED_REVISION_9_ENGINE;
 return (hash===engine.engineHash||preserved3||preserved6||preserved7||preserved9)&&manifest.contracts.length===3&&manifest.contracts.every(c=>c.level.combat?.version===2&&[3,4,5,6,7,8,9,10].includes(c.level.combat.revision??0)&&(!preserved3||c.level.combat.revision===3)&&(!preserved6||(c.level.combat.revision??0)<=6)&&(!preserved7||(c.level.combat.revision??0)<=7)&&(!preserved9||(c.level.combat.revision??0)<=9)&&(!legacy||preserved3||preserved6||preserved7||preserved9));
}
