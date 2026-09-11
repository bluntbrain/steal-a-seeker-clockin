Current build: [v0.2 Night Shift verification](night-shift.md). The notes below describe the earlier v0.1 movement prototype.

# MVP verification · 11 September 2026

The one-screen, one-level game is implemented and playable. This is a private movement prototype; real SKR purchases, backend validation, guards and the remaining campaign are not implemented in this slice.

## Checks and evidence

- TypeScript: `npm run typecheck` passed.
- Simulation: all eight tests passed, covering reachable routes, input normalization/braking, wall collision and dash tunneling, pickup conditions, charge/cooldown, zero-charge extraction, timeout and deterministic replay.
- Production web export: passed. `web-playtest.json` includes current source hashes and actual-input results. Pointer joystick, pointer-held pickup, keyboard movement/dash, pause, extraction, retry and three viewport sizes passed without uncaught browser errors. No teleport or forced win.
- Android ARM64 release-mode APK: `:app:assembleRelease` succeeded; v2 signature and ZIP integrity verified; installed and launched on the Pixel 9 Pro Android 36 emulator. This APK uses a development signing key.
- Native touch playtest: joystick movement through the map, TAKE, DASH and extraction passed. `android-carrying.png/.xml` show 100% charge after pickup; `android-extracted.png/.xml` show completion at 00:35, 80% charge, one dash, score 11,720. The route was steered using visible output when fixed-duration touches stopped short. `scripts/playtest-android.py` contains that route; coordinates/timing require recalibration on other devices.
- Native retry, pause with frozen timer, resume and automatic background pause passed. See matching `android-*.xml` captures. An initial native pause crash was traced to a JS callback passed to a UI-runtime modifier, fixed with an explicit worklet, rebuilt and retested. `android-runtime-log.txt` has no post-fix fatal error in the captured test window.
- Visually inspected actual web and native screens, the courier alpha sheet, carrying state and extraction result. Runtime graphics are original local assets plus code-drawn map/UI. The research concept boards are not used as a gameplay background.

## Smoothness: what was actually measured

The browser run reported about **60 FPS**, p95 **16.7 ms**, zero callback intervals above 25 ms in 1,092 observed frames. This is headless Chrome on this Mac, not a phone.

The Android emulator's `dumpsys gfxinfo` recorded **2,393 frames, 260 janky frames (10.87%), p95 28 ms** during touch testing, screenshots and accessibility dumps. The on-screen callback counter varied with emulator scheduling/refresh rate. These are different measurements; a high callback FPS does not erase rendered-frame jank. The emulator is useful for functional testing, not proof of Seeker smoothness. No physical Android phone or Seeker was tested. Audio files loaded without runtime errors; subjective speaker/haptic quality remains a physical-device check.

For the next device test, install the APK, play several runs, toggle the FPS details, and inspect frame timing during movement/carry/dash. Use Android profiling on hardware to tune rendering if needed. The 30 Hz fixed simulation interpolates rendering at display cadence; this is an implementation choice, not a 60 FPS guarantee.

## Reproduce

From `seeker-game/`: `npm ci`, `npm run typecheck`, `npm test`, `npm run export:web`, then `npm run preview`. Run `node scripts/playtest.cjs` with Playwright/Chrome installed and `MVP_URL=http://127.0.0.1:8787`. For Android, install Java 17/SDK 36/NDK 27.1, configure the SDK path and run `npm run build:apk`.

The native project is retained with ARM64-only configuration and compact C++ build flags. Regenerating Android with a clean Expo prebuild can overwrite those local native settings. The unused microphone/storage/overlay declarations from the development template should be reviewed before any distribution; this MVP does not request them at runtime.

## Implementation references

- [React Native Skia installation](https://shopify.github.io/react-native-skia/docs/getting-started/installation/)
- [Reanimated frame callback](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback/)

`release-manifest.json` identifies the APK and source files used for this handoff. Build logs remain local in this directory. This is not a complete hackathon submission and does not yet integrate Mobile Wallet Adapter.

## Textured floor update

Added `warehouse-floor-v1.png` using built-in image generation and drew it below the existing collision-aligned obstacles. Inspected the generated artwork and in-game browser view. Types, all eight simulation tests, the actual-input browser replay and Android release build passed again. Native gameplay statistics above are retained from the preceding mechanics run; the art update received a separate Android visual smoke check. No change to movement, collision, levels or economy.
