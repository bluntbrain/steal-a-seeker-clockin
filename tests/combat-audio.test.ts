import test from 'node:test';import assert from 'node:assert/strict';
import {combatSoundEvents} from '../src/audio/combat-events';
const zero={shots:0,enemyShots:0,hitEvents:0,damageTaken:0,kills:0,aimEvents:0,commandSeen:0};
test('combat audio distinguishes outgoing hits from player damage and collapses bursts',()=>{assert.deepEqual(combatSoundEvents(zero,{...zero,shots:3,hitEvents:2}),['shot','hit']);assert.deepEqual(combatSoundEvents(zero,{...zero,enemyShots:3,damageTaken:40}),['enemy','damage']);});
test('KO replaces impact sound; resetting and routine taps are silent',()=>{assert.deepEqual(combatSoundEvents(zero,{...zero,hitEvents:1,kills:1}),['knockout']);assert.deepEqual(combatSoundEvents({...zero,kills:10,shots:20},zero),[]);assert.deepEqual(combatSoundEvents(zero,{...zero,commandSeen:5}),[]);});

test('knife swings, contact and armor get separate cues without a courier gunshot',()=>{
 const before={shots:0,enemyShots:0,hitEvents:0,damageTaken:0,kills:0,aimEvents:0,commandSeen:0};
 assert.deepEqual(combatSoundEvents(before,{...before,melee:{swings:1,hits:0,blocks:0}}),['swing']);
 assert.deepEqual(combatSoundEvents(before,{...before,hitEvents:1,melee:{swings:1,hits:1,blocks:0}}),['swing','slash']);
 assert.deepEqual(combatSoundEvents(before,{...before,melee:{swings:1,hits:0,blocks:1}}),['swing','clang']);
});
