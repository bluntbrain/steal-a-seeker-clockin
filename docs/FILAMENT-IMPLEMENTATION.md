# Android Filament phone inspector

Implemented 23 September 2026, after [the implementation plan](FILAMENT-IMPLEMENTATION-PLAN.md).

## What changed

Android collection phones now use React Native Filament 1.11.0 with Worklets Core 1.6.3. The existing inspector layout stays in place. It loads one bundled GLB, supports continuous horizontal and vertical rotation, pinch zoom and six orientation presets. Camera smoothing runs on the Filament worklet thread; touch input changes shared values without a React render per movement.

The web viewer continues using Three.js. Gameplay, wallet transactions, scoring and server rules are unchanged by this migration.

All twelve derived mobile models retain the original 17,536 triangles, cameras, flash, Seed Vault lettering/panel, logo and edition artwork. Each uses 19 render primitives instead of 128. Combined GLB size is 14,714,524 bytes instead of 35,774,836 bytes, a 59% reduction. The embedded screen texture now contains its own artwork crop, not the whole twelve-phone atlas. Cropping does not add detail that was absent in the source.

Front and back Graphite comparison renders preserve the source: mean absolute pixel difference is 0.000027 and 0.000015 on the 0–255 channel scale. The sources remain in `assets/phone-models`; reproducible derived assets and their hashes are in `assets/phone-models-mobile/manifest.json`. Rebuild with `npm run models:mobile`.

## Rendering and recovery

- Local Expo asset preparation before model loading; no remote model download.
- OpenGL on Android, studio image-based lighting, two directional lights, FXAA and temporal antialiasing.
- Dynamic resolution targets a maximum of two physical pixels per layout point, with a modest 80% lower bound for GPU headroom. This is a configured quality budget, not a measured FPS claim.
- The engine, model and surface unmount on inspector close and when the app leaves the foreground. Foreground resume creates a fresh viewer.
- A 15-second load timeout and React recovery boundary restore the previous rendered-image viewer.
- Version-pinned `patches/react-native-filament+1.11.0.patch` fixes late async buffer completion after unmount and sends async resource errors into React recovery. `npm install` reapplies it using `patch-package`. Review this patch when upgrading Filament. A React boundary cannot catch a native process crash.
- Native resource promises are assimilated into JavaScript promises before attaching rejection handlers. `patches/react-native-worklets-core+1.6.3.patch` preserves captured object identity so lighting effects do not rerun with an already released buffer. Both fixes were found by running the native renderer, and both patches are covered by regression tests and release receipt hashes.

Worklets Core and Reanimated 4 use distinct runtimes. Babel compiles Filament/Core and `src/components/phone-filament` with the Core plugin, and the rest of the app with the Reanimated Worklets plugin. Their shared values are not mixed.

The first configuration was incorrect: disabling only Expo's Worklets switch
allowed its Reanimated fallback to add another compiler. Version 0.3.21 disables
both automatic switches and lowers default parameters before worklet extraction.
The ordering issue crashed the tutorial's first simulation step. See
[the native crash report](TUTORIAL-NATIVE-CRASH-2026-09-23.md) for the captured stack,
fix and native replay verification.

Filament's Android Gradle module did not inherit this project's NDK selection; the machine's AGP default SDK alias pointed to NDK 25. The module is explicitly pinned to the installed real NDK 27.1.12297006. Native shared objects use 16-KiB linker alignment.

## Rollback

Set `EXPO_PUBLIC_PHONE_RENDERER=turntable` when running `npm run build:apk`. This restores the previous image viewer in the new APK. The default is `filament`; the release receipt records the chosen renderer and mobile model manifest hash. This is a build-time flag and cannot change an already installed APK remotely.

## Validation

- TypeScript passes.
- 267 client tests pass, including independent camera-axis motion, pole/zoom limits, all twelve model geometry/size audits, compiler isolation and native-resource promise handling.
- Production web export passes. Graphite inspector, hardware detail and orientation controls were checked in the browser.
- Signed ARM64 mainnet APK: version 0.3.21, version code 24; package `com.bluntbrain.stealaseeker`. Version 0.3.20/code 23 had the tutorial compiler regression and must not be used.
- APK v2 signature verifies with the existing distribution certificate. APK ZIP alignment and all 24 native ELF libraries pass 16-KiB checks, including Filament and Worklets Core.
- Model hashes match their manifest. The lifecycle patch applies cleanly.
- Runtime/device results are recorded separately below. A successful build does not prove device rendering, thermal performance or crash-free repeated use.

## Runtime validation status

The Pixel 9 Pro ARM64 emulator now completes a native UI-worklet replay of all eight tutorial instructions with the expected win, score and health. The actual game renderer starts successfully. The Filament viewer renders the real model rather than its image fallback, verified by screenshot and native view identifier.

A separate native component lifecycle test opens editions 0, 5 and 11, destroys/recreates the viewer, and returns to the tutorial without a fatal exception, recovery fallback or timeout. This is automated component mounting, not a gesture-driven end-to-end test. Nonfatal emulator graphics/surface warnings remain in the captured logs.

Desktop UI automation cannot attach to the emulator window. Permission to use ADB touch commands was requested; interaction tests are pending that answer. No physical Android phone is connected. Rotation/pinch gestures, background/resume, wallet round-trip and physical GPU performance still need testing. See `verification/filament-crash` and the linked native crash report for the reproduction and evidence.

## Official references

- [Filament installation](https://margelo.github.io/react-native-filament/docs/guides)
- [Camera](https://margelo.github.io/react-native-filament/docs/guides/camera)
- [Separate worklet runtimes](https://margelo.github.io/react-native-filament/docs/guides/reanimated)
- [Native library source](https://github.com/margelo/react-native-filament)
