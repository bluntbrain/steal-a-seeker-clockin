# Implementation evidence

Updated 12 September 2026. Goal remains the full game described in COMPLETE-GAME-PLAN.md. This is a progress ledger, not a reduced definition of completion.

| Requirement | Current evidence / remaining work |
| --- | --- |
| Angled real 3D | First room renders through Three.js / React Three Fiber and native Expo GL; browser and Android emulator screenshots in verification. Original 2D view remains selectable for regression comparison. |
| Camera and touch | Screen-relative joystick math test and input-driven browser playthrough pass. Physical-device feel, wall fading and final framing still need testing. |
| 3D assets | Procedural courier/robot proxy models with articulated walking; final art, animation and outfits remain. |
| Dynamic guards | Existing patrol/occluded vision renders in 3D. Investigation/search and pickup-triggered security changes still need implementation. |
| Twelve levels | One geometry and two modes still. Parameterized levels and the other maps remain. |
| Native wallet | MWA Kit provider, secure native authorization cache, devnet wallet panel and memo transaction diagnostic implemented. Android build, wallet panel and missing-wallet handling pass on the emulator. Physical Phantom approval and successful devnet transaction remain unverified. |
| Purchase/backend | Not implemented. Memo diagnostic is not commerce. Signed backend login, mint tooling, orders, verification and restore remain. |
| Progress/shop | Not implemented. All catalog products and persistent progression remain. |
| Daily/ranking | Not implemented. Shared deterministic run validation remains. |
| Test entry/return | Not implemented. Reserve, settlement, recovery and receipt verification remain. |
| Submission | Current APK is a development-signed test build. Release identity/signing, fresh-clone release evidence, final deck/demo and physical testing remain. |

## Renderer decision

The selected visual direction is unchanged: native 3D with an angled overhead camera and simple controls. The first implementation uses `@react-three/fiber` with `three` and `expo-gl`, rather than Filament. The installed Fiber version supports our React 19/RN versions, and the shared scene has now rendered on both web and native Android. This preserves browser playtesting without a WebView in gameplay. [Expo GL documentation](https://docs.expo.dev/versions/latest/sdk/gl-view/) describes the native GL surface.

The physics/game simulation still uses the existing fixed-step rules. Do not infer replay or reward security merely from the renderer working. Physical phone GPU/thermal behavior remains unmeasured.

## First combined test APK

`releases/steal-a-seeker-3d-wallet-devnet-preview.apk` is the development-signed native build. Its checksum and source hashes are in `verification/3d-wallet-build.json`. Native UI evidence is in `verification/3d-wallet-native-check.json`; the complete 3D browser route is in `verification/3d-web-playtest.json`. The existing 2D pointer/keyboard regression route also passed after the upgrade.
