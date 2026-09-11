# Steal a Seeker

An Android solo stealth game with an angled overhead 3D camera. Sneak past robot guards, recover a Seeker and reach the exit. Built with React Native, Three.js / React Three Fiber, Expo GL and Solana Mobile Wallet Adapter. Android gameplay uses a native GL surface, not a WebView; the browser is a separate React Native Web playtest.

Status: 12 September 2026. The complete goal remains in [the game plan](docs/COMPLETE-GAME-PLAN.md). [Implementation evidence and remaining work](docs/IMPLEMENTATION-STATUS.md) distinguishes tested features from unfinished integration.

## Current build

- Twelve authored missions: patrol timing, scanners, timed gates, decoys, investigation, a Warden, power switching, relay doors and two-phone deliveries.
- Fixed 30 Hz simulation, touch joystick, pickup/action, battery-powered dash, mission tools, cover-aware vision, capture/retry and pause.
- Local stars, best runs, sequential unlocks and a collection display. Android saves are scoped to the connected wallet; cloud sync preserves each device's best records.
- Native campaign paywall and secure cache of verified ownership for offline use. Catalog equipment drives 3D courier materials, an escape trail, a profile frame and a collection-rack finish.
- Native devnet wallet connection, signed login, checkout/restore, finalized-transfer verification and durable payment lifetimes. Resumed approvals reuse identical transaction bytes.
- Bounded server replay verification. Run tickets, client recording, online ranks and the separate paid-entry/success-return mode are still outstanding.

**Live purchases are not ready:** the current APK has no configured HTTPS API, the devnet test mint awaits funding, and physical Phantom sign-in/payment/restore remain unverified. TEST SKR has no monetary value. Mainnet SKR payments are not enabled.

## Try it

[Browser gameplay preview](http://127.0.0.1:8787) · [12-mission development playtest APK](releases/steal-a-seeker-twelve-missions-devnet-preview.apk) · [Account/paywall preview APK](releases/steal-a-seeker-account-devnet-preview.apk)

APKs are local, ignored release artifacts; they are not uploaded to GitHub. Both are development-signed ARM64 builds, not production store releases. The twelve-mission checkpoint allows free development playtesting. The newer account build enforces the requested campaign gate and needs the purchase service to unlock it.

Drag the stick to move. Stop beside the phone and hold **TAKE**. At switches the button becomes **ACT**. Carry the phone into **EXIT** and hold position for one second. **DASH** spends 20 charge; zero charge still permits walking and extraction. The decoy button appears in missions that supply decoys. Campaign retries are unlimited after buying access.

Browser controls: WASD/arrows, E to take/activate, Space to dash, Q for decoy, Esc to pause, R to restart. The mission map explains each room. Open **Hideout** for personal stars and recovered fictional phones. A recovered collectible does not promise a physical device reward.

## Run and build

Use Node 22+, Java 17 and Android SDK 36. Dependencies are pinned in package-lock.json. Configure ANDROID_HOME or ignored android/local.properties. Gradle needs several GB of free disk.

```sh
npm ci
npm start
npm run android
npm run export:web
npm run preview
npm run build:apk
```

Metro uses 8082; the static gameplay preview uses 8787. Set `EXPO_PUBLIC_API_URL` before building a connected Android APK. Physical devices need a reachable HTTPS endpoint. See [the commerce service README](server/README.md) for PostgreSQL, test-token provisioning, migrations and API startup.

## Verification

`npm run typecheck`, `npm test` and `npm run server:test` currently pass: 46 game/client tests and 14 server tests. Server tests require the dedicated local `seeker_clockin_test` database; they use synthetic chain responses and never establish a live token payment.

`scripts/playtest-campaign.cjs` exercised all twelve rooms through pointer joystick input, with no teleport or forced-win hooks. Results and source hashes are in [the campaign report](verification/campaign-web-playtest.json). After account integration, `scripts/playtest-account.cjs` verifies extraction, collection, wallet guidance and reload restoration. Both require Playwright and Chrome. Earlier v0.2 patrol scripts/reports are historical evidence and predate current navigation.

Android builds/install and native GL startup pass on the emulator. The paywall and missing-wallet return are checked separately. Full native campaign completion, owned-item rendering after a real purchase, physical Phantom, cross-device live sync and sustained phone performance remain to be tested. The FPS label measures frame-callback cadence, not GPU presentation.

## Code layout

`src/game` contains shared maps, deterministic rules, navigation and scoring. `src/three` renders the native/browser 3D scene; `src/components/GameCanvas.tsx` preserves the 2D diagnostic renderer. `src/commerce` handles wallet account state, checkout, access and equipment. `src/progress` stores campaign bests. `server` owns authenticated records, payment verification, migrations and replay workers. Client-reported campaign saves never authorize ranks or payouts.

Private deployment, refunds/support, daily rankings, paid-entry settlement, final art polish, physical validation and submission packaging remain required before calling the game complete.
