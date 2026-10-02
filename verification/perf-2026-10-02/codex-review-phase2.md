- **P2 — `src/components/GuardLayer.tsx:57`: cone translation breaks wall occlusion.** Rays are clipped against stationary blockers at the tick position, then `coneShift` translates the entire clipped polygon. When a guard moves toward a wall, the translated endpoints can extend through it; moving away creates a gap. Fix: raycast from the interpolated origin, or accept tick-rate cone movement without translating the clipped geometry.

- **P2 — `src/components/GateMechanism.tsx:14`: initial synchronization is skipped.** `open` samples the gate during React render, but the reaction ignores its first UI-thread observation because `previous === null`. If the gate changes between those moments, its panels remain incorrect until another gate transition. Fix: on the first observation, assign `open.value = closed ? 0 : 1`; animate subsequent changes.

- **P3 — `src/components/ActorHealthBars.tsx:11` and `GuardLayer.tsx:57`: per-frame allocations remain.** Every transform evaluation creates an array and two objects per actor. Health-state separation reduces work, but this is not allocation-free interpolation. Consider reusable transform buffers supported by Skia, and measure native frame times before claiming the allocation problem is solved.

The `usePathValue` conversions are valid: installed Skia resets paths before invoking callbacks, so early returns clear previous drawings. The callbacks explicitly declare `'worklet'`; the captured `enemy` boolean is safe. [Skia hook documentation](https://shopify.github.io/react-native-skia/docs/animations/hooks/).

**Rules/backend:** the prompt’s hash premise does not match this checkout: `server/rules-version.ts:6` explicitly lists hashed files and excludes `shared/contracts.ts`. This constant therefore does **not** change the current rules hash. No simulation mutation appears in the diff. Raising the route limit fixes admission of longer IDs; the new test should additionally exercise `/league/start`, since testing the constant alone cannot detect a disconnected route schema.

No new React state updates or obvious re-render fan-out were introduced. Native rendering/audio behavior was not runtime-tested.

**FIX FIRST**