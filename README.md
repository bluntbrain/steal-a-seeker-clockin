# Steal a Seeker · level-one MVP

One native React Native / Skia gameplay screen, with a matching web playtest. The single mission is **Quiet Pickup**, an unguarded warehouse as specified in the design. This private development build tests movement and extraction; production wallet/economy features are outside this slice.

**Ready:** [local browser](http://127.0.0.1:8787) · [ARM64 test APK](releases/steal-a-seeker-0.1.0-arm64.apk) · [verification and performance limits](verification/README.md).

## Play

Drag the left stick. Stop by the glowing phone and hold **TAKE** for 0.4 seconds. Carry it to **EXIT** and stay inside for one second. **DASH** costs 20 charge with a two-second cooldown. Zero charge still permits walking and extraction. Reset replays this same level.

Web: **WASD / arrows**, **E** to hold pickup, **Space** to dash, **Esc** to pause, **R** to reset. Tap the FPS label for p95 frame time. Sound can be muted. Carrying is slower (2.6 versus 3.2 tiles/second). The score target is 60 seconds; the hard limit is 120 seconds.

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

Verification evidence lives in verification/. Chrome/emulator measurements do not establish physical-Seeker performance. The on-screen counter makes device testing possible.

## Implementation

`src/game/level.ts` is the map/tuning source. `simulation.ts` implements a fixed 30 Hz worklet-compatible simulation, normalized input, acceleration, wall sliding, collision substeps, pickup, battery/dash, extraction and score. Android runs it on Reanimated's UI runtime; Skia interpolates positions at display cadence. React updates the HUD rather than moving the sprite each frame.

`assets/warehouse-floor-v1.png` provides the textured warehouse floor. `art.ts` records reusable obstacle/environment shapes once above it. `GameCanvas.tsx` draws the atlas and effects. `GameScreen.tsx` handles controls, audio, pause/retry and statistics. All runtime assets are local. The broader research remains in ../seeker-plan/.

The FPS display measures UI frame-callback cadence over the latest 120 frames, not GPU presentation. Native build flags omit C++ debug symbols to keep ARM64 intermediates compact. The renderer and gameplay remain intact.
