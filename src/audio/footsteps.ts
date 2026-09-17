import type {GameState} from '../game/simulation';

export type FootstepSnapshot = Pick<GameState, 'mission' | 'walked' | 'elapsed' | 'ticks' | 'status'>;
export type FootstepTracker = {
  previous: FootstepSnapshot | null;
  distance: number;
  lastStepAt: number;
  moving: boolean;
  next: 0 | 1;
};
export function freshFootsteps(): FootstepTracker {
  return {previous: null, distance: 0, lastStepAt: -Infinity, moving: false, next: 0};
}

/** Presentation only: use actual travel, never taps, velocity intent or a timer loop. */
export function advanceFootsteps(tracker: FootstepTracker, state: FootstepSnapshot, enabled: boolean) {
  const before = tracker.previous;
  const next = {...tracker, previous: {...state}};
  const reset = !enabled || state.status !== 'playing' || !before ||
    before.mission !== state.mission || state.ticks < before.ticks ||
    state.walked < before.walked || state.elapsed - before.elapsed > .5;
  if (reset) return {tracker: {...freshFootsteps(), previous: {...state}}, cue: null, moving: false};
  // An unrelated React render is not a simulation update.
  if (state.ticks === before.ticks) return {tracker: next, cue: null, moving: next.moving};
  const travelled = state.walked - before.walked;
  if (travelled < .015) {
    return {tracker: {...next, distance: 0, moving: false}, cue: null, moving: false};
  }
  next.moving = true;
  next.distance += travelled;
  const stride = tracker.moving ? 1.15 : .12;
  if (next.distance < stride || state.elapsed - tracker.lastStepAt < .24) {
    return {tracker: next, cue: null, moving: true};
  }
  // At most one cue per snapshot; missed frames must not create a burst.
  const cue = next.next;
  next.next = cue === 0 ? 1 : 0;
  next.distance = tracker.moving ? next.distance % 1.15 : 0;
  next.lastStepAt = state.elapsed;
  return {tracker: next, cue, moving: true};
}
