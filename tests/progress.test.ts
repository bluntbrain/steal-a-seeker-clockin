import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,recordWin,unlocked,starsFor,parseProgress} from '../src/progress/model';
import {initialState} from '../src/game/simulation';
test('completion unlocks next mission; retries preserve independent personal bests',()=>{
 const initial=freshProgress(),run=initialState();assert(!unlocked(initial,'cone-lesson'));assert.equal(recordWin(initial,run),initial);
 Object.assign(run,{status:'won',battery:60,elapsed:30,score:12000});const once=recordWin(initial,run);assert.equal(starsFor(run),3);assert(unlocked(once,'cone-lesson'));assert(!unlocked(once,'battery-dash'));
 Object.assign(run,{battery:0,elapsed:80,score:9000,spotted:true});const twice=recordWin(once,run);assert.deepEqual(twice.missions.practice,{stars:3,seconds:30,score:12000,battery:60,completions:2});assert.deepEqual(parseProgress(JSON.stringify(twice)),twice);
});
test('mastery needs clean time; malformed and future saves do not silently reset',()=>{
 const s=initialState();Object.assign(s,{status:'won',battery:40,elapsed:60,spotted:true});assert.equal(starsFor(s),2);s.spotted=false;assert.equal(starsFor(s),3);s.battery=39;assert.equal(starsFor(s),2);
 assert.throws(()=>parseProgress('{'));assert.throws(()=>parseProgress('{"version":2,"missions":{}}'));
 assert.throws(()=>parseProgress('{"version":1,"missions":{"practice":{"stars":99}}}'));
});

test('published levels save under their own key, merge beside the twelve and reject keys below the published range',()=>{
 const {progressKeyOf,mergeBests,validProgressKey}=require('../src/progress/model') as typeof import('../src/progress/model');
 const {makeCampaignRecipe,buildCampaignLevel}=require('../shared/campaign-levels') as typeof import('../shared/campaign-levels');
 const level=buildCampaignLevel(makeCampaignRecipe(13)),run=initialState(level.mission,level);
 assert.equal(progressKeyOf(run),'campaign:13');assert.equal(progressKeyOf(initialState('practice')),'practice');
 run.status='won';run.elapsed=40;run.score=500;run.battery=80;if(run.combat)run.combat.hp=80;
 const saved=recordWin(freshProgress(),run);assert.deepEqual(Object.keys(saved.missions),['campaign:13']);assert.equal(saved.missions.practice,undefined);
 const merged=mergeBests(saved,parseProgress(JSON.stringify({version:1,missions:{practice:{stars:1,seconds:9,score:1,battery:50,completions:1},'campaign:13':{stars:3,seconds:50,score:1,battery:50,completions:2},'campaign:5':{stars:3,seconds:1,score:1,battery:50,completions:1},bogus:{stars:1,seconds:1,score:1,battery:1,completions:1}}})));
 assert.deepEqual(Object.keys(merged.missions).sort(),['campaign:13','practice']);assert.equal(merged.missions['campaign:13']!.stars,3);assert.equal(merged.missions['campaign:13']!.seconds,40);
 assert(validProgressKey('campaign:200')&&!validProgressKey('campaign:12')&&!validProgressKey('campaign:x'));
});
