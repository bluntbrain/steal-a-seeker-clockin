# Android release 1.0.0 (46)

Signed mainnet APK: `releases/steal-a-seeker-mainnet-v1.0.0-code46.apk` (arm64-v8a, 91,610,407 bytes).

Source commit: `0362532`. Includes the latest committed campaign artwork and crop fixes from `dddb7f6`. App, Gradle and package metadata now use version 1.0.0; Android versionCode increments from 45 to 46.

Build: Node 22, Java 17, existing private release signing configuration. TypeScript checking and the build's rules-manifest check passed. Signature matches code 45. Manifest identity, ZIP integrity, 16 KB ZIP alignment, 269 source receipt hashes, all ten campaign-world WebP file hashes inside the APK, and stable/versioned APK hash equality passed. See `checks.json`, `signature.txt`, `badging.txt` and `alignment.txt` for evidence.

Physical Seeker performance, wallet payments and store acceptance are not tested by these checks. ZIP alignment is not a physical 16 KB-device test. This artifact has not been uploaded to the store. Untracked loot experiments remain uncommitted.

Emulator upgrade smoke test: `adb install -r` did not finish within approximately two minutes and was stopped. Package readback still showed 0.3.42 (45); installation and startup of this artifact are unverified. No app data was cleared.
