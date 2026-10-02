> **13 September 2026:** Current selected sprint, signed APKs, onboarding, telemetry and daily updates are tracked in [HACKATHON-RELEASE-PLAN.md](HACKATHON-RELEASE-PLAN.md). Android testing has resumed; physical USB is not detected yet. Older counts and deferred-Android notes below are historical.

> **12 September 2026 — economy update:** See [PAYWALL-ECONOMY-V2.md](PAYWALL-ECONOMY-V2.md). The 100/25 test offer, cancellation trial, cosmetics review, campaign replay verification/rebate allocation, score-based board and audio are now implemented. Live devnet/Phantom and hosted deployment remain unverified. [Hosting comparison](BACKEND-HOSTING.md).

# Steal a Seeker — remaining work

Audit: 12 September 2026, source commit 96d9924. This is the current completion checklist. Earlier plans and checkpoints describe superseded work. Current direction: **2D gameplay, with 3D only for inspecting collectible phones.**

## What we have

- Twelve authored campaign missions, sequential unlocks, stars, personal bests and saved progress.
- Working movement, collision, pickup, dash, decoys, guards/scanners, theft alarm, timed gates, switches, relays and multi-phone deliveries.
- Illustrated hideout and district maps, a twelve-phone rack, corrected phone crops and interactive 3D inspection.
- Browser campaign gate, five cosmetic products, equip/restore, local daily records and a local entry/return flow.
- Native MWA/Phantom integration and commerce client in source.
- PostgreSQL services for authentication, orders, entitlements, progress, ranked replay verification, paid entries, returns and limited operator review.
- Evidence includes 74 game/client tests and 48 server tests at the security checkpoint; all twelve browser missions and replay verification; subsequent world, collection, crop and 3D viewer checks. This audit did not rerun the test suites.

**What this does not prove:** a current Android release, physical Phantom payment, live token return, public server availability or real SKR operation. Browser credits stay in local storage and do not become on-chain money or server entitlements. During this audit, HTTP requests to the previously documented local API at 127.0.0.1:8790 failed to connect.

Priority: P0 blocks a complete connected Android/devnet build; P1 blocks a polished public release; P2 is an optional expansion.

## 1. Set the final payment contract — P0 decision

- [ ] Confirm how the original request to pay for each level should work. The current implementation sells one campaign pass for unlimited normal retries and has a separate paid challenge on Battery Dash. It does not charge entry for all twelve missions.
- [ ] If every mission needs paid entry, implement server-selected mission quotes, mission-specific terms and pinned rules, eligibility/unlocks, entry history and settlement across all twelve. Never trust a client-selected price or success result.
- [ ] Define what success returns: the entry amount, an additional reward, or another stated amount. Current fixtures return the entry amount only; that is not profit, and network fees are separate.
- [ ] Finalize campaign, cosmetic and entry prices for release. The existing 50/20/8/5/12/10 amounts are test fixtures, not validated mainnet prices.
- [ ] Decide whether the hackathon build includes the paid-return mode or demonstrates it separately on devnet.
- [ ] Define phone ownership accurately: currently virtual collectibles earned by campaign completion. Transferable NFTs, physical Seeker rewards and SKR rewards for collection are not implemented.

**Done when:** one short product/economy specification agrees with the paywall, catalog, level entry, results and backend.

## 2. Restore and deploy the backend — P0 implementation/operations

- [ ] Start and verify the local API/database again; it was unreachable during this audit.
- [ ] Obtain working hosting for the API, PostgreSQL and background verification/return workers. The last recorded Railway attempt was rejected by an expired trial; this audit did not recheck account billing.
- [ ] Deploy a stable HTTPS endpoint reachable from a phone away from this laptop.
- [ ] Apply and verify all seven existing database migrations; test a fresh database and an upgrade path.
- [ ] Configure identities, RPC, token mint, treasury and worker settings through server secrets/configuration.
- [ ] Configure EXPO_PUBLIC_API_URL and the app identity in the Android build.
- [ ] Add service/worker health checks, sanitized error reporting, restart behavior, database backups and a tested restore.
- [ ] Run authentication, catalog, purchase reconciliation, progress, ranking and return smoke checks against the deployed service.

**Done when:** the phone reaches a persistent service, and app/server restarts preserve orders and results.

## 3. Provision working devnet assets — P0 integration

- [ ] Verify current treasury/mint status. Previous notes record failed faucet attempts; no successful live provisioning is established.
- [ ] Fund the dedicated development treasury with devnet SOL and provision the TEST SKR mint/token account.
- [ ] Give the test wallet TEST SKR and enough devnet SOL for fees.
- [ ] Verify mint, decimals, token program, treasury destination and RPC network before enabling payments.
- [ ] Enable paid entries and the return worker only after funding and recovery tests are ready.

**Done when:** the configured test wallets can make a real devnet token transfer and receive a finalized return. TEST SKR is a development token, not real SKR.

## 4. Build the current game on Android — P0 build/integration

