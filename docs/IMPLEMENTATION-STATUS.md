# Implementation evidence

Updated 12 September 2026. **Current priority: browser end-to-end playtesting; Android testing paused at the user’s request.** See WEB-FIRST-PLAN.md and WEB-TEST-GUIDE.md. Goal remains the full game described in COMPLETE-GAME-PLAN.md. This is a progress ledger, not a reduced definition of completion.

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

## Operator-review checkpoint

Migration 007 and the local `server/review.ts` tool add audited decisions for original-entry refunds, exact stored-replay retries and reconciliation of existing returns. Decisions require an inspected-state hash, operator note and idempotent request UUID. Entry refunds reconfirm the original finalized receipt and allocate once; replay retries rehash the canonical stored inputs; return retries preserve the active signed transaction and permit only bounded additional lifetimes. There is no HTTP operator endpoint.

48 server tests pass, with dedicated concurrency, stale-request, missing-receipt, corrupted-replay, preserved-signature and retry-budget checks. The normal APK and client code are unchanged. The local API restarted with migration 007 and paid entries still disabled; no live review or refund was applied. Late/additional-payment compensation remains a separate required workflow. Full native paid UI, SQLite process-death testing, physical Phantom, hosting, funded devnet setup and release validation remain.

## Browser-first product flow and 3D detail

Welcome, Hideout and Heist are the three main views. Mission selection, briefing, stars and the collection now share the Hideout. Shop, daily practice, entry challenge and settings are panels; pause/results remain overlays. Duplicate gameplay navigation and the normal 2D toggle were removed from the current UI. The 2D renderer remains in the source for historical diagnostics.

The web platform now has an independent local playtest economy: 250 initial credits, 50-credit campaign access, all five purchasable cosmetics with equipment delivery, local receipts and restore, personal daily records, and a 10-credit entry with a 10-credit successful return. No web playtest code creates an authenticated wallet session, server entitlement or chain payment. Native platform providers retain the actual MWA/devnet implementation.

67 game/client tests pass. The new browser flow check covers fresh purchase, every cosmetic, equipment persistence, menu keyboard isolation, unstarted cancellation, saved entry movement through reload without another debit, started abandonment and an actual daily escape. A separate actual-input entry check observed a capture with no return and then an escape with exactly one 10-credit return; reload preserved the result. All twelve campaign missions passed pointer routes with sequential unlocks and progress restore. Later routes needed several patrol phases; no teleport or forced-win hooks were used. All twelve recordings also match the pinned server verifier. Final navigation/camera framing refinements do not alter simulation or replay rules; the UI flow is rerun on the final export. Evidence: verification/web-first-*.

3D art now includes rounded courier/robot parts, helmet/headset and backpack details, strapped crates, shelf contents, roof vent fans, vault lights, inset phone screens, floor markings, grounded shadows and distinct district palettes. Desktop has a larger scene and fixed room framing; portrait retains the follow camera. These remain procedural stylized assets, not final rigged production characters.

Android work is explicitly paused. The synthetic native recovery diagnostic and UI-harness work remain an incomplete separate worktree task; no new native process-death pass is claimed. Physical Phantom, stable hosted API, funded mint, live devnet payment/return, device profiling, final production art and release/submission checks remain required.

## 12 September 2026 — return to 2D / reference art pass

User direction changed from live 3D to the original fixed 2D view, following the existing `assets/seeker` concept sheets. All active modes now render with Skia 2D and direct joystick / keyboard directions. Added five generated runtime image files: courier portrait, crate, cabinet, roof floor and vault floor. Existing animated courier atlas retained. Distinct code-native patrol/scanner/warden bodies follow the enemy sheet; generated robot cutouts were rejected because their checkerboards were baked into RGB.

Charcoal interface, bottom-anchored shop/daily/entry/settings and pause/results, actual success portrait, stronger directional dash burst, optional cosmetic trail and reduced-effects behavior. Real dash remains 1.6 world units over 0.2s, 20 charge and 2s cooldown; pinned gameplay rules unchanged. Multiple target pedestals and spawn markings now follow the level data. Cabinet/crate source crops remain within blocker footprints.

Verification: TypeScript and 67 tests pass; all twelve campaign missions completed with actual browser pointer controls; all twelve captured input logs match the pinned server verifier; browser shop/equip, local balance, save/reload, entry recovery/abandonment and daily flow pass. Separate entry test captured a failure and a success with exactly one return of 10 local credits. Design checks verify real dash motion and charge, bottom sheet edge placement, desktop/phone fit and no runtime errors. Final cabinet artwork and sheet placement were visually checked after the full campaign run; they do not change simulation rules.

`design/visual-v2/` contains the implementation plan, exact image prompts, asset provenance, twelve current level screenshots, thirteen UI captures and a local gallery at `/design/index.html`. This is browser validation only. Live Phantom/devnet funding, hosting, settlement, APK and physical Android checks remain unfinished/deferred. Existing unrelated native-recovery diagnostics are not included in this visual commit.

