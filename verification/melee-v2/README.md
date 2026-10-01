# Knife poses and defeat pickups QA — 2026-10-02

- TypeScript: passed.
- Entire game suite: 365 passed, 0 failed.
- Production web export and replay-rule manifest check: passed.
- New tests cover all 13 alpha atlases, contact/recovery timing, all guard slots across 12 campaign maps, no replay on restore/restart, moving-target coin attraction, bounded pool and reduced effects.
- Browser at 390 × 844: real tap-to-approach drone defeat captured; coins visibly scatter, return and disappear. Normal gameplay movement/combat and pause/resume exercised. No console warnings/errors in the inspected run.
- Full top bar hidden during active play; small pause control remains. Pause returns header without changing board dimensions.
- Observed browser performance after coin build: 60 FPS, p95 17.2 ms, 0 slow frames. This is a desktop browser measurement, not Android performance proof.
- Sound files validated for duration, mono channel and sample rate. Subjective speaker sound quality needs user audition.
- All 12 maps tested through shared defeat-detection tests, not twelve manual playthroughs. Android device and out-of-health UI not re-tested this turn; no APK made.

`evidence/` holds actual browser screenshots. `all-attacks.jpg` shows accepted generated attack poses. Full source prompts and generation metadata are in assets/melee-v2 and assets/audio-loot-v1. Sprite gallery is generated into dist/design/melee-v2 by export; gallery navigation was blocked by the browser client in this run, so no interactive gallery sign-off is claimed.
