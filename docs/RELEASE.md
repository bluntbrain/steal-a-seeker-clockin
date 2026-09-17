# Android release

The current submission plan, build instructions, signing locations, public URLs and review status are maintained in [PUBLISHING-0.3.4.md](PUBLISHING-0.3.4.md).

The game uses Mainnet for native purchases. The browser is a local preview and does not transfer funds. Free campaign access does not require a payment. The Game Pass unlocks weekly ranked play; weekly token prizes are not active.

Build on the configured Mac with `npm run build:apk`. The script uses the existing private signing configuration outside Git and outputs `releases/steal-a-seeker-mainnet.apk`. Keep the same package and release key for all updates, and raise versionCode on each submission. A signed build is not evidence of store acceptance or a physical-device payment test.

Do not share the Android keystore or its passwords with app reviewers. They need the APK. Keep an encrypted backup of both signing files; neither is the game's treasury wallet.

Pricing controls: [PRICING.md](PRICING.md). Game Pass, credit-pack purchase prices, and outfit/trail credit costs are configurable on the backend.