## Security difficulty pass — 12 September 2026

All twelve campaign maps now have one to four guards/scanners, two or three decoys, and an immediate theft alarm. Mobile guards move 40% faster on pickup, rising to 80% over 30 active seconds; scanner sweeps accelerate too. The alarm persists between deliveries. The red wash, border and original looping siren stop on pause/results; mute and reduced effects work independently.

Decoys are six-second beacons. Every mobile campaign guard can hear them within nine tiles, navigate to them and search. Watching guards prioritize the courier and scanners ignore noise. Landing previews, actual investigation paths, responder counts and blocked/out-of-range feedback explain the tool. The pathfinding/collision radius mismatch that rejected legitimate patrol lanes is fixed. See SECURITY-DIFFICULTY.md.

Validation: 74 game/client tests, 48 server tests and TypeScript pass. All 12 campaign missions completed through real browser controls, with sequential unlocks and restored progress. Two Targets needed two attempts, Silent Circuit three, and the final vault used two explicit decoys. All 12 captured input logs match the pinned server verifier. A separate 390×844 browser check verified actual decoy movement, alarm audio, pause, mute and steady reduced-effects rendering. Local paid-entry testing observed a capture with no return and then a successful escape with exactly one 10-credit return, retained after reload.

Evidence: verification/security-*. Immutable historical rule bundles are retained. Old native fixtures are not evidence of this changed simulation; current recovery tests use current campaign replays. No Android build or physical-device claim is made, and no real token transaction was sent. Existing user purchases and stars are preserved.

## Compact result sheets — 12 September 2026

The in-board scrolling result card is replaced by a content-sized sheet anchored to the screen bottom. Courier illustration and short copy sit side by side; primary and secondary actions share one row. Success shows stars and one compact stats line. Pause, caught and timeout each have one short instruction. Saving/recovery indicators and retry actions remain available without nested scrolling. Shop/catalog and settings are separate content panels; this change concerns game message sheets.

Six generated illustrations in assets/messages match the supplied courier references: success, caught, timeout, pause, recovery and pending. The art README records exact prompts and provenance. The gallery at /design/sheets/index.html renders the actual shared component with clearly labelled sample data.

All 24 layout combinations (six states at 320×568, 390×844, 430×932 and 844×390) fit without scrollable or clipped children. Live gameplay checks pass for pause/resume and paid-entry capture/win, including saved credits and the result receipt. Security sound/decoy checks were rerun with the new overlay. TypeScript and web export pass. These are browser checks, not a fresh Android validation.

## Reference-based collection and world pass — September 12

Implemented in 2D:
- Twelve distinct phone editions map to the twelve campaign missions. The same atlas edition appears in the mission briefing, pickup, courier's hand and collection. Multi-target missions deliver two of that mission's edition and award one collection slot after completion.
- A generated hideout room contains a live 4×3 rack, actual stars and local balance. Existing progress restores earned phones without migration. Slots select phone details; shop, entry, daily and settings remain available.
- Three generated district maps have twelve live mission nodes, connecting paths, locks and earned stars. Briefings render the actual level geometry.
- Graphite floor art, warehouse shipping details, rooftop HVAC and railings, powerworks server hardware, and fenced roof gaps / timed bridges in Narrow Crossing. Walkable areas, guard visibility and recorded physics remain unchanged.
- Smaller gameplay headers leave a 504px-tall board at 390×844, previously 448px. New hideout/map/briefing views fit without scrolling at tested portrait sizes.

Validation: 74 gameplay/client tests and TypeScript pass. Browser checks cover 320×568, 390×844 and 430×932, every mission briefing and scene, lock behavior, restoration of existing completed saves and zero page errors. The full web flow also passed: purchase and equip all cosmetics, restore purchases after reload, debit/cancel an entry, restore a saved run without a second debit, abandon a started entry, save an actual daily result, and retain settings. The security browser test verifies decoy response, pickup alarm, sound, pause and reduced effects. See verification/world-v3 for screenshots and the fresh-profile collection extraction check. Full-rack gallery screenshots restore previously verified actual-input results in an isolated profile; they do not grant progress to the user's save.

Android installation and physical-device Phantom testing remain deferred. These are virtual collectible phones; this change does not create NFTs or promise physical device rewards.

## Phone crop fix and 3D inspection — September 12

Replaced guessed atlas cells with measured padded phone bounds; rack thumbnails also fit their actual slots at small widths. Added a lazy interactive 3D phone viewer from rack slots and detail cards, including uncollected previews. Six angle controls and drag rotation reveal authored backs, cameras, keys and ports. Exported twelve reusable GLB models. Web checks cover all editions, small viewports, gestures and return to the 2D game. Native device testing remains deferred. See docs/PHONE-COLLECTION-VIEWER.md and verification/phone-viewer/.
