import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_IDS} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {campaignLesson,weeklyLesson} from '../src/onboarding/mission-lessons';
import {makeCombatContracts} from '../shared/contracts';
import {welcomeOffer} from '../src/commerce/welcome-offer';
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
test('weekly lessons use current server-authored objectives, without promising collection rewards',()=>{
 for(const c of makeCombatContracts(new Date('2026-09-21T00:00:00Z'))){const l=weeklyLesson(c);assert.equal(l.body,c.objective);assert.equal(l.title,c.name);assert.equal(l.collection,false);assert.match(l.footer,/only when you start/);}
});
test('welcome comparison follows both backend prices and rejects missing prices',()=>{
 assert.deepEqual(welcomeOffer(500,1000),{skr:500,usdCents:1000,plannedSkr:1000,plannedUsdCents:2000});
 assert.equal(welcomeOffer(1,10)?.plannedSkr,2);
 assert.equal(welcomeOffer(0,10),null);assert.equal(welcomeOffer(NaN,10),null);
});
