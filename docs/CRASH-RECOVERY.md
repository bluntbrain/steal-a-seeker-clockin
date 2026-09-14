# Crash recovery — 14 September 2026

## Changes

- Android phone collection uses pre-rendered views of our existing 3D models. Drag through 16 angles, or choose Front, Back, Left, Right, Top, Bottom. Each edition has its own local image atlas. Opening the viewer no longer starts an Expo GL context or loads Three textures on Android. Browser retains the live 3D viewer.
- A phone-viewer React boundary falls back to the phone artwork; Done remains outside the failing section.
- A root React boundary offers explicit reload after render/lifecycle errors. Reload remounts the existing account/progress providers and uses their normal pending-payment restoration. It does not clear storage, create a new purchase, or approve a payment. Unfinished runs may be lost; ranked attempt accounting remains on the server.
- Audio operations tolerate disposed native players. After unmount, late seek callbacks cannot restart playback. Playback errors disable the affected player and log once instead of escaping into the game.
- The ability is labelled **DISTRACT**. It throws a six-second noise beacon toward the landing ring; nearby mobile guards investigate it. Scanners ignore it, and guards who see the courier continue chasing. Existing simulation keys and signed weekly manifests are unchanged; old copy is translated for display.

## Verification

- `tests/audio-lifecycle.test.ts`: released-player cleanup, delayed callbacks, failed seeks, rotation wrapping, old manifest copy.
- `scripts/playtest-crash-recovery.cjs`: intentional React render failure and reload; all 12 native turntables open/rotate/close at 320 × 568 and 390 × 844; no canvas inside the native viewer; artwork loads, controls fit, gameplay still opens with DISTRACT.
- Run browser native-renderer QA with `?nativePhonePreview`. Ordinary web uses the live model.
- User elected to continue without the physical phone. The original Android phone-viewer crash has not been reproduced from a connected device in this session. Native-renderer avoidance is a mitigation, not a confirmed diagnosis of the original crash.

Signed Mainnet APK built successfully: `releases/steal-a-seeker-mainnet.apk`. SHA-256: `71b68f6db8928f8da61a7846ed296615244a2d93891a54cdba5a603b8d86cad4`. All 134 app tests pass; browser checks pass. APK has not been installed on the disconnected phone.

## Limits and logs

React boundaries do not catch OS/native process crashes, out-of-memory kills, worklet failures, or arbitrary async/event-handler errors. Fix these at the source rather than installing a global handler that suppresses all errors.

USB logcat tags: `[SeekerRecovery]` for component failures and `[SeekerAudio]` for optional audio failures. For the next device test, capture both AndroidRuntime and ReactNativeJS, repeatedly open every phone, start/pause/exit gameplay, and background/foreground during sound playback. No user purchase approval is automated.

A pre-existing `scripts/qa-wallet-submit.ts` imports the removed `src/wallet/submitPayment` helper, so the full project TypeScript check currently reports that obsolete script. No new app TypeScript errors were reported by this change.
