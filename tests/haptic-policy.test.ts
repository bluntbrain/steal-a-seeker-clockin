import test from 'node:test';
import assert from 'node:assert/strict';
import {createHapticGate} from '../src/feedback/haptic-policy';
test('automatic fire is bounded; damage interrupts it, not the reverse',()=>{const allow=createHapticGate();assert(allow('shot',0));assert(!allow('shot',70));assert(allow('damage',75));assert(!allow('shot',150));assert(!allow('damage',170));assert(allow('shot',220));assert(allow('damage',260));});
test('coin landings and UI taps do not overwhelm confirmation or victory',()=>{const allow=createHapticGate();assert(allow('coin',0));assert(!allow('coin',42));assert(allow('coin',126));assert(allow('confirm',150));assert(!allow('select',170));assert(allow('success',200));assert(!allow('success',400));assert(allow('select',400));});
