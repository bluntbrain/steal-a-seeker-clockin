# Steal a Seeker

A solo Android stealth game for Clock In. Sneak past robot patrols, recover a virtual Seeker phone and reach the exit after the alarm raises the guards' speed.

The current game uses **2D Skia** in React Native on Android and React Native Web in the browser. The game is not a WebView. 3D is used only to inspect collected phones. Earlier 3D experiments and their reports are historical.

Current work and remaining gates: [September 13 release plan](docs/HACKATHON-RELEASE-PLAN.md). Submission materials: [judge guide](submission/JUDGE-GUIDE.md), [pitch deck](submission/steal-a-seeker-pitch.pptx), [demo script](submission/DEMO-SCRIPT.md).

## Try the game

- [Browser preview](http://127.0.0.1:8787): local playtest credits, campaign, cosmetics and local daily records. Credits cannot authorize a server purchase or become real tokens.
- [Signed judge APK](releases/steal-a-seeker-judge.apk): arm64 Android, separate judge package, offline campaign access. Visible JUDGE labels distinguish it from the connected build. It cannot grant server entitlements, returns or verified scores.
- [Signed devnet APK](releases/steal-a-seeker-devnet.apk): normal campaign paywall and Mobile Wallet Adapter. The current artifact connects to the deployed Railway devnet API. Automated real-token purchase, restore and payout QA passed; a physical Phantom approval remains unverified.

APKs are local, ignored artifacts rather than GitHub uploads. Their neighboring JSON files record SHA-256, source hashes and build settings. Both use a private distribution signature. Build instructions and signing backup requirements are in [RELEASE.md](docs/RELEASE.md).

## Current experience

Twelve missions span Warehouse, Rooftops and Powerworks/Vault. There are patrols, scanners, timed gates, decoys, a Warden, circuits, relays and two-phone deliveries. First-mission tips teach movement and pickup. Complete the campaign to reveal the collection ending; revisit the map for stars or play a daily challenge.

Drag the **right** joystick. Powers sit on the **left**. Stop beside a phone and hold TAKE. ACT operates nearby switches. Stay inside EXIT for one second. DASH spends 20 charge while carrying. DECOY throws in your facing direction; mobile guards in range investigate the landing ring once they lose sight of you. Scanners ignore it. Cover blocks sight, and a blocked throw does not spend a decoy.

Browser keys: WASD/arrows, E to take/activate, Space to dash, Q for decoy, Esc to pause, R to restart. Level 11 help is in Settings during that mission. Settings also provides persistent audio, haptic and reduced-effects controls, tutorial replay and optional local playtest recording/export/delete.

Native daily runs use wallet-bound tickets, pinned rules and server replay verification. One complete best run per wallet ranks by score then exact ticks; ties share rank. The app shows your best and the gap to the nearest better rank. Browser practice uses the same UTC mission rotation with local results only. No token rewards in the daily mode.

## Economy and connected service

[The test offer](docs/PAYWALL-ECONOMY-V2.md) is 100 TEST SKR for campaign access and unlimited normal retries, a one-attempt cancellation trial, optional cosmetics and a 25 TEST SKR completion rebate under the stored purchase terms. TEST SKR has no monetary value. No NFT or mainnet investment return is promised. A virtual phone does not entitle the player to a physical Seeker.

The server handles signed sessions, finalized transfer checks, entitlement restore, progress and durable payout reconciliation. See [server setup](server/README.md). Public HTTPS hosting, a funded test mint/treasury and physical Phantom verification remain required. The separate legacy paid-entry mode stays outside the current campaign offer.

## Run and build

Node 22+, Java 17 and Android SDK 36 are required. Dependencies are pinned. Configure ANDROID_HOME or ignored android/local.properties.

```sh
npm ci
npm run typecheck
npm test
npm run export:web
npm run preview
# Android; signing files are created outside the repository.
npm run signing:init
npm run build:judge
npm run build:apk
```

`npm start` runs Metro; `npm run android` runs a development Android build. Static preview uses port 8787. Set `EXPO_PUBLIC_API_URL` explicitly when building a connected native artifact. Release scripts ignore `.env`, force diagnostic flags off and check the pinned rules. They do not provision or deploy a service.

## Verification and limits

September 13: 83 game/client tests and 52 backend tests pass. All 12 authored simulation routes pass. Backend tests use the dedicated `seeker_clockin_test` PostgreSQL database and synthetic chain responses; they do not prove a real token payment.

Current browser UI checks cover 320×568, 390×844 and 430×932 controls, onboarding, optional reports, the daily rotation and collection-ending layout. The ending layout test uses an explicit fixture. Current actual-pointer routes cleared missions 1–3, but failed the tested timing phases in Crossing Signals. Full current browser campaign proof remains open; earlier all-12 reports are not substituted for it.

The Android 16 arm64 emulator checks standalone judge launch, movement/decoy, pause, backgrounding, settings persistence and native layout. Performance readouts measure callback cadence, not GPU presentation; emulator measurements are not phone benchmarks. Physical device, audible audio/haptics, 15-minute thermal run, full touch campaign and Phantom transactions remain pending.

For voluntary outside testing, use [PLAYTEST-PROTOCOL.md](docs/PLAYTEST-PROTOCOL.md). Real-player retention and PMF have not been established. The [privacy/support draft](submission/PRIVACY-AND-SUPPORT.md) needs operational details before store publication.

## Source layout

`src/game`: deterministic maps/rules. `src/components/GameCanvas.tsx`: current 2D rendering. `src/commerce` and `src/wallet`: native accounts and MWA. `src/ranked`: daily runs. `src/progress`: local/cloud bests. `src/onboarding` and `src/telemetry`: coach and voluntary local reports. `server`: authentication, payments and replay workers. Client saves and telemetry never authorize money or ranks.

## Live devnet backend

API: https://seeker-api-production-41b3.up.railway.app — one API replica and private PostgreSQL, app sleep disabled. See [Railway runbook](docs/RAILWAY-DEPLOYMENT.md) for configuration and deployment commands. [Live QA evidence](verification/deployed-api-qa.json) records 26 passing groups, including real TEST SKR purchases, all 12 server-verified mission replays and one completion payout. The local backend suite now passes 53 tests.
