# Android release

The latest locally built upload APK is v0.3.36 (code 39): [verification and limitations](../verification/releases/code39/README.md). This does not indicate store publication. The original submission plan, signing locations and public URLs are maintained in [PUBLISHING-0.3.4.md](PUBLISHING-0.3.4.md).

The game uses Mainnet for native purchases. The browser is a local preview and does not transfer funds. Free campaign access does not require a payment.  The Game Pass is a one-time bundle of credits and the Ghost Signal outfit.

Build on the configured Mac with `npm run build:apk`. The script uses the existing private signing configuration outside Git. The upload file includes the network, version and versionCode: `releases/steal-a-seeker-mainnet-v0.3.36-code39.apk` for the current build, with a JSON build receipt alongside it. The stable `releases/steal-a-seeker-mainnet.apk` filename is also refreshed for existing tooling. Both APKs are ignored by Git. Keep the same package and release key for all updates, and raise versionCode on each submission. A signed build is not evidence of store acceptance or a physical-device payment test.

Do not share the Android keystore or its passwords with app reviewers. They need the APK. Keep an encrypted backup of both signing files; neither is the game's treasury wallet.

Pricing controls: [PRICING.md](PRICING.md). Game Pass, credit-pack purchase prices, and outfit/trail credit costs are configurable on the backend.
