import test from 'node:test';
import assert from 'node:assert/strict';
import {readAccount,progressKey} from '../src/commerce/account-model';
import {freshProgress,mergeBests} from '../src/progress/model';
test('cached access and equipment remain bound to the selected wallet',()=>{
 const a={wallet:'A',entitlements:['campaign','night-courier'],equipment:{outfit:'signal-runner',trail:'escape-trail'},progress:{}};
 assert.equal(readAccount(a,'B'),undefined);
 assert.deepEqual(readAccount(a,'A')?.equipment,{});
 assert.deepEqual(readAccount({...a,equipment:{outfit:'night-courier'}},'A')?.equipment,{outfit:'night-courier'});
 assert.equal(readAccount({...a,entitlements:['invented']},'A'),undefined);
 assert.notEqual(progressKey('A'),progressKey('B'));
 assert.notEqual(progressKey(),progressKey('A'));
});
test('cloud restore preserves newer local bests and repeated merges do not add completions',()=>{
 const local={...freshProgress(),missions:{practice:{stars:2,seconds:12,score:12000,battery:55,completions:4}}};
 const cloud={...freshProgress(),missions:{practice:{stars:3,seconds:15,score:11000,battery:70,completions:2}}};
 const merged=mergeBests(local,cloud);
 assert.deepEqual(merged.missions.practice,{stars:3,seconds:12,score:12000,battery:70,completions:4});
 assert.equal(mergeBests(merged,cloud),merged);
 assert.equal(mergeBests(merged,freshProgress()),merged);
});

test('a server-awarded Ghost Courier outfit survives account caching without a shop purchase',()=>{
 const value=readAccount({wallet:'test-wallet',entitlements:['campaign'],equipment:{outfit:'ghost-courier'},progress:{}},'test-wallet');assert.equal(value?.equipment.outfit,'ghost-courier');
});
