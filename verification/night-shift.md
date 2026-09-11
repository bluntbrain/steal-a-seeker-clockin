# v0.2 Night Shift verification

11 September 2026. Two selectable mission rulesets on one warehouse layout: unguarded practice and two-guard Night Shift.

## Passed

- TypeScript typecheck.
- Sixteen simulation tests. Added tests for vision angle/range, crate occlusion, accumulating/decaying alert, capture timing, capture taking priority over simultaneous extraction, patrol collision-free routes, independent reset state, deterministic replay and a successful route from spawn using movement/pickup inputs.
- Static web export and the existing practice-room input test: joystick, collision, hold pickup, dash, extraction, retry, pause and three viewport sizes.
- Night Shift actual-input browser test: select mode, render patrols, freeze guards on pause, deliberately enter a patrol's view, caught screen, retry into the same mission, pick up and escape, then return to unguarded practice. No teleport or forced-win interface. The final successful run uses the outer aisle and a dash after pickup; earlier attempts were caught. See `night-shift-playtest.json` for the actual outcome and source hashes.
- Inspected browser start, caught and successful extraction screens, plus the native patrol rendering. The 390×844 browser layout keeps the controls and keyboard legend within the screen.
- Android ARM64 release-mode build, APK ZIP integrity and v2 signature validation; installed on the Pixel 9 Pro Android 36 emulator. The final APK is `releases/steal-a-seeker-0.2.0-arm64.apk`.
- Native touch smoke test: mission selection, pause/frozen timer, touch movement into a patrol, caught screen, retry retaining Night Shift, and automatic pause after background/return. Native screenshot/XML evidence and `night-shift-native-check.json` are retained. No matching fatal/runtime error was found in the captured logcat window.

## Limits

The native smoke check covers capture and recovery; the new full guarded extraction was verified with browser inputs and simulation, not a complete native touch escape. No physical Seeker or other physical Android phone has been tested. Browser/emulator frame counters do not establish device performance. Generated guard silhouettes are simple procedural robot art; no public-person likenesses are used.

The APK uses the existing development key. No store publication, payment flow, online scores or rewards are included. Patrols stop while suspicious and resume when alert clears; they do not chase around obstacles. One warehouse is shared by both modes. Local results reset with a new run; persistent personal bests remain planned.

## Reproduce

From the repository root: `npm ci`, `npm run typecheck`, `npm test`, `npm run export:web`, `npm run preview`.

Run `scripts/playtest.cjs` and `scripts/playtest-patrol.cjs` with `PLAYWRIGHT_MODULE` and `CHROME_PATH` configured as needed. `MVP_URL` defaults to the local preview for the patrol test. The native script assumes the observed 1280×2856 emulator bounds and is not a portable hardware test.

Build using Java 17 and the installed Android SDK: `npm run build:apk`. The APK/source hashes are in `night-shift-release.json`.
