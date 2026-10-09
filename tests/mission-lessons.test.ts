import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_IDS} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {campaignLesson,missionHint,publishedLesson} from '../src/onboarding/mission-lessons';
import {welcomeOffer} from '../src/commerce/welcome-offer';
import {campaignEntries as entriesFor,BUNDLED_LEVELS as BUNDLED} from '../src/campaign/levels';
test('campaign lessons match actual collection, drones and mission mechanics',()=>{
 const lessons=CAMPAIGN_IDS.map(campaignLesson);
 assert.equal(new Set(lessons.map(l=>l.title)).size,12);
 lessons.forEach((l,i)=>{assert.equal(l.edition,i);assert.ok(l.body.length<180);});
 assert.match(lessons[1]!.body,/Hideout → Phones/);
 assert.ok(combatLevel(CAMPAIGN_IDS[2]!).patrols.some(p=>p.combatRole==='drone'));
 assert.ok(combatLevel(CAMPAIGN_IDS[5]!).patrols.some(p=>p.combatRole==='heavy'));
 assert.equal(combatLevel(CAMPAIGN_IDS[7]!).targets?.length,2);
 assert.ok(combatLevel(CAMPAIGN_IDS[8]!).switches?.length);
 assert.ok(combatLevel(CAMPAIGN_IDS[9]!).exitWindow);
});
test('welcome comparison follows both backend prices and rejects missing prices',()=>{
 assert.deepEqual(welcomeOffer(500,1000),{skr:500,usdCents:1000,plannedSkr:1000,plannedUsdCents:2000});
 assert.equal(welcomeOffer(1,10)?.plannedSkr,2);
 assert.equal(welcomeOffer(0,10),null);assert.equal(welcomeOffer(NaN,10),null);
});

test('published levels get a knife lesson from their recipe and bosses are named',async()=>{
 const {campaignEntries,BUNDLED_LEVELS}=await import('../src/campaign/levels');
 const entries=campaignEntries(BUNDLED_LEVELS),plain=publishedLesson(entries[12]!),boss=publishedLesson(entries[14]!);
 assert.equal(plain.kicker,'LEVEL 13');assert.equal(plain.weapon,'knife');assert.equal(plain.body,entries[12]!.definition.briefing);assert.equal(plain.playLabel,'PLAY LEVEL 13  →');assert.equal(plain.edition,0);
 assert.equal(boss.kicker,'LEVEL 15 · BOSS');assert.match(boss.title,/Toly/);assert.match(boss.footer,/double/);
});

test('every level has one short loading hint, and bosses get their own',()=>{
 const entries=entriesFor(BUNDLED);
 assert.equal(missionHint(entries[0]!),'Tap a guard to target it and attack.');
 assert.match(missionHint(entries[1]!),/Drones do not shoot/);
 for(const entry of entries){
  const hint=missionHint(entry);
  assert(hint.length>0&&hint.length<=80,`level ${entry.number} hint stays short enough to read in two seconds`);
  if(entry.boss)assert.match(hint,/strike from behind/);
 }
});
