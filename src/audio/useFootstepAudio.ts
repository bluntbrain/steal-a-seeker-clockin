import {useEffect, useRef} from 'react';
import type {GameState} from '../game/simulation';
import {advanceFootsteps, freshFootsteps} from './footsteps';
import {useGameAudio} from './useGameAudio';

export function useFootstepAudio(state: GameState, enabled: boolean, volume: number) {
  const left = useGameAudio(require('../../assets/audio-footsteps/step-a.wav'));
  const right = useGameAudio(require('../../assets/audio-footsteps/step-b.wav'));
  const tracker = useRef(freshFootsteps()), epoch = useRef(0), allowed = useRef(false);
  allowed.current = enabled && volume > 0 && state.status === 'playing';

  useEffect(() => () => {
    allowed.current = false;
    epoch.current++;
    left.pause(); right.pause();
  }, [left, right]);

  useEffect(() => {
    const result = advanceFootsteps(tracker.current, state, allowed.current);
    tracker.current = result.tracker;
    // Slightly duck under combat and alarms; keep the targeting cue intelligible.
    const gain = Math.max(0, Math.min(1, volume)) * (state.alert > 0 ? .22 : state.securityAlarm ? .28 : .36);
    left.volume = gain; right.volume = gain;
    if (!result.moving) {
      epoch.current++;
      left.pause(); right.pause();
      return;
    }
    if (result.cue === null) return;
    const player = result.cue === 0 ? left : right, run = ++epoch.current;
    void player.seekTo(0).then(() => {
      if (allowed.current && epoch.current === run) player.play();
    }).catch(() => {});
  }, [state, enabled, volume, left, right]);
}
