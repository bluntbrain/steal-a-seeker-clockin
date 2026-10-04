import type {GameState} from '../game/simulation';

export type FootstepSnapshot = Pick<GameState, 'mission' | 'walked' | 'elapsed' | 'ticks' | 'status'>;
// Short strides suit the courier's quick pace: ~5.7 steps/s at 4.1 units/s.
// The guard only prevents duplicate/bunched cues, not normal running cadence.
export const FOOTSTEP_STRIDE = .72;
const MIN_STEP_INTERVAL = .12;
export type FootstepTracker = {
  previous: FootstepSnapshot | null;
  distance: number;
  lastStepAt: number;
  moving: boolean;
  starting: boolean;
  next: 0 | 1;
};
export function freshFootsteps(): FootstepTracker {
  return {previous: null, distance: 0, lastStepAt: -Infinity, moving: false, starting: true, next: 0};
}

/** Presentation only: use actual travel, never taps, velocity intent or a timer loop. */
export function advanceFootsteps(tracker: FootstepTracker, state: FootstepSnapshot, enabled: boolean) {
  const before = tracker.previous;
  const next = {...tracker, previous: {...state}};
  const reset = !enabled || state.status !== 'playing' || !before ||
    before.mission !== state.mission || state.ticks < before.ticks ||
    state.walked < before.walked || state.elapsed - before.elapsed > .5;
  if (reset) return {tracker: {...freshFootsteps(), previous: {...state}}, cue: null, moving: false, reset: true};
  // An unrelated React render is not a simulation update.
  if (state.ticks === before.ticks) return {tracker: next, cue: null, moving: next.moving, reset: false};
  const travelled = state.walked - before.walked;
  if (travelled < .001) {
    return {tracker: {...next, distance: 0, moving: false, starting: true}, cue: null, moving: false, reset: false};
  }
  next.moving = true;
  next.distance += travelled;
  const stride = tracker.starting ? .04 : FOOTSTEP_STRIDE;
  if (next.distance < stride || state.elapsed - tracker.lastStepAt < MIN_STEP_INTERVAL) {
    return {tracker: next, cue: null, moving: true, reset: false};
  }
  // At most one cue per snapshot; missed frames must not create a burst.
  const cue = next.next;
  next.next = cue === 0 ? 1 : 0;
  next.distance = tracker.starting ? 0 : next.distance % FOOTSTEP_STRIDE;
  next.starting = false;
  next.lastStepAt = state.elapsed;
  return {tracker: next, cue, moving: true, reset: false};
}
