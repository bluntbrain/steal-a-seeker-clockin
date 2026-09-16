import test from 'node:test';import assert from 'node:assert/strict';
import {combatSoundEvents} from '../src/audio/combat-events';
const zero={shots:0,enemyShots:0,hitEvents:0,damageTaken:0,kills:0,aimEvents:0,commandSeen:0};
test('combat audio distinguishes outgoing hits from player damage and collapses bursts',()=>{assert.deepEqual(combatSoundEvents(zero,{...zero,shots:3,hitEvents:2}),['shot','hit']);assert.deepEqual(combatSoundEvents(zero,{...zero,enemyShots:3,damageTaken:40}),['enemy','damage']);});
test('KO replaces impact sound; resetting and routine taps are silent',()=>{assert.deepEqual(combatSoundEvents(zero,{...zero,hitEvents:1,kills:1}),['knockout']);assert.deepEqual(combatSoundEvents({...zero,kills:10,shots:20},zero),[]);assert.deepEqual(combatSoundEvents(zero,{...zero,commandSeen:5}),[]);});
