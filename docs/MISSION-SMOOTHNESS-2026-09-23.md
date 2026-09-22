# Mission loading and tap performance — 23 September 2026

## Fixed

Mission changes now suspend simulation and cover the board until the new wall, floor, phone and courier images have loaded and the canvas has had two animation frames to paint. The canvas remounts per mission/restart, and late HUD callbacks from an older scene are rejected. A 12-second watchdog offers a retry if loading stalls. No mission timer runs behind the loading screen.

Tap gestures now store the newest destination instead of doing path searches directly in every touch callback. The frame loop processes at most one destination every 80 ms, ignores short duplicate taps and discards pending input on pause/mission changes. Ordinary first taps process on the next frame. There is no queue of obsolete paths.

Wall-edge destination refinement reuses the existing reachability flood instead of repeating a full path search for every candidate. Mission initial state and menu levels are memoized. The canvas compiles one static map picture after the wall texture is ready. Game-state notifications only run on simulation ticks; replay updates are batched per frame.

## Evidence

- TypeScript check and all 227 app tests passed.
- Replay rules manifest check passed; deterministic simulation fingerprints are unchanged.
- Browser warehouse-to-rooftop and rooftop-to-vault transitions showed the mission loading overlay with the timer at zero, followed by the correct map.
- A burst of 12 floor/wall taps stayed responsive. Browser frame statistics showed 119 FPS, p95 9.2 ms and zero slow frames in that desktop session. This is not a before/after phone performance result.
- Latest exported browser build loaded successfully with no captured console errors.
- A small Node benchmark of 30 wall taps in each of 12 campaign maps averaged 0.5473 ms before and 0.3646 ms after (33.4% less time). Raw samples are in verification/mission-smoothness-2026-09-23. These desktop measurements are indicative, not a statistically controlled mobile benchmark.
- Reproduce the current benchmark with `npx tsx scripts/benchmark-taps.ts /tmp/seeker-taps.json`.

## Android release

Signed mainnet APK: `releases/steal-a-seeker-mainnet-v0.3.9-code12.apk`.
Package: `com.bluntbrain.stealaseeker`; version 0.3.9, code 12.
SHA-256: `f3f653d8f09c57fc5b43164f0321e7beb1edab194dba62146d1d581b1cf1575c`.
Signing certificate matches the existing distribution certificate.

No Android phone was connected. Physical-device startup, rapid-tap performance and thermal/frame pacing checks remain unverified. No backend change or deployment was needed for this fix.
