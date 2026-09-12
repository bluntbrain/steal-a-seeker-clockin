# Implementation evidence

Updated 12 September 2026. Goal remains the full game described in COMPLETE-GAME-PLAN.md. This is a progress ledger, not a reduced definition of completion.

| Requirement | Current evidence / remaining work |
| --- | --- |
| Angled real 3D | First room renders through Three.js / React Three Fiber and native Expo GL; browser and Android emulator screenshots in verification. Original 2D view remains selectable for regression comparison. |
| Camera and touch | Screen-relative joystick math test and input-driven browser playthrough pass. Physical-device feel, wall fading and final framing still need testing. |
| 3D assets | Procedural courier/robot proxy models with articulated walking; final art and polished animation remain. Equipped outfits now select materials; the escape trail uses a bounded set of meshes. |
| Dynamic guards | Patrols, scanner sweeps, noise/last-seen investigation, bounded search and return-to-route are implemented. Browser decoy interaction and extraction pass. Marked patrols accelerate after the first delivery in multi-target missions. |
| Twelve levels | All twelve authored maps pass simulation and browser joystick extraction tests. Advanced maps include power/scanner switching, two deliveries, timed relay doors and the final vault. |
| Native wallet | MWA Kit provider, secure native authorization cache, devnet wallet panel and memo transaction diagnostic implemented. Android build, wallet panel and missing-wallet handling pass on the emulator. Physical Phantom approval and successful devnet transaction remain unverified. |
| Purchase/backend | PostgreSQL API, signed wallet login, immutable orders, finalized-transfer verification, reference recovery and entitlement restore implemented; 32 server tests pass, including fixed payment lifetimes, callback recovery, ownership and progress. Native checkout is wired in source. Live mint/payment, physical Phantom, stable HTTPS deployment and operator refunds remain. See server/README.md. |
| Progress/shop | Local campaign progress uses SQLite on Android and localStorage in the browser. Stars, personal bests and sequential unlocks implemented; browser reload restore passes. Wallet-scoped saves, best-preserving client sync, the native campaign gate and equipment delivery are now wired. Browser smoke and no-wallet Android paywall pass. Physical purchase/restore/sync and owned appearance rendering remain to be tested. |
| Daily/ranking | Daily manifests, owner-bound tickets, quantized recording, durable worker verification, result recovery and one-best-per-wallet leaderboard are implemented. 14 Android simulation-parity cases pass. Browser and native-build evidence is tracked separately; physical ranked submission remains unverified. See RANKED-RUNS.md. |
| Settings/help | Sound and volume, haptics, reduced decorative effects and controls help are implemented with device-local persistence. Browser restart and storage-failure/retry checks pass. Physical audio/haptic behavior remains unverified. |
| Test entry/return | Reserve accounting and durable signed-return worker are implemented with crash/concurrency tests. Entry checkout, paid-run recovery, verified outcome authorization and native receipt flow still need integration. No live return has been sent. See RETURN-SETTLEMENT.md. |
| Submission | Current APK is a development-signed test build. Release identity/signing, fresh-clone release evidence, final deck/demo and physical testing remain. |

## Renderer decision