- [ ] Produce a new APK containing the latest 2D world, guard/alarm rules, compact sheets, corrected phone art and 3D inspector.
- [ ] Resolve or isolate the existing local native-recovery diagnostic changes; exclude diagnostic flags from the normal build.
- [ ] Confirm Skia gameplay and the separate Three/Expo GL inspector mount, render and dispose on Android.
- [ ] Check Android back, safe areas, gesture navigation, pause/resume and wallet handoffs.
- [ ] Test installation from scratch and updating an existing build without losing progress.
- [ ] Test on an actual Android phone with Phantom. A Seeker is useful for final ecosystem/device testing, but emulator results alone do not establish physical-device behavior.

**Done when:** the current release candidate installs and its normal user flow works on a physical phone.

## 5. Prove wallet login, checkout and restore — P0 validation

The MWA provider, signed login, durable orders and finalized receipt verification exist. These still need live evidence:

- [ ] Connect, reject, reconnect, disconnect, switch wallet and recover an expired session.
- [ ] Handle missing Phantom, wrong network, insufficient SOL, insufficient tokens and user-cancelled approval.
- [ ] Buy the campaign pass in Phantom; confirm the server verifies the transfer and unlocks play once.
- [ ] Buy/equip each of the five cosmetic products and verify its actual appearance.
- [ ] Restore purchases after reinstall and on another device using the same wallet.
- [ ] Verify another wallet cannot inherit the first wallet's inventory or saves.
- [ ] Kill/background the app after signing but before the callback; reconcile the original payment without another debit.
- [ ] Exercise slow finality, RPC outage, stale quotes and lost callbacks against live devnet.
- [ ] Finish native balance/account presentation; the new hideout header currently shows DEVNET rather than a full live balance display.

**Done when:** buy → play → equip → close → reopen → restore succeeds with recorded devnet receipts.

## 6. Finish paid-entry settlement and exceptional payments — P0 if retained

The normal lifecycle and durable workers exist; synthetic chain tests are not a live payout test.

- [ ] Complete a real paid devnet entry from quote to Phantom approval to Start.
- [ ] Win through normal controls; server verifies the recorded run and sends exactly one return.
- [ ] Capture/timeout produces the stated outcome; unstarted cancellation produces one refund.
- [ ] Test app/process death during a paid run using real Android SQLite, then resume the same attempt and deadline.
- [ ] Verify pending results survive reinstall/restart where supported; missing/corrupt evidence leads to clear review handling.
- [ ] Test worker crashes before/after broadcast, lost RPC responses and duplicate submission without duplicate money.
- [ ] Complete the missing late/additional-payment compensation workflow. The current operator tool cannot resolve all late transfers, extra transfers or payments whose original reserve was released.
- [ ] Finish purchase-specific refund/review handling beyond the existing original-entry refund tool.
- [ ] Test reserve capacity, exhausted funding, paused new entries and continuing existing obligations.
- [ ] Provide clear pending/confirmed/refunded/review states, receipt links and a support path.

**Done when:** success, failure, cancellation and recovery each produce one correct durable outcome, with transaction evidence.

## 7. Validate online daily rankings — P0 connected feature

- [ ] Use the deployed daily manifest, wallet-bound tickets and verifier from the actual Android app.
- [ ] Re-run Node/Android replay parity using the current guard, alarm and decoy rules. Old parity runs predate those changes.
- [ ] Complete and submit a physical-device daily run; show its verified rank.
- [ ] Verify two wallets appear in the same leaderboard with the intended one-best-per-wallet behavior.
- [ ] Test day rollover, tied scores, expired/reused tickets, interrupted uploads, pending-result recovery and worker restart.
- [ ] Keep campaign saves, browser records and server-verified scores visibly distinct.

**Done when:** two real clients can complete, submit, reload and see consistent verified daily results.

## 8. Balance and finish the campaign experience — P1 polish

- [ ] Play every mission with touch on a phone, not just automated browser routes.
- [ ] Tune first-mission difficulty, patrol timing, alarm escalation, decoy readability and escape routes with new-player feedback.
- [ ] Add a concise first-run guide after access is granted: move, take, exit, decoy, dash and alarm.
- [ ] Explain each new mechanic in its briefing without recreating long sheets.
- [ ] Check switch/relay combinations, closing gates, pickups and multi-target extraction for soft locks.
- [ ] Add a proper final-campaign/collection-complete state; the current Continue action falls back to the last mission.
- [ ] Finalize scoring and star thresholds, failure messages and replay/next-mission navigation.
- [ ] Test interruptions, no-network campaign play and storage-failure recovery across the campaign.

**Done when:** a first-time player can understand and finish the campaign, including its ending, without developer explanation.

## 9. Finish visual, audio and UI parity — P1 polish

- [ ] Bring native wallet, checkout, shop, daily and entry screens up to the newer hideout visual standard.
- [ ] Check actual-device font scaling, contrast, button targets and all loading/error/empty states.
- [ ] Preserve non-scrolling game message sheets; use short pages or selection states where long catalogs need them.
- [ ] Verify purchased outfits/trail/frame/rack visibly match their previews. Improve weak recolors or unclear previews before charging for them.
- [ ] Review repeated environment props and tune courier/guard scale and floor contrast for readable phone gameplay.
- [ ] Validate the 3D phone viewer's rendering, touch rotation and resource cleanup on Android.
- [ ] Finish the app's own movement, detection, decoy, gate, failure and extraction audio/haptic feedback; test mute, volume and reduced effects physically.

