# Courier walking and footstep regression — 4 October 2026

The carrying branch selected one static frame before checking movement. Walking now takes priority over idle carrying, with a separate phone prop attached to the left hand during walking/attacks. The idle carry sprite retains its built-in phone. The generated walking frames and existing edition textures are reused; there are no new decoded textures.

Gait uses the footstep stride distance. Footstep scheduling now retains small travel increments, starts after 0.04 units, and allows an earned contact sample to finish after ordinary stops. Mute, pause, long gaps, reset and unmount cancel playback. Existing sound gain is raised modestly under music and alerts. Movement physics, damage, economy and rules remain unchanged.

Validation:
- TypeScript passed.
- 17 focused tests passed: courier carrying gait, blocked/idle poses, knife priority, short moves, low-distance accumulation, cadence, lifecycle and existing sprite atlas checks.
- Rules manifest check and production web export passed.
- Browser at `/?build=walking-carry-fix&testMission=practice`: clicked multiple floor destinations, observed movement/walking frames, paused successfully. No browser warnings/errors at inspection.
- Carrying pose selection and prop visibility verified by regression tests; the browser check did not complete the mission or obtain the phone.
- No physical phone-speaker listening or Android frame-time measurement. No APK built.

This change does not implement the proposed loot-v2 effect pack.
