# Tutorial native crash: 0.3.21 / code 24

The Filament integration introduced a Babel ordering regression. Android could
open the app and render the tutorial, but the first simulation step could kill
the process. A React error boundary cannot recover a fatal UI-thread exception.

## Captured failure

Android emulator logcat recorded:

```text
com.facebook.jni.CppException: Property 'TUNING' doesn't exist
  at step_simulationTs17
  at recordStep_recordingTs1
  at GameScreenTsx3
```

An isolated Android diagnostic also reproduced it through a real Reanimated UI
worklet replay, independent of touching the screen.

`step(s, input, dt = TUNING.step)` was serialized with `TUNING` unpacked from
`this.__closure` inside the function body. JavaScript evaluates default
arguments before entering that body, so the native runtime had no `TUNING` yet.
Node simulation tests and browser play did not exercise this serialization.

The initial configuration also disabled only Expo's `worklets` switch. Expo then
fell back to its Reanimated plugin, adding a second Worklets compiler and
compiling Filament callbacks for the wrong runtime.

## Fix

- Disable both Expo automatic compiler switches.
- Explicitly lower function parameters before each worklet compiler.
- Compile game/Reanimated modules with Worklets; compile Filament/Core modules
  with Worklets Core only.
- Pin the parameter transform and the two legacy Babel plugins required by the
  installed Worklets Core compiler.
- Add compiler regression tests that evaluate captured default arguments in a
  separate JavaScript context without the source module's globals.

The native follow-up also exposed two phone-viewer failures that were hidden by
the original compiler problem:

- Worklets Core returns a native thenable whose chained `.catch()` is incomplete.
  Filament resource loading now assimilates it into a JavaScript `Promise` before
  registering rejection handling. Errors reach the React recovery boundary,
  and resources that finish loading after unmount are released.
- Core's property-level closure capture rebuilt a partial `engine` object every
  render. Filament treated that as a changed effect dependency and tried to use
  a lighting buffer it had already released. The pinned Core compiler patch
  preserves the captured object's identity. A regression test checks that exact
  dependency behavior. The phone viewer keeps a separate engine per mount.

Both vendor changes are version-pinned in `patches/`, reapplied by `postinstall`,
and included in the APK source receipt. Review them when upgrading either
library. Recovery logs now include the JavaScript stack as well as React's
component stack.

Simulation sources, rules hashes, prices, scores and server code are unchanged
by this crash fix. It requires a new APK, not a backend deployment.

## Verification

- TypeScript and 267 client tests pass.
- Android ARM64 native replay of all eight tutorial instructions reaches `won`:
  535 ticks, score 9821, health 100, matching the Node reference exactly.
- Tutorial renders in the native game component and remains alive after the
  replay. This is a renderer startup plus native replay test, not a complete
  touch-driven playthrough.
- Filament renders the real bundled phone model, confirmed by a native screenshot
  and `phone-filament` view identifier with no loading overlay or fallback.
- A 55-second native component lifecycle test opens phone editions 0, 5 and 11,
  unmounts/recreates the engine, then returns to the tutorial. It completes in the
  same live process without a fatal exception, recovery fallback or load timeout.
  Nonfatal emulator graphics/surface warnings remain; no physical GPU performance
  or leak-free long-session claim is made.
- Mainnet APK version 0.3.21, code 24 builds with diagnostics disabled and retains
  the existing distribution signing certificate.
- Signature and 16-KiB APK ZIP alignment verification pass.
- Only an emulator was attached. Physical Realme testing remains outstanding.

Evidence and reproducible diagnostic sources are in
`verification/filament-crash`. Its diagnostic APK is deliberately outside
`releases` and must never be uploaded to the store.

Release: `releases/steal-a-seeker-mainnet-v0.3.21-code24.apk`.
SHA256: `6153588f2468d25c8229aefa5978c6e2376d881db7c7bf147a80f637ffbcd80e`.
