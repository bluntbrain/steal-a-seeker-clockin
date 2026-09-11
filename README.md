# Steal a Seeker · Night Shift prototype

A native React Native / Skia Android game with two selectable modes on the same warehouse layout. **Quiet Pickup** is the unguarded practice room. **Night Shift** adds two patrol bots, cover-aware sight cones, an alert meter, and a caught/retry loop. These are two mission rulesets, not two distinct room layouts.

[Play locally](http://127.0.0.1:8787) · [v0.2 ARM64 test APK](releases/steal-a-seeker-0.2.0-arm64.apk) · [Next milestones](BUILD-PLAN.md) · [Verification](verification/night-shift.md).

## Play

Drag the left stick. Stop by the glowing phone and hold **TAKE** for 0.4 seconds. Carry it to **EXIT** and stay inside for one second. **DASH** costs 20 charge with a two-second cooldown. Zero charge still permits walking and extraction. Reset replays the selected mission. Choose Practice or Night Shift above the room; changing missions starts a fresh run.

Web: **WASD / arrows**, **E** to hold pickup, **Space** to dash, **Esc** to pause, **R** to reset. Tap the FPS label for p95 frame time. Sound can be muted. Carrying is slower (2.6 versus 3.2 tiles/second). The score target is 60 seconds; the hard limit is 120 seconds.

In Night Shift, amber cones show where guards can see. Walls, racks and crates block their view. Exposure fills a guard's alert in 0.8 seconds; get out of sight before it fills to avoid capture. Suspecting guards stop while watching the courier. When you break sight, alert drains and patrol resumes. Pause/backgrounding freezes both guards and the player. There is no pursuit pathfinding yet.

## Run and build

Use a supported Node version (20.19.4+ in Node 20.x works here), Java 17 and Android SDK 36. Dependencies are pinned by package-lock.json: Expo SDK 55, RN 0.83.10, Skia 2.4.18, Reanimated 4.2.1 and Worklets 0.7.4.

- `npm ci`
- `npm start` — Metro, port 8082.
- `npm run web` — browser playtest.
- `npm run android` — build/install on an emulator or phone.
- `npm run build:apk` — standalone release-mode test APK.
- `npm run export:web` — static output in dist.
- `npm run preview` — serve the export locally at http://127.0.0.1:8787.

Set ANDROID_HOME or ignored android/local.properties (`sdk.dir=/your/Android/sdk`). The Android project targets ARM64, matching Seeker and the local emulator. Test APKs use the generated development key, not a production store signing identity. Allow several GB of free disk for Gradle's intermediate native libraries.

## Verify

`npm run typecheck` and `npm test` cover types and mechanics. `node scripts/playtest.cjs` tests actual pointer/keyboard controls through extraction and retry, plus desktop/phone layouts. It requires Playwright and Chrome; PLAYWRIGHT_MODULE, CHROME_PATH and MVP_URL can override local defaults. It has read-only diagnostics, no teleport or forced-win path.

`node scripts/playtest-patrol.cjs` additionally checks mission switching, capture, frozen patrols, retry and an actual-input escape. `scripts/playtest-patrol-android.py` checks native touch capture/retry/background pause on the observed emulator layout. Verification evidence lives in verification/. Chrome/emulator measurements do not establish physical-Seeker performance. The on-screen counter makes device testing possible.

## Implementation

`src/game/level.ts` is the map/tuning source. `simulation.ts` implements a fixed 30 Hz worklet-compatible simulation, normalized input, acceleration, wall sliding, collision substeps, pickup, battery/dash, extraction and score. Android runs it on Reanimated's UI runtime; Skia interpolates positions at display cadence. React updates the HUD rather than moving the sprite each frame.

`guards.ts` shares wall-ray intersections between visibility rules and the clipped Skia cones in `GuardLayer.tsx`. Patrol simulation runs at the same fixed step and resets deterministically.

`assets/warehouse-floor-v1.png` provides the textured warehouse floor. `art.ts` records reusable obstacle/environment shapes once above it. `GameCanvas.tsx` draws the atlas and effects. `GameScreen.tsx` handles controls, audio, pause/retry and statistics. All runtime assets are local. The broader research remains in ../seeker-plan/.

The FPS display measures UI frame-callback cadence over the latest 120 frames, not GPU presentation. Native build flags omit C++ debug symbols to keep ARM64 intermediates compact. The renderer and gameplay remain intact.

## Not built yet

Persistent progression, distinct additional room layouts, wallet integration, SKR purchases/rewards, backend run verification and an online leaderboard. The prototype is private test access, not the planned commercial paywall. See `BUILD-PLAN.md` for the order of implementation and release gates.
