import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeProgress,progressInput} from './progress';
test('campaign sync merges best records independently and is idempotent',()=>{
 const a=progressInput.parse({version:1,missions:{practice:{stars:3,seconds:12,score:12100,battery:80,completions:5}}}),b=progressInput.parse({version:1,missions:{practice:{stars:2,seconds:15,score:12200,battery:90,completions:2}}});
 const merged=mergeProgress(a,b);assert.deepEqual(merged.missions.practice,{stars:3,seconds:12,score:12200,battery:90,completions:5});assert.deepEqual(mergeProgress(merged,b),merged);
});
test('sync rejects malformed stars, negative times and unknown missions',()=>{
 for(const item of [{stars:4,seconds:1},{stars:2,seconds:-3}])assert(!progressInput.safeParse({version:1,missions:{practice:{score:1,battery:100,completions:1,...item}}}).success);
 assert(!progressInput.safeParse({version:1,missions:{invented:{stars:1,seconds:1,score:1,battery:100,completions:1}}}).success);
});
