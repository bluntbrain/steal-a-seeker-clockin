import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,restoreSettings} from '../src/settings/preferences';

test('new settings and old factory volume start at 100%, preserving mute and accessibility choices',()=>{
 assert.equal(DEFAULT_SETTINGS.volume,1);
 assert.equal(restoreSettings({}).volume,1);
 assert.deepEqual(restoreSettings({volume:.65,sound:false,haptics:false,reducedEffects:true}),{volume:1,sound:false,reducedEffects:true},'an old vibration setting is dropped');
});
test('explicit volume choices survive restoration and malformed volume falls back safely',()=>{
 for(const volume of [0,.25,.5,.75,1])assert.equal(restoreSettings({volume}).volume,volume);
 for(const volume of ['loud',NaN,Infinity])assert.equal(restoreSettings({volume}).volume,1);
 assert.equal(restoreSettings({volume:-1}).volume,0);
 assert.equal(restoreSettings({volume:2}).volume,1);
});
