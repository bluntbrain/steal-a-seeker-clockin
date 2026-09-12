# Steal a Seeker

An Android solo stealth game with an angled overhead 3D camera. Sneak past robot guards, recover a Seeker and reach the exit. Built with React Native, Three.js / React Three Fiber, Expo GL and Solana Mobile Wallet Adapter. Android gameplay uses a native GL surface, not a WebView; the browser is a separate React Native Web playtest.

Status: 12 September 2026. The complete goal remains in [the game plan](docs/COMPLETE-GAME-PLAN.md). [Implementation evidence and remaining work](docs/IMPLEMENTATION-STATUS.md) distinguishes tested features from unfinished integration.

## Browser-first testing

Android testing is paused for this iteration. Open the [browser game](http://127.0.0.1:8787) and follow the [end-to-end test guide](docs/WEB-TEST-GUIDE.md). The [three-screen plan](docs/WEB-FIRST-PLAN.md) covers Welcome, Hideout and Heist. The browser grants 250 local playtest credits; you can buy access, equip every cosmetic, save progress, play local daily runs and test entry/return behavior without a wallet. These credits are not SKR and never authorize server purchases or token transfers.

## Current build

- Twelve authored missions: patrol timing, scanners, timed gates, decoys, investigation, a Warden, power switching, relay doors and two-phone deliveries.
- Fixed 30 Hz simulation, touch joystick, pickup/action, battery-powered dash, mission tools, cover-aware vision, capture/retry and pause.
- Local stars, best runs, sequential unlocks and a collection display. Android saves are scoped to the connected wallet; cloud sync preserves each device's best records.
- Native campaign paywall and secure cache of verified ownership for offline use. Catalog equipment drives 3D courier materials, an escape trail, a profile frame and a collection-rack finish.
- Native devnet wallet connection, signed login, checkout/restore, finalized-transfer verification and durable payment lifetimes. Resumed approvals reuse identical transaction bytes.
- Persistent sound, volume, vibration and reduced-effects preferences; controls help is available from the hideout and pause screen.
- Daily challenges with wallet-bound tickets, quantized input recording, a durable verification queue, immutable rule bundles and one best verified score per wallet. The separate paid-entry/success-return backend now connects payment recovery, one run and verified returns/refunds. Its app screens and run recovery are connected; full native interaction and live-chain testing remain incomplete; see `docs/PAID-ENTRIES.md`.

**Live purchases are not ready:** the current APK has no configured HTTPS API, the devnet test mint awaits funding, and physical Phantom sign-in/payment/restore remain unverified. TEST SKR has no monetary value. Mainnet SKR payments are not enabled.

## Try it

[Browser gameplay preview](http://127.0.0.1:8787) · [12-mission development playtest APK](releases/steal-a-seeker-twelve-missions-devnet-preview.apk) · [Latest account/settings preview APK](releases/steal-a-seeker-settings-devnet-preview.apk)

APKs are local, ignored release artifacts; they are not uploaded to GitHub. Both are development-signed ARM64 builds, not production store releases. The twelve-mission checkpoint allows free development playtesting. The newer account build enforces the requested campaign gate and needs the purchase service to unlock it.

Drag the stick to move. Stop beside the phone and hold **TAKE**. At switches the button becomes **ACT**. Carry the phone into **EXIT** and hold position for one second. **DASH** spends 20 charge; zero charge still permits walking and extraction. The decoy button appears in missions that supply decoys. Campaign retries are unlimited after buying access.

Browser controls: WASD/arrows, E to take/activate, Space to dash, Q for decoy, Esc to pause, R to restart. The mission map explains each room. Open **Hideout** for personal stars and recovered fictional phones. A recovered collectible does not promise a physical device reward.

## Run and build

Use Node 22+, Java 17 and Android SDK 36. Dependencies are pinned in package-lock.json. Configure ANDROID_HOME or ignored android/local.properties. Gradle needs several GB of free disk. `build:apk` forces a fresh JavaScript bundle so changed API endpoints or diagnostic flags are included.

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

`npm run typecheck`, `npm test` and `npm run server:test` currently pass: 67 game/client tests; the latest separate backend checkpoint passed 48 server tests. Server tests require the dedicated local `seeker_clockin_test` database; they use synthetic chain responses and never establish a live token payment.

The current web flow is exercised by `scripts/playtest-web-flow.cjs`, `scripts/playtest-web-campaign.cjs` and `scripts/playtest-web-entry.cjs`. Earlier scripts below are historical and predate the new browser access / Hideout flow.

`scripts/playtest-campaign.cjs` exercised all twelve rooms through pointer joystick input, with no teleport or forced-win hooks. Results and source hashes are in [the campaign report](verification/campaign-web-playtest.json). After account/ranking integration, `scripts/playtest-account.cjs` verifies extraction, collection, public daily reads, native wallet guidance and reload restoration. `npx tsx scripts/verify-browser-replay.ts` checks its actual input recording against the pinned server verifier. Both require Playwright and Chrome. `scripts/playtest-settings.cjs` checks restart persistence, storage-error recovery and pause-screen access. Earlier v0.2 patrol scripts/reports are historical evidence and predate current navigation.

Android builds/install and native GL startup pass on the emulator. The paywall and missing-wallet return are checked separately. Fourteen Android Reanimated UI-runtime replay cases match Node fixtures; see [daily verification details](docs/RANKED-RUNS.md). Full native touch campaign completion, actual native ranked submission, owned-item rendering after a real purchase, physical Phantom, cross-device live sync and sustained phone performance remain to be tested. The FPS label measures frame-callback cadence, not GPU presentation.

## Code layout

`src/game` contains shared maps, deterministic rules, navigation and scoring. `src/three` renders the native/browser 3D scene; `src/components/GameCanvas.tsx` preserves the 2D diagnostic renderer. `src/commerce` handles wallet account state, checkout, access and equipment. `src/progress` stores campaign bests; `src/settings` stores device preferences. `server` owns authenticated records, payment verification, migrations and replay workers. Client-reported campaign saves never authorize ranks or payouts.

Private deployment, refunds/support, paid-entry settlement, final art polish, physical validation and submission packaging remain required before calling the game complete.

[Devnet return-worker implementation and remaining entry-flow work](docs/RETURN-SETTLEMENT.md).
