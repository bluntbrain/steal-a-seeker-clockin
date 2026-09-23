import {test} from 'node:test';
import assert from 'node:assert/strict';
import {showPassIntro} from '../src/commerce/pass-intro';
test('optional launch offer never gates owners, skipped sessions or mission diagnostics',()=>{
 assert.equal(showPassIntro({dismissed:false,owned:false,diagnostic:false}),true);
 for(const state of [{dismissed:true,owned:false,diagnostic:false},{dismissed:false,owned:true,diagnostic:false},{dismissed:false,owned:false,diagnostic:true}])assert.equal(showPassIntro(state),false);
 // Account refresh / a wallet switch must not undo the user's Skip.
 for(const owned of [true,false])assert.equal(showPassIntro({dismissed:true,owned,diagnostic:false}),false);
});
