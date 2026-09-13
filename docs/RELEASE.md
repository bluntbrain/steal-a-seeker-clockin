# Android release builds

Requirements: Node 22+, `npm ci`, Java 17, Android SDK/NDK from the Gradle project, Android arm64 device. Keep `android/local.properties` local. CI needs equivalent SDK paths. No release uses the public debug signing key.

The signing configuration is outside git: `~/.config/steal-a-seeker/release-signing.json` with `storeFile`, `storePassword`, `keyAlias`, `keyPassword`. The keystore path must be absolute. Restrict both files to mode 600. Back up the keystore and passwords securely: losing them prevents signed updates. Do not copy these into source, screenshots or submission materials. A reviewer can create their own keystore with Android keytool to build independently; they will not be able to update the builder-signed APK without uninstalling it.

```
npm ci
npm run typecheck
npm test
npm run rules:check
npm run signing:init  # Creates a new private key only if none exists.
# Java 17 must be JAVA_HOME; Android SDK must be configured.
npm run build:judge
npm run build:apk
```

Both scripts force diagnostics off and ignore `.env` files. They build arm64 only, check pinned simulation rules, clean the JS bundle task, use the protected release signature, then write an APK and SHA-256/source manifest under `releases/`.

- `steal-a-seeker-judge.apk`, package `com.krane.stealaseeker.judge`: build-time offline campaign access and a permanent JUDGE PREVIEW label. It never writes a purchase entitlement, credit balance or verified leaderboard result. Online wallet/store/rewards need the real service and ownership. Daily online verification is unavailable without it. This is the installable gameplay review build, not a claim of completed Solana integration testing.
- `steal-a-seeker-devnet.apk`, package `com.krane.stealaseeker.mvp`: normal native paywall, Mobile Wallet Adapter and account gates. Requires explicitly configured `EXPO_PUBLIC_API_URL` and devnet service to test payment. Inspect `src/commerce/client.ts` for the exact allowed configuration. No mainnet release is authorized here.

The normal package previously used a debug signature. Android will refuse an in-place update from that old build; retain its data and use the separate judge app for current gameplay testing. Do not uninstall the user's old app to bypass this error.

An APK manifest records the source HEAD plus working-tree paths. For a final submission, commit the reviewed source and rebuild so the artifact corresponds to a clean source revision. ARMv7 and x86 are not included in these artifacts.

Physical checks: install; launch without Metro; open missions; move with the right thumb and tap powers with the left; collect a phone; listen to alarm/decoy/escape; pause; background/foreground; relaunch and verify progress/settings; play all districts; perform a 15-minute thermal/performance run; then test Phantom devnet sign-in, cancellation, approved transfer, restore and verified rank against the deployed service. Record actual hardware and APK SHA-256. An emulator cannot substitute for these observations.
