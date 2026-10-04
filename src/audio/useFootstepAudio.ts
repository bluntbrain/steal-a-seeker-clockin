import {useEffect, useRef} from 'react';
import type {GameState} from '../game/simulation';
import {advanceFootsteps, freshFootsteps} from './footsteps';
import {useGameAudio} from './useGameAudio';

export function useFootstepAudio(state: GameState, enabled: boolean, volume: number) {
  const left = useGameAudio(require('../../assets/audio-footsteps/step-a.wav'));
  const right = useGameAudio(require('../../assets/audio-footsteps/step-b.wav'));
  const tracker = useRef(freshFootsteps()), epoch = useRef(0), allowed = useRef(false), lastGain = useRef(-1), hasPlayback = useRef(false);
  allowed.current = enabled && volume > 0 && state.status === 'playing';

  useEffect(() => () => {
    allowed.current = false;
    epoch.current++;
    left.pause(); right.pause();
  }, [left, right]);

  useEffect(() => {
    const result = advanceFootsteps(tracker.current, state, allowed.current);
    tracker.current = result.tracker;
    // Keep actual travel audible under the music, with modest ducking during combat.
    const gain = Math.max(0, Math.min(1, volume)) * (state.alert > 0 ? .52 : state.securityAlarm ? .58 : .65);
    // native volume writes and pauses only on change; this effect runs on every hud publish
    if (gain !== lastGain.current) { lastGain.current = gain; left.volume = gain; right.volume = gain; }
    if (result.reset) {
      epoch.current++;
      if(hasPlayback.current){left.pause(); right.pause();hasPlayback.current=false;}
      return;
    }
    // A short move may finish before the 240ms sample does. Let that earned
    // contact finish; only pause/mute/reset cancels it (including a pending seek).
    if (result.cue === null) return;
    hasPlayback.current = true;
    const player = result.cue === 0 ? left : right, run = ++epoch.current;
    void player.seekTo(0).then(() => {
      if (allowed.current && epoch.current === run) player.play();
    }).catch(() => {});
  }, [state, enabled, volume, left, right]);
}
