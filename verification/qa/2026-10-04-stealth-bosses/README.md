# Stealth campaign / boss update QA

- Gameplay suite: 400 passed. Regression covers moving-target wind-up pursuit, collision limits and old replay outcomes. Updated revision assertions intentionally expect 18; legacy fixtures remain unchanged.
- Backend suite: 76 passed against the dedicated `seeker_clockin_test` database. Includes migration 016, refreshing claimed and unclaimed maps, archived lookup, unknown-version rejection and reward deduplication.
- Added a real shipped revision-17 level-13 fixture: its solved replay verifies against the archived map after the new level is current and awards no duplicate credits.
- All 88 levels (13–100) regenerate from stored recipes, have reachable objectives and valid patrol anchors, and have solver wins verified by the pinned rules bundle. Ten cover families are represented. Receipt: `verification/campaign-levels/levels-13-100.json`.
- TypeScript and production web export passed.
- Browser: rounded spinner retained its 28px corners; function-styled mixed corners also retained their shape while loading. Toly's face-visible jump displayed and completed. Local level 15 entered gameplay after its entrance, rendered the denser Four Bays map, accepted movement/target taps and defeated a drone (counter 0/4 → 1/4). Boss rendered overhead with the new blaster art. Console error/warning readback was empty. The manual run was not a win; solver verification is separate.
- Generated seven eight-frame sheets. All seven packed sheets inspected; packing uses the actual transparent row gap to avoid slicing heads. Mert was also inspected composited on an opaque game-colored background.
- Test routes: `/?bossLab=1`, `/?testLevel=13`, `/?testLevel=15`. Restricted to localhost; native has no test-entry override. Test runs do not save progress or award credits.

No APK built. No physical Seeker frame-rate, tactile haptics, or native audio verification. Walking-frame logic is distance-driven and tested; browser review is not a hardware performance claim.
