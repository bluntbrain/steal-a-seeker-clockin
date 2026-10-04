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
test('sync accepts published level keys from 13 upward and rejects keys below the published range',()=>{
 const record={stars:2,seconds:40,score:900,battery:70,completions:1};
 assert(progressInput.safeParse({version:1,missions:{'campaign:13':record,'campaign:200':record}}).success);
 for(const key of ['campaign:12','campaign:0','campaign:-1','campaign:1.5','campaign:'])assert(!progressInput.safeParse({version:1,missions:{[key]:record}}).success,key);
 const merged=mergeProgress({version:1,missions:{'campaign:13':record}},progressInput.parse({version:1,missions:{practice:record,'campaign:13':{...record,stars:3}}}));
 assert.deepEqual(Object.keys(merged.missions).sort(),['campaign:13','practice']);assert.equal(merged.missions['campaign:13']!.stars,3);
});
