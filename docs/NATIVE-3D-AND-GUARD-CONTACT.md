# Native phone quality and close-range guard contact

23 September 2026. Guard fix implemented in 0.3.19 (22); renderer migration researched, not enabled.

## Why the APK looks different

This is an implementation difference, not evidence that React Native cannot render the model well.

- `PhoneStage.web.tsx` renders the procedural Seeker model with Three.js / React Three Fiber, four lights and horizontal **and vertical** drag. The canvas has a device-pixel-ratio cap of 1.5.
- `PhoneStage.tsx` exports `PhoneTurntable`. Android displays a WebP atlas with **16 yaw views at 22.5-degree steps**, plus top and bottom. Drag uses only `dx`; vertical rotation is not implemented.
- Current native assets are **512 × 640 pixels per view**, packed into **3072 × 1920** sheets. A 360-dp-wide view on a 3× screen needs 1080 physical pixels across; scaling a 512-pixel source cannot supply that detail.
- One decoded RGBA sheet is about **22.5 MiB**, despite its small compressed file size. Increasing both dimensions by 2× makes that about 90 MiB. Bigger atlases are the wrong route to continuous 3D.
- `docs/CRASH-RECOVERY.md` records that this was an avoidance measure for reported native GL crashes. It explicitly says the original crash was not reproduced on a connected phone. The workaround was not a proven repair of that crash.

The web result cannot validate the native renderer: they currently execute different code paths.

## Renderer recommendation

**Prototype React Native Filament for the collection inspector first.** The phones already have standalone GLBs, so this is a bounded asset-viewer migration. Keep the 2D Skia game and deterministic simulation as they are.

| Option | Relevant capabilities | Fit for this project |
| --- | --- | --- |
| React Native Filament | Native C++ PBR renderer, separate rendering threads, GLB loading, orbit/pan/zoom camera controls | First candidate for the collectible viewer. Needs its own native build and lifecycle/performance proof. |
| React Native WebGPU + Three.js | Dawn-based native WebGPU; documented Three.js and Expo integration; optional off-JS-thread rendering | Strong alternative if preserving the current procedural Three scene is the priority. Requires renderer/loader/lifecycle adaptation; not a drop-in change. |
| React Three Fiber + Expo GL | Existing dependencies; shared Three.js scene; on-demand rendering already used on web | Smallest source migration, but would re-enter the previously avoided native GL path without a device diagnosis. |
| Babylon React Native | Native Babylon engine with RN bindings | Larger scene/API migration. Its maintainers explicitly do not provide official Expo-framework support; poor first choice for this one inspector. |

Primary sources: [Filament implementation](https://github.com/margelo/react-native-filament), [GLB installation/loading](https://margelo.github.io/react-native-filament/docs/guides), [orbit camera](https://margelo.github.io/react-native-filament/docs/guides/camera), [WebGPU requirements](https://wcandillon.github.io/react-native-webgpu/docs/getting-started/installation), [Three.js integration](https://wcandillon.github.io/react-native-webgpu/docs/integrations/three-js), [Expo GL](https://docs.expo.dev/versions/v55.0.0/sdk/gl-view/), [R3F performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Babylon limitations](https://github.com/BabylonJS/BabylonReactNative).

The inspected Filament main-branch package declares version 1.11.0 and develops against RN 0.83.1 / React 19.2.0. Our app is RN 0.83.10 / React 19.2.0 / Expo 55. This is encouraging, not proof of binary compatibility. Filament requires `react-native-worklets-core`, separate from our existing `react-native-worklets`. Check both Babel plugins and native module compatibility. [Package source](https://raw.githubusercontent.com/margelo/react-native-filament/main/package/package.json)

Current WebGPU documentation requires RN ≥0.81 on the new architecture; optional off-JS-thread support requires worklets ≥0.7.2. Our version numbers meet these stated requirements. Actual hardware support, frame timing and lifecycle still require a physical-device run. [Requirements](https://wcandillon.github.io/react-native-webgpu/docs/getting-started/installation)

## What will actually improve quality and speed

These are prototype budgets to measure, not promises of achieved FPS:

1. Load **one** phone GLB while the inspector is visible. Keep list thumbnails as images. Release the model, GPU resources and renderer on close; stop rendering when backgrounded. Test switching phones during an unfinished load.
2. Reduce submission overhead before raising resolution. The inspected `graphite.glb` is 2,981,244 bytes, **128 mesh primitives, 34 materials, 17,536 triangles**, with one texture. The triangles are not extreme; the many little separate pieces and materials are a more obvious optimization candidate. Merge static parts by compatible material and bake fine lettering into a sharp decal while retaining the camera/port silhouettes. Aim initially for fewer than 20–30 draw submissions; measure actual renderer passes rather than equating primitive count with exact GPU draw calls.
3. Replace the tiny screen-art crop (144 × 295 source pixels) with a dedicated 1K screen texture. The camera, Seed Vault and Solana logo already exist in geometry. More pixels cannot restore missing source detail.
4. Use a small studio image-based lighting setup plus a restrained key/rim light. Tune roughness for metal/glass instead of adding expensive bloom, refraction and real-time shadows everywhere.
5. Add free two-axis orbit and bounded pinch zoom. Drive gestures and smoothing without React state updates every animation frame. Preserve the named Front/Back/Left/Right/Top/Bottom views.
6. Start with a render-scale cap of 1.5–2 and antialiasing; reduce scale only when measured frame timing requires it. Raise quality when the model settles. Filament exposes dynamic-resolution controls, but these must be tuned with its antialiasing configuration. [Dynamic resolution](https://margelo.github.io/react-native-filament/docs/api/interfaces/DynamicResolutionOptions)
7. Put the trial behind `EXPO_PUBLIC_PHONE_RENDERER=filament|turntable` in a diagnostic build, with the turntable retained as a fallback. This flag is a proposed migration step and is **not implemented** in this patch. An error boundary cannot recover from a native process crash.

Acceptance on Realme and Seeker: inspect all 12 models; 50 open/rotate/close cycles; background/resume; fast switching; low-memory test; no growing retained allocations; crisp camera rings/Seed Vault/logo at normal size; 60-FPS target during rotation (16.7-ms frame budget), with measured stable 30 FPS preferable to unstable frame pacing on a weaker device. Record frame-time distributions, memory, startup time and battery/thermal behaviour. Do not call it smoother based only on a desktop preview or emulator.

No renderer dependency was installed or enabled by this research task. The Android turntable remains in the patch APK.

## Guard bug and implemented repair

The patrol cone was also acting as the only combat lock. Moving slightly outside it set `seenFor` to zero and canceled an in-progress aim. Old search paths and patrol waits could then override the fight.

Revision **9** separates acquiring a new target from retaining an already confirmed one:

- Initial detection keeps the original cone and detection time.
- A confirmed target is remembered for two seconds. While in that window, unobstructed close contact within 1.8 tiles survives moving behind the guard; farther contact uses a 240-degree forward field and 0.6-tile range hysteresis.
- Every retained sight still performs wall/gate line-of-sight testing. Hidden coordinates never refresh the last-seen position.
- Active sight clears patrol pauses and search state. Guards face the visible courier through firing recovery instead of wandering onto an old patrol path.
- The existing aim windup, final six-tick shot-direction lock, burst and recovery remain. The player can still dodge and escape through actual cover.
- Unaware guards do not gain rear vision. Drones retain their non-shooting role and bounded local reports.

New tests reproduce the reported sidestep failure, then check continued firing, unaware rear approaches, cover loss, frozen last-seen positions and contact expiry. Revision-8 input replays are compared with the archived verifier. The older revision-3/6/7 compatibility tests also remain in place. Current weekly maps stay on their published revision; this patch changes campaign behaviour.

All 12 ordinary-input campaign solutions still win and replay correctly. Solver wins establish reachability, not human difficulty or enjoyable pacing. Physical-phone playtesting remains necessary.

## Delivery verification

- 254 game/client tests and 79 backend tests passed; TypeScript, rules-manifest consistency and whitespace checks passed.
- Production web export succeeded. Crossfire opened after its mission introduction, its timer advanced, and the browser recorded no error logs in that smoke test.
- Signed mainnet APK: `releases/steal-a-seeker-mainnet-v0.3.19-code22.apk`. Package/version and signing certificate checked with Android build tools; source hashes match the build receipt.
- Existing `seeker-api` service deployment `6696e8ef-8e77-4466-94a3-da58c770db96` succeeded. Both health endpoints returned 200/OK on mainnet. Existing 0.3.18 campaign claims remain supported and cannot double-grant credits after upgrading.
- Active week 2026-09-21 remains revision 6 and is compatible with the patched client. No live competition rules were replaced.
- No Android device was connected. The APK was not installed or uploaded to the dApp Store. The 3D-renderer replacement is a recommendation, not a claimed completed improvement.

Machine-readable receipt: `verification/combat-contact-v0319.json`.