**Done when:** every native screen feels part of the same game, and purchased appearance changes are clear.

## 10. Measure performance and package assets — P1 release work

> **2 October 2026:** frame loop, camera, overlay re-renders, guard cones, route rounding, audio hooks and asset packaging were fixed on `main`; see [PERFORMANCE-PLAN-2026-10-02.html](PERFORMANCE-PLAN-2026-10-02.html). Sprite sheets are WebP (57.8 MB to 7.8 MB), the paywall video is 2.3 MB, and the code 36 APK is 90.7 MB. Physical-device profiling, R8, Filament weight and the pathfinding bundle bump remain open below.


- [ ] Profile the release APK, including late levels with several guards and an active alarm.
- [ ] Measure frame times, input latency, cold start, memory and at least a 15-minute heat/battery session.
- [ ] Measure opening/closing the 3D inspector repeatedly for memory/context leaks.
- [ ] Compress/resize runtime textures where they improve memory and startup without harming appearance.
- [ ] Check the APK asset list. The twelve exported GLBs total about 40 MB and are reference/export assets; they should not all be bundled just because app.json has a broad assets/**/* pattern.
- [ ] Exclude concept sheets, verification screenshots, videos, unused legacy 3D gameplay and development-only exports from the shipping package.
- [ ] Validate a lower-effects setting on slower phones.

**Done when:** physical-device performance and APK size are measured and acceptable, rather than inferred from desktop FPS.

## 11. Prepare a dependable release — P0/P1

- [ ] Finalize app name, package ID, version, icon and splash. Current identifiers still include MVP.
- [ ] Create and protect a release signing identity. Android release currently uses the debug signing configuration.
- [ ] Make a clean-clone, documented build with environment examples and no private credentials.
- [ ] Verify the actual release artifact uses the intended endpoint, cluster and rules hash.
- [ ] Add support/contact and privacy information appropriate to wallet/account data, stored replays and diagnostic collection.
- [ ] Define retained data, support/refund procedures and operational responsibilities.
- [ ] Add essential crash/error monitoring and product events for purchase failure, mission failure/completion and replay/return status.
- [ ] Test backups, restore and rollback without losing payment/replay obligations.
- [ ] Document unresolved cases and collect tester reports with app version, device and receipt/order identifiers.

**Done when:** the release is reproducible, supportable and recoverable.

## 12. Prepare the hackathon submission — P0 for submission

- [ ] Recheck the live rules, eligibility, deadline/timezone and submission form; old research contains conflicting announcement dates.
- [ ] Prepare the installable current Android APK, checksum and installation/test instructions.
- [ ] Give judges repository access and a clean build path.
- [ ] Provide a deliberate judge/testing access path and test-token instructions, so the hard paywall does not prevent review.
- [ ] Record a three-minute demonstration of the actual current app on a device, including meaningful Solana interaction.
- [ ] Finish the deck/presentation: problem, game loop, Seeker audience, SKR design, product progress and scope.
- [ ] Use current screenshots and describe devnet versus mainnet honestly.
- [ ] Prepare dApp Store publisher materials and the publication workflow, checking the current event/store requirements before submission.

**Done when:** another person can install, access, play and review exactly what was submitted.

## 13. Real SKR release — separate from the devnet milestone

- [ ] Implement and review a production network configuration. Current payment types, identity and signer protections are devnet-specific; replacing a label or RPC string is not a complete migration.
- [ ] Verify the real token's mint/program/decimals, production pricing, fees and account handling.
- [ ] Separate mainnet signer/treasury operations from development and test funding.
- [ ] Establish funded return limits and review the real-money entry/return design, user terms and distribution eligibility before enabling it.
- [ ] Validate ordinary campaign/cosmetic commerce separately from conditional paid-attempt returns.
- [ ] Run a controlled production checkout/restore pilot before a broad launch.

**Done when:** production commerce and any conditional returns meet their own reviewed release criteria. Successful TEST SKR transfers alone do not satisfy this milestone.

## Suggested order

1. Lock the payment contract while completing the remaining browser onboarding, ending and UI polish.
2. Restore/deploy the backend and provision devnet assets.
3. Build the current Android app and prove one complete Phantom purchase/restore loop.
4. Prove paid settlement, exceptional-payment handling and verified daily rankings.
5. Complete all-level physical playtesting, performance, recovery and release signing.
6. Prepare the device demo, deck, judge access and submission.
7. Treat mainnet real-SKR enablement as its own release gate.

While Android remains paused, steps 1, backend work, exception handling, asset preparation and submission writing can continue. Physical wallet, native recovery and performance checks cannot be marked complete from the web build.

## Optional later expansion — P2

Additional missions, more outfit silhouettes, extra daily variants, collection achievements, seasonal events, new gadgets, multiplayer and tradable collectibles are potential extensions. They are not substitutes for the unfinished core integration and release work.
