import engine from './weekly-engine.json';
import rules from './rules-manifest.json';
import type {Contract} from './contracts';

// Audited against the pinned verifier and the frozen September 14 manifests.
// Do not replace this fingerprint automatically when changing engine code.
export const LEGACY_WEEKLY_ENGINES:Readonly<Record<string,string>>={
 '77efb541f8f64e55b6477981517159be26809f82504d7d140a2b4ef73e88965b':'40a288b52a8979dff7bd9b50ef7a3db21f726d55a40820fe99782e7bb02e711c',
 'a44303bf08233f54f9edc45d156f1d9f7400ab6a00f982dd1355b94cb1a1c26a':'a296f9946955bf07b83bf9a1625f5358b39475f9e82a5093f51f00f7ba4a7431',
 '6def64a8028a9aacdd926441f15e07135318a88609042d9a17a635b94367d354':'49597ca106edeb5ea6de8babaa7566ff7e4031eb275a9ee5de2247a1cfc3b4a7',
 '8c9a48902b47a267149ec1f46d37d25fa3df89f9b2ab1098f9ecaba151dfbae6':'c0c72764afd7c5fa570511141fcf9d4fc52b5a98723f6398bed9f1c3bc557715',
 '5f8cc7939b12bd941e07ed3bca9ed0c0e3fece3892d7272e6cb248f107955d21':'874448d1059a1f2bacaf8f3f1c40bd6e0dd422755d2aa93ba92e44bb8b72f895',
 '7f90be28b3c04449c9b16ad06de65b5bc688aac1c0de36b2e727dd04f394a55b':'cd6dd46f097d3872f3a8e90c4b80a082febef88da20832ab2099ee8c3062e75a',
 '3cd85446cf6d8e15c00fb7e4b57f6d58f4a08b849425ec581ae23d4624fee8cb':'89c109a95f8b038107d76e587f70e06f5379247036594b9a6d7d2fc354b6bd45',
 'fc58093a3480dc87c58673c20c7cf44e34aa75a87c9c92c839f50c7c797a745a':'0932c537fceab0e81e00ed5bc79382aecbb942d853200986723cbca40add5724',
 '8325f1cc68a4847c185a412c1c95f5ec00d2e8b41d80950024b27307902d1d19':'31aa2db9681ec0c978cccd9ceb1d32aa9e7d3f878d8fb49bc80a365c404c5862',
 'f4597c232c4bf00b5c1f2d43be08db491fa37812472b656f3fbfb441ec19db74':'4d7918bb13b7ff7c2a91a5b9f5217896ccaea9b0715e1fb730c766935be8c203',
 'dccdef3f350858895875bb13f786e3e40cbcaa55ce3c91c9acb1f11e8b3da71b':'2dff16c1583573a1d66fa23b3249529d77224ca8da0b997de4834e593cb729f4',
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
export const PRESERVED_REVISION_10_ENGINE='4d7918bb13b7ff7c2a91a5b9f5217896ccaea9b0715e1fb730c766935be8c203';
export const PRESERVED_REVISION_11_ENGINE='31aa2db9681ec0c978cccd9ceb1d32aa9e7d3f878d8fb49bc80a365c404c5862';
export const PRESERVED_REVISION_12_ENGINE='0932c537fceab0e81e00ed5bc79382aecbb942d853200986723cbca40add5724';
export const PRESERVED_REVISION_13_ENGINE='49597ca106edeb5ea6de8babaa7566ff7e4031eb275a9ee5de2247a1cfc3b4a7';
export const PRESERVED_REVISION_14_ENGINE='a296f9946955bf07b83bf9a1625f5358b39475f9e82a5093f51f00f7ba4a7431';
export const PRESERVED_REVISION_15_ENGINE='40a288b52a8979dff7bd9b50ef7a3db21f726d55a40820fe99782e7bb02e711c';
// Revision 16 is frozen in heist-guards.ts; revision 17 lives in its own file. The 4 October fixture replays it.
export const PRESERVED_REVISION_16_ENGINE='2dff16c1583573a1d66fa23b3249529d77224ca8da0b997de4834e593cb729f4';
export type WeeklyCompatibility={rulesHash:string;engineHash?:string;contracts:Contract[]};
export function weeklyEngineHash(manifest:WeeklyCompatibility):string|undefined{
 return manifest.engineHash??(manifest.rulesHash===rules.rulesHash?engine.engineHash:LEGACY_WEEKLY_ENGINES[manifest.rulesHash]);
}
export function isWeeklyCompatible(manifest:WeeklyCompatibility):boolean{
 const legacy=!manifest.engineHash&&manifest.rulesHash!==rules.rulesHash;
 const hash=weeklyEngineHash(manifest),preserved3=hash===PRESERVED_REVISION_3_ENGINE,preserved6=hash===PRESERVED_REVISION_6_ENGINE,preserved7=hash===PRESERVED_REVISION_7_ENGINE,preserved9=hash===PRESERVED_REVISION_9_ENGINE,preserved10=hash===PRESERVED_REVISION_10_ENGINE,preserved11=hash===PRESERVED_REVISION_11_ENGINE,preserved12=hash===PRESERVED_REVISION_12_ENGINE,preserved13=hash===PRESERVED_REVISION_13_ENGINE,preserved14=hash===PRESERVED_REVISION_14_ENGINE,preserved15=hash===PRESERVED_REVISION_15_ENGINE,preserved16=hash===PRESERVED_REVISION_16_ENGINE;
 return (hash===engine.engineHash||preserved3||preserved6||preserved7||preserved9||preserved10||preserved11||preserved12||preserved13||preserved14||preserved15||preserved16)&&manifest.contracts.length===3&&manifest.contracts.every(c=>c.level.combat?.version===2&&[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].includes(c.level.combat.revision??0)&&(!preserved3||c.level.combat.revision===3)&&(!preserved6||(c.level.combat.revision??0)<=6)&&(!preserved7||(c.level.combat.revision??0)<=7)&&(!preserved9||(c.level.combat.revision??0)<=9)&&(!preserved10||(c.level.combat.revision??0)<=10)&&(!preserved11||(c.level.combat.revision??0)<=11)&&(!preserved12||(c.level.combat.revision??0)<=12)&&(!preserved13||(c.level.combat.revision??0)<=13)&&(!preserved14||(c.level.combat.revision??0)<=14)&&(!preserved15||(c.level.combat.revision??0)<=15)&&(!preserved16||(c.level.combat.revision??0)<=16)&&(!legacy||preserved3||preserved6||preserved7||preserved9||preserved10||preserved11||preserved12||preserved13||preserved14||preserved15||preserved16));
}
