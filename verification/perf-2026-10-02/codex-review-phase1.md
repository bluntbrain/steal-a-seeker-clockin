- **P2 — `src/GameScreen.tsx:208`: fabricated simulation time.** Replacing a null delta with `1000/60` adds 16.67 ms on initial activation, resume, and callback re-registration. Two activations can contribute a simulation tick without measured elapsed time; tap timing and FPS statistics also change. Null denotes the first callback, not a measured display interval ([Reanimated documentation](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback/)). **Fix:** retain the null early return. Memoizing the callback already addresses registration churn.

- **P2 — `src/components/MissionFocus.tsx:10–15`: hidden ring still runs reactive work.** Returning `null` unmounts the Canvas, but all four `useDerivedValue` hooks remain mounted. In particular, `cx` and `cy` keep reacting to simulation and camera updates throughout gameplay. The “costs nothing” comment is false. **Fix:** move the derived values and Canvas into a child mounted only while `active`; retain only the progress reaction in the wrapper.

- **P3 — `src/GameScreen.tsx:225`: missed per-frame allocation.** `[...game.value.relayTimers]` still allocates every display frame, including frames without a simulation step. **Fix:** capture event-comparison state only when a step will run, and reuse a UI-owned relay buffer. Keep this optimization outside the deterministic simulation.

- **P3 — `src/camera/useFollowCamera.ts:15`: stationary frames still allocate.** `frameCourier(...)` constructs a target object before `followCamera` can return the existing camera. The identity check avoids downstream notifications, not this allocation. **Fix:** calculate target coordinates as scalars and allocate only when committing a changed camera.

The explicit worklet directives and callback dependencies look sound. The ref wrappers execute through `runOnJS`; they do not read React refs on the UI thread. No newly introduced unsafe worklet default parameter or JS-only call is evident.

Panel memoization reduces parent-driven fan-out, but context updates and changing object props still bypass it.

No `src/game` or `shared/` changes appear in this diff. Replay shape and server APIs remain unchanged; the fabricated delta changes live input-to-tick timing, not deterministic replay execution. No backend incompatibility or rules-hash change is evident.

FIX FIRST