import test from 'node:test';
import assert from 'node:assert/strict';
import {deliverHaptic} from '../src/feedback/deliverHaptic';
import {createHapticGate} from '../src/feedback/haptic-policy';
test('supported feedback does not double fire the fallback',async()=>{const calls:string[]=[];await deliverHaptic(async()=>{calls.push('primary');},async()=>{calls.push('fallback');},()=>true);assert.deepEqual(calls,['primary']);});
test('unsupported Android effect falls back once and never interrupts navigation',async()=>{let calls=0;await deliverHaptic(async()=>{throw Error('unsupported');},async()=>{calls++;throw Error('no actuator');},()=>true);assert.equal(calls,1);});
test('disabling vibration or leaving the app prevents a late fallback',async()=>{let calls=0;await deliverHaptic(async()=>{throw Error('unsupported');},async()=>{calls++;},()=>false);assert.equal(calls,0);});
test('starting a run has its own bounded cue without suppressing a later back tap',()=>{const allow=createHapticGate();assert(allow('start',0));assert(!allow('start',100));assert(allow('select',150));assert(allow('start',300));});