The selected visual direction is unchanged: native 3D with an angled overhead camera and simple controls. The implementation uses `@react-three/fiber` with `three` and `expo-gl`, rather than Filament. The installed Fiber version supports our React 19/RN versions, and the shared scene has now rendered on both web and native Android. This preserves browser playtesting without a WebView in gameplay. [Expo GL documentation](https://docs.expo.dev/versions/latest/sdk/gl-view/) describes the native GL surface.

The physics/game simulation still uses the existing fixed-step rules. Do not infer replay or reward security merely from the renderer working. Physical phone GPU/thermal behavior remains unmeasured.

## First combined test APK

`releases/steal-a-seeker-3d-wallet-devnet-preview.apk` is the development-signed native build. Its checksum and source hashes are in `verification/3d-wallet-build.json`. Native UI evidence is in `verification/3d-wallet-native-check.json`; the complete 3D browser route is in `verification/3d-web-playtest.json`. The existing 2D pointer/keyboard regression route also passed after the upgrade.

## Commerce increment

Local API listens on 8790. `npm run server:test` uses a dedicated PostgreSQL test database and synthetic chain responses; it does not prove a live payment. The public devnet faucet declined the initial funding request. Dedicated signing files are private and outside git. Access enforcement and cosmetic rendering are still outstanding.

Hosting attempt: Railway refused project creation because the account trial expired. No game service or database was created there. Stable HTTPS remains pending; Dockerfile.api and railway.toml prepare the scoped service deployment. Do not treat the local endpoint as reachable from a physical phone.

## Four-mission checkpoint

`verification/campaign-web-playtest.json` records successful pointer-joystick routes for all four warehouse levels and a reload preserving all four completion records. Each passed on the first tested phase. `npm test` passes 24 tests, including collision-safe repeated guard loops, authored input routes and progress/star rules. Native release build and emulator install pass; native mission-map and real GL screenshots are in `verification/campaign-native-*.png`. This does not establish physical-device performance, native full-campaign touch completion or Phantom approval.

`releases/steal-a-seeker-four-missions-devnet-preview.apk` includes four freely accessible development playtest rooms, the native devnet wallet panel and an unconfigured test shop. It is **not the hard-paywall release**. Stable HTTPS is blocked by Railway's expired trial. The other eight maps, playable purchased items, access enforcement, ranking and returns are still required.

## Scanner and gate checkpoint

Six missions now pass complete browser joystick routes, sequential unlocks and progress restoration. `npm test` also covers scanner sweep/cover, closed-gate collision and waiting for occupants before closure. The six-mission Android build and emulator installation pass. Native full-route input testing remains pending. Navigation around cover has separate tests and is prepared for the next guard-investigation increment; no investigation behavior is yet connected.

## Eight-mission checkpoint

`verification/campaign-web-playtest.json` now covers all eight missions, sequential unlocks, restore after reload and a pointer-triggered decoy that sends a guard to investigate. All eight succeeded on the final test's first phase. An earlier northward decoy from spawn drew the guard into the player's route and caused capture; the tested escape now throws east, away from the route. This was a route/timing correction, not removal of guard detection.

36 game tests pass. Seven server tests pass, including access-gated progress sync, concurrent best-preserving merge and wallet isolation. Progress sync records are explicitly client-reported campaign saves, never verified scores or payout evidence. Android eight-mission build/install pass; actual native eight-level playthrough and physical Phantom remain unverified. The local API is running on 8790. Railway still requires hosting to be enabled, and a second devnet faucet request failed.

Latest development APK: `releases/steal-a-seeker-eight-missions-devnet-preview.apk`, checksum/source manifest `verification/eight-mission-build.json`. The preview still exposes free development playtest rooms; the requested release paywall is outstanding. Next four levels require power switching, sequential phone deliveries, relay doors and the final vault.

## Twelve-mission checkpoint

All twelve maps passed actual pointer-joystick routes in the browser, including two-phone extraction, power switching and relay doors. Some routes required several start phases; this is input-driven play, not forced completion. 43 game tests and 11 server tests pass. `verification/campaign-web-playtest.json` contains the results and matching source hashes. The fixed native bundle installed and opened on the emulator (`verification/twelve-missions-native.png`).

`releases/steal-a-seeker-twelve-missions-devnet-preview.apk` preserves the freely accessible development playtest before the native paywall is connected. Its checksum/source manifest is `verification/twelve-mission-build.json`. This is not proof of physical Phantom payments or full native campaign completion. Replay verification currently has no public route; ranked tickets, recording and settlement remain.

## Account and purchase integration

The native app now starts at the campaign offer, requires a pass before mounting gameplay, and stores verified account state in SecureStore for offline use. Account changes remount the game with a separate SQLite key. Browser preview remains freely playable and cannot make native wallet purchases. The hideout shows personal stars, recovered fictional phones and equipment. Outfit materials, a pooled escape trail, profile frame and rack finish consume equipped ownership.

`verification/account-web-check.json` covers touch extraction after integration, collection, the native-wallet explanation and save restore. Android paywall opening and wallet navigation are separately observed; live owned-account behavior is not proven by these checks. Payment approvals now use server-persisted blockhash lifetimes; resuming preserves transaction bytes. A new lifetime requires expiry plus finalized reference reconciliation. 46 game/client tests and 14 server tests pass. Physical Phantom, endpoint/mint setup, full native completion, live sync/equipment, ranked tickets and returns remain.

## Daily ranking increment

Daily UI, published rules, ticket creation, recording, persisted pending results and replay-based rankings are now implemented. Verification uses retained immutable rule bundles. 58 game/client tests and 18 server tests pass. Fourteen fixture cases match between Node and the actual Android Reanimated UI runtime, including twelve mission routes and dash/decoy behavior. All twelve actual browser mission recordings match the pinned server verifier; completion and progress restoration pass after recorder integration. The normal Android build was restored after the dedicated parity diagnostic and its paywall was inspected. This does not establish physical Phantom, native ranked submission or payout readiness.

Hosting was rechecked: the Railway trial is still expired and no game project exists. The dedicated treasury still has zero devnet SOL; a fresh 0.1 SOL faucet request returned an internal error. The user has been asked to enable hosting and fund the test treasury while implementation continues.

Latest ranked preview: `releases/steal-a-seeker-ranked-devnet-preview.apk`, with source hashes and checksum in `verification/ranked-build.json`. This is the native hard-paywall build; its API endpoint is not yet configured. It cannot complete a new purchase until hosting and devnet mint setup are finished. The prior free campaign preview remains available for gameplay testing.

## Device preferences

Sound enablement and volume now drive the audio players; vibration has an independent preference. Reduced effects suppresses the escape trail, body/robot bobbing, phone and pad spinning, and decoy ring expansion while preserving gameplay cues. Preferences are device-local rather than wallet-specific, survive account/game remounts, and serialize writes so older saves cannot overwrite newer changes. Errors retain the current values and offer an explicit save retry. Hideout and pause screens both expose controls/help and settings.

`verification/settings-web-check.json` covers reload persistence, switches, volume, paused simulation, storage failure and recovery. An account/gameplay smoke and its pinned replay verification also pass after integration. Shared gameplay rules are unchanged from the twelve-route campaign and native simulation parity checkpoint. Physical output and owned-cosmetic reduced-effects behavior still need a phone test.

Latest preferences build: `releases/steal-a-seeker-settings-devnet-preview.apk`; checksum and exact sources are recorded in `verification/settings-build.json`. It retains the native hard paywall and unconfigured API. `npm run build:apk` now forces JavaScript rebundling when build-time endpoint or diagnostic flags change.

## Return-worker checkpoint

Migration 004, internal return reservations/allocations, durable signed transactions, claim-token recovery, expiry reconciliation and authenticated return status are implemented. Thirty-two server tests pass, including actual signed-wire encoding and a reproduced stale-balance/reserve-release race. The dedicated devnet key passes an offline identity/permissions check. The local API restarted with the new migration and returns 401 for unauthenticated return status. The worker remains disabled; there are no live return allocations. Entry/run/UI integration and physical/live-chain validation remain required. See RETURN-SETTLEMENT.md.

## Paid-entry backend checkpoint

Migration 005, reserved quotes, durable payment approvals, finalized callback recovery, explicit Start, owner-bound replay submission and pinned outcome allocation are implemented. An instruction receipt is now unique across both shop purchases and paid entries. Unstarted cancellation/24-hour expiry queues one token refund; verified capture/timeout releases only the reservation; missing/invalid evidence stays in review. Five verification infrastructure failures queue a refund. New-entry enablement is separate from return processing.

42 server tests and 58 game/client tests pass. Paid tests use real database transactions and the pinned game verifier with synthetic chain responses. They cover repeated approval bytes, RPC uncertainty, quote expiry, late payment, concurrent cancellation, one Start, duplicate win submission, one finalized synthetic return and pausing entries while completing a refund. The local API restarted with migration 005, advertises paid entries disabled, and rejects unauthenticated entry history with 401. See `verification/paid-entry-check.json`.

No paid native UI, recovered running input log, operator review-resolution workflow or live paid devnet attempt is established yet. The current APK is unchanged. Hosting, treasury provisioning and physical Phantom evidence remain pending.

## Paid app and recovery checkpoint

The hideout now opens entry terms, quote/Phantom approval, Start/cancel and wallet-bound entry history. Paid gameplay uses standard equipment, the same angled 3D renderer, a visible server submission countdown and Save / leave instead of a free restart. Result submission and entry/return explorer receipts are connected. A serialized per-entry input log saves before gameplay, once per simulated second, on pause/leave and at results. Save failures pause play; corrupt/missing logs cannot silently restart a paid attempt. Migration 006 binds the server Start to the request persisted by that installation, closing a concurrent-device recovery race.

65 game/client tests and 42 server tests pass. The real Android Reanimated diagnostic passes 28/28 cases: 14 baseline fixtures and 14 restores followed by continued play. Browser public paid terms, disabled browser payments, paused-modal behavior and the ordinary campaign route/replay regression pass. This is not proof of authenticated native paid UI interaction, SQLite recovery through process death, or physical Phantom payments.

Latest local APK: `releases/steal-a-seeker-paid-flow-devnet-preview.apk`; manifest `verification/paid-flow-build.json`. It is a development-signed hard-paywall preview with no configured API endpoint. Paid entries and return processing remain disabled locally, and no live return has been sent. Native end-to-end interaction, operator review resolution, stable hosting, funded devnet setup, device performance and final release work remain.
