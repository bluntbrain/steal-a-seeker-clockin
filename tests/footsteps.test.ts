import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceFootsteps, freshFootsteps, type FootstepSnapshot} from '../src/audio/footsteps';

const snapshot = (ticks: number, walked: number, status: FootstepSnapshot['status'] = 'playing'): FootstepSnapshot =>
  ({ticks, elapsed: ticks / 30, walked, status, mission: 'practice'});

test('footsteps require travel, alternate feet, and do not replay on other UI renders', () => {
  let tracker = advanceFootsteps(freshFootsteps(), snapshot(0, 0), true).tracker;
  const cues: number[] = [];
  for (let ticks = 4; ticks <= 120; ticks += 4) {
    const state = snapshot(ticks, ticks / 30 * 4.1);
    const update = advanceFootsteps(tracker, state, true);
    tracker = update.tracker;
    if (update.cue !== null) cues.push(update.cue);
    assert.equal(advanceFootsteps(tracker, state, true).cue, null);
  }
  assert(cues.length >= 21 && cues.length <= 24,`Expected a brisk run, got ${cues.length} steps in four seconds`);
  assert(cues.every((cue, i) => cue === i % 2));
  const stopped = advanceFootsteps(tracker, snapshot(124, 16.4), true);
  assert.equal(stopped.cue, null); assert.equal(stopped.moving, false);
});

test('pause, mute, result, restart and a long gap discard accumulated footsteps', () => {
  const start = advanceFootsteps(freshFootsteps(), snapshot(30, 4), true).tracker;
  const moving = advanceFootsteps(start, snapshot(34, 4.5), true).tracker;
  for (const [state, enabled] of [
    [snapshot(38, 5), false], [snapshot(38, 5, 'won'), true],
    [snapshot(38, 5, 'caught'), true], [snapshot(0, 0), true], [snapshot(100, 15), true],
    [{...snapshot(38, 5), mission: 'cone-lesson'}, true],
  ] as [FootstepSnapshot, boolean][]) {
    const result = advanceFootsteps(moving, state, enabled);
    assert.equal(result.cue, null); assert.equal(result.moving, false);
    assert.equal(result.tracker.distance, 0);
  }
  const muted = advanceFootsteps(moving, snapshot(38, 5), false).tracker;
  assert.equal(advanceFootsteps(muted, snapshot(38, 5), true).cue, null);
});

test('carrying pace is slower, stationary shooting and blocked travel are silent', () => {
  const count = (speed: number) => {
    let tracker = freshFootsteps(), total = 0;
    for (let ticks = 0; ticks <= 300; ticks += 4) {
      const result = advanceFootsteps(tracker, snapshot(ticks, ticks / 30 * speed), true);
      tracker = result.tracker; if (result.cue !== null) total++;
    }
    return total;
  };
  assert(count(4.1) >= 54 && count(4.1) <= 59,'Normal running should land about 5–6 steps per second');
  assert(count(3.15) >= 41 && count(3.15) <= 46,'Carrying should slow the cadence with actual speed');
  assert.equal(count(0), 0);
  assert.equal(count(.005), 0);
});

test('cadence follows distance across HUD refresh rates without catch-up bursts',()=>{
 const count=(cadence:number)=>{
  let tracker=freshFootsteps(),cues=0,last=-Infinity;
  for(let ticks=0;ticks<=300;ticks+=cadence){
   const update=advanceFootsteps(tracker,snapshot(ticks,ticks/30*4.1),true);tracker=update.tracker;
   if(update.cue!==null){assert(ticks/30-last>=.12-1e-9);last=ticks/30;cues++;}
  }
  return cues;
 };
 assert(Math.abs(count(1)-count(4))<=1,'Changing HUD frequency must not halve footsteps');
 let tracker=advanceFootsteps(freshFootsteps(),snapshot(0,0),true).tracker;
 const late=advanceFootsteps(tracker,snapshot(12,1.64),true);
 assert.notEqual(late.cue,null);tracker=late.tracker;
 assert.equal(advanceFootsteps(tracker,snapshot(12,1.64),true).cue,null,'A repeated late frame cannot replay a burst');
});
