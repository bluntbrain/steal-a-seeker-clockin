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
 assert.deepEqual(parseProgress('{"version":1,"missions":{"practice":{"stars":99}}}'),freshProgress());
});
