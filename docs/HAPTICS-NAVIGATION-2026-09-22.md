# Android navigation feedback — 0.3.7 (10)

## Changes

- Bottom-tab selection uses an antialiased transparent capsule asset. The colored shape no longer depends on Android View corner clipping.
- Shared HapticPressable sends light feedback on enabled presses. Mission back, settings open/close, weekly Rankings/Missions/History, credit-store actions, wallet actions, hideout and collection navigation now use it.
- Starting a mission or ranked run uses a distinct start cue. Payment success feedback remains tied to verified fulfillment, separately from the initial tap.
- Native settings switches provide feedback. Enabling vibration previews it after the setting updates; disabling it stays silent.
- Android navigation uses Virtual_Key for broad OS compatibility. Unsupported native effects that reject fall back once to a compatible native cue. Errors never block navigation; foreground, saved vibration settings and throttling remain enforced.

## Verification

- TypeScript passed; 218 app tests passed, including fallback, suppression and start-cue throttling checks.
- Web export and signed Android release build passed.
- Browser check at 390 x 844: rounded active capsule, mission briefing/back, settings open/close, credit-store/back and weekly Rankings/Missions/History navigation. No console errors or warnings during this check.
- No purchases or ranked attempts were initiated for these checks. Browser haptics are intentionally disabled.
- ADB has no connected device. Realme/Seeker tactile feedback and native appearance have not been physically verified; APK not installed or submitted to the store.

## Build

- `releases/steal-a-seeker-mainnet-v0.3.7-code10.apk`
- Package: `com.bluntbrain.stealaseeker`
- Mainnet configuration; existing API and wallet identity unchanged.
- APK SHA-256: `71e13956f30e6aeb37576312d0c34d481b544e35094f1ccd6e4de06523d07221`
- Signature verified; existing release certificate SHA-256: `4fa3e9942238f110824fb67dc99438fc1d70ef48a273e4a79331d5f8a1e1e913`
