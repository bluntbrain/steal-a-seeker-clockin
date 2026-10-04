import test from 'node:test';
import assert from 'node:assert/strict';
import {createHapticGate,ESSENTIAL_CUES,HAPTIC_POLICY,PATTERN_PRIORITY,type HapticCue} from '../src/feedback/haptic-policy';
test('a kill interrupts a knife hit, a hit never interrupts a kill, and each cue keeps its own gap',()=>{
 const allow=createHapticGate();
 assert(allow('melee',0));assert(!allow('melee',60),'hit gap');assert(allow('kill',70),'a higher cue plays within 90 ms');assert(!allow('melee',120),'a lower cue is dropped right after a kill');assert(!allow('kill',200),'kill gap');assert(allow('melee',200));assert(allow('kill',260));
});
test('taps stay light and frequent but never bury a kill or a death',()=>{
 const allow=createHapticGate();
 assert(allow('tapMove',0));assert(!allow('tapMove',30),'tap gap');assert(allow('tapMove',65));assert(allow('kill',70));assert(!allow('tapMove',130),'a tap right after a kill is dropped');assert(allow('caught',140));assert(!allow('kill',200),'nothing lower follows a death inside 90 ms');
});
test('spotted and suspicion are rare; damage still cuts through',()=>{
 const allow=createHapticGate();
 assert(allow('suspicion',0));assert(!allow('suspicion',1000));assert(allow('suspicion',1300));assert(allow('spotted',1310));assert(!allow('spotted',2500));assert(allow('damage',1350));
});
test('priorities put the body cues above every interface cue and patterns above pulses',()=>{
 const ui:HapticCue[]=['tapMove','tapTarget','select','blocked','exitTick','suspicion'],body:HapticCue[]=['kill','stealthKill','bossKill','damage','spotted','success','caught'];
 for(const u of ui)for(const b of body)assert(HAPTIC_POLICY[u].priority<HAPTIC_POLICY[b].priority,`${u} below ${b}`);
 for(const b of body)assert(HAPTIC_POLICY[b].priority>=PATTERN_PRIORITY,b);
 assert(HAPTIC_POLICY.caught.priority>HAPTIC_POLICY.success.priority&&HAPTIC_POLICY.bossKill.priority>HAPTIC_POLICY.kill.priority);
 for(const b of body)assert(ESSENTIAL_CUES.has(b),`${b} survives reduced effects`);assert(!ESSENTIAL_CUES.has('tapMove'));
});
