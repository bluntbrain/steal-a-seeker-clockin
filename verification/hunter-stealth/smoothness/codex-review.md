Two regressions need fixes.

1. **P1 — Slim HUD snapshots corrupt tutorial checkpoints.** [GameScreen.tsx:218](/Users/bluntbrain/Documents/code/clockin/seeker-game/src/GameScreen.tsx:218) removes guard paths and brains, but [useCombatGuide.ts:39](/Users/bluntbrain/Documents/code/clockin/seeker-game/src/onboarding/useCombatGuide.ts:39) persists that HUD as simulation state. Later lesson checkpoints therefore contain empty paths and no planner memory. Retry, app resume, and `guide.start()` restore those incomplete guards.

   This changes behavior, rather than merely reducing checkpoint detail. I stepped the actual practice simulation for 180 ticks, cloned full and slim snapshots, then advanced both for 30 ticks. One guard ended at approximately `(10.005, 1.416)` from the full checkpoint versus `(10.485, 2.811)` from the slim checkpoint. Planner reinitialization cannot recover the original route or memory.

   **Fix:** Preserve complete snapshots while the tutorial can capture checkpoints, or give checkpoint capture a separate full-state channel. Introduce a distinct HUD type so an incomplete snapshot cannot silently satisfy the simulation-state contract. Invalidate or migrate checkpoints already saved with stripped fields.

2. **P2 — The topmost map scene now fades into the background.** [CampaignMap.tsx:32](/Users/bluntbrain/Documents/code/clockin/seeker-game/src/components/CampaignMap.tsx:32) always renders faded artwork, including when `previousZone === null`. Previously, that scene bypassed the mask. At a 360px map width, approximately 81px of its top now fades into the underlying background.

   **Fix:** Pack an opaque variant for scenes without a predecessor. Choose it based on `previousZone`, since the topmost zone changes as the campaign grows.

The remaining checks:

- **`levelRef`:** No demonstrated restart race. `restart()` closes `sceneReady`; the new keyed canvas reopens it after rendering, when `levelRef` has updated. Queued old snapshots fail the epoch check. Assigning `levelRef.current = stateLevel(fresh)` inside `restart()` would make this invariant explicit.
- **JS consumers:** Apart from checkpoint restoration, I found no consumer requiring stripped guard fields. `publish()` reattaches `definition` before notifying React or `onSnapshot`.
- **Worklets:** Both changed files transform successfully with the installed Babel configuration. The nested callbacks execute within the UI worklet; `NO_PATH` is captured but never mutated. In-place array updates through `modify` are supported. [Reanimated documentation](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/shared-values/)
- **Ring buffer:** Correct before filling, after wrapping, and after restart. Resetting count/index excludes stale slots without clearing the array.
- **Relay comparison:** Equivalent for existing channels 0 and 1. It would miss higher channels; `SwitchSpec.channel` currently permits arbitrary numbers.
- **Map geometry:** The assets are exactly 1:3. The negative offset exposes the previous image’s final `fade` pixels inside the current row. Row clipping preserves that strip without depending on the preceding FlatList cell remaining mounted.
- **Mask math:** `dest-in` multiplies source alpha by mask alpha. The normalized gradient reaches opacity at approximately 7.5%; decoded assets confirm that. No inverted-mask error.
- **Camera:** The scalar calculation matches `frameCourier`, including its clamp and the existing follow tolerance.

All 10 targeted camera/map-layout tests passed. Native scrolling and runtime performance were not tested.

**FIX FIRST**