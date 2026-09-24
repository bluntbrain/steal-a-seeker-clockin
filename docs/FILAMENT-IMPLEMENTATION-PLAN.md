# Native Seeker viewer: implementation plan

23 September 2026. Written before implementation. Scope: the Android collectible-phone inspector; retain the existing UI, web Three.js renderer, 2D game and wallet flows.

## 1. Build compatibility first

Pin `react-native-filament@1.11.0` and `react-native-worklets-core@1.6.3` from npm. Preserve Expo 55, React 19.2, RN 0.83.10, Reanimated 4.2.1 and `react-native-worklets@0.7.4`. Worklets Core is a separate runtime; never pass Reanimated shared values to Filament without an explicit supported bridge. Inspect installed package APIs and configure Babel/Metro using Expo's defaults. Add GLB/KTX asset extensions without replacing Expo resolver behaviour. Compile ARM64 before expanding the scene. Check native library packaging and 16-KiB alignment.

## 2. Prepare one model, then all twelve

Keep the detailed Seeker master as source. Optimize derived GLBs into a separate mobile directory, preserving originals. Inspect geometry, normals, materials, texture orientation and object transforms. Deduplicate equivalent materials and join static compatible geometry; remove unused atlas pixels while remapping screen UVs. Do not claim that upscaling a small source creates new detail. Preserve edition names, colours, cameras, Seed Vault and rear logo. Record per-model bytes, primitives, materials and triangles. Compare front/back renders before accepting all twelve.

## 3. Integrate within the existing inspector

Add a native-only Filament stage, loaded lazily from `PhoneStage.tsx`. Keep `.web.tsx` isolated from native dependencies. Bundle the derived assets locally and load only the selected edition. Keep the existing title, credits, Done button and orientation presets; no new screen or bottomsheet is needed. Render an actual freely rotatable model, with clamped vertical orbit, two-finger pinch zoom, a readable default rear three-quarter pose and front/back/edge/top/bottom presets.

## 4. Lighting and input

Use image-based studio lighting plus a restrained key/rim setup. Configure antialiasing and a bounded drawing resolution; select only options supported by the pinned API. Use Filament's render worklet or supported camera manipulator for smooth input; avoid React rerenders for each movement frame. Keep overlays outside the native render surface. Confirm surface composition works inside the current Android Modal, with clipping and touch handling.

## 5. Lifetime and recovery

Mount only while the inspector is open and the app is active. Reset/cancel gestures on background or close. Let the library's documented ownership dispose the model, scene and swapchain; avoid manual double frees or engine calls inside render callbacks. Ignore stale load completions after unmount/index changes. Model/load errors and a bounded load timeout fall back to the existing image viewer. Keep `EXPO_PUBLIC_PHONE_RENDERER=turntable` as a build-time rollback and record it in the APK receipt. Explain that this flag requires a rebuild and a React boundary cannot catch a process crash.

## 6. Verification and delivery

1. Typecheck; meaningful tests for camera limits, asset registry and fallback decisions.
2. Production web export and unchanged phone-viewer smoke test.
3. Validate all 12 GLBs and compare optimized front/back previews against the master.
4. Signed mainnet ARM64 APK with a new version code, verified package/certificate and native library alignment.
5. On available Android hardware: initial load, free rotation, pinch, presets, all editions, 50 open/close cycles, back/Done, background/resume and rapid navigation. Capture native crash logs and frame timing; distinguish emulator results from physical-device proof.
6. Target smooth 60-FPS rotation; use measured frame pacing and a stable lower tier when necessary. No claimed FPS or memory success without measurements. Keep wallet round-trip and gameplay regressions in the check list because the native dependency/runtime changed.

No backend schema, payment, simulation, scoring or weekly-rule deployment is needed for this viewer change. Deliver the signed APK, renderer flag instructions, asset measurements and an honest validation report. Store submission remains a separate user action.

## Sources

- [Installation](https://margelo.github.io/react-native-filament/docs/guides)
- [Camera controls](https://margelo.github.io/react-native-filament/docs/guides/camera)
- [Separate worklet runtimes](https://margelo.github.io/react-native-filament/docs/guides/reanimated)
- [Native lifecycle implementation](https://github.com/margelo/react-native-filament/blob/main/package/src/react/FilamentView.tsx)
