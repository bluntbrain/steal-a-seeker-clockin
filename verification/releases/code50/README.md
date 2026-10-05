# Android release 1.0.4 (50)

Signed mainnet APK: releases/steal-a-seeker-mainnet-v1.0.4-code50.apk. Source commit d909ab3. Android Gradle version was synchronized by the build script.

Loader progress is now an estimated frontend animation. It starts at 4 percent, reaches 62 percent over 2.4 seconds, then advances more slowly below 94 percent until the assets are ready. Fast loads finish over at least about 1.1 seconds from mounting; slow loads finish over 320 ms once ready. Gameplay remains gated until the final fill completes. Reduced effects skips the moving fill. Retry remounts the progress state. This is not a measured percentage of downloaded bytes.

Typecheck, web export, rules check, all 404 tests, APK signature continuity, package/version identity, ZIP integrity, 16 KB ZIP alignment and source receipt hashes passed. Browser checks covered autonomous fill, completion, error/retry, reduced effects, normal mission start and boss entrance/restart. See loader-checks.json and checks.json.

No physical-device installation or store upload was performed. The version 1.0.3/code 49 APK does not contain this loader fix; use code 50 for testing and upload.
