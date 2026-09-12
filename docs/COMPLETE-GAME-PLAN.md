# Steal a Seeker — complete game plan

> Current completion checklist: [REMAINING-WORK.md](REMAINING-WORK.md). This document retains historical plans/checkpoints; older 3D gameplay, missing-feature and test-count statements are superseded. The selected game is 2D; 3D is used for phone inspection only.

12 September 2026. Planned work, not implemented features. The user selected an **angled overhead view with real 3D depth and simpler controls**. See [3D-GAMEPLAY.md](3D-GAMEPLAY.md) for camera, input and the one-room prototype. The visual direction is selected; the renderer dependency still needs a native compatibility test.

## Current build

Source audited at `fa769c2`. The web demo is React Native Web, sharing game code and React Native components with Android. Android uses native React Native/Skia, not a WebView. The project already has an Android build and earlier test APK.

Working: touch movement, collision, phone pickup, slower carrying, battery-powered dash after pickup, extraction, two patrols with occluded vision, capture, retry, pause/background handling, basic audio/haptics and a courier atlas. Quiet Pickup and Night Shift share one warehouse geometry: they are two modes, not two separate maps.

Missing: persistent progress, 11 additional layouts, app navigation, wallet packages, backend, payments, usable shop, purchase restore, online ranking and rewards. Generated screens/posters are design references, not completed app features. The new 3D direction is a prototype decision, not something the existing Skia renderer already supports.

## Product contract

Solo heists with robot guards. Sneak in, grab a Seeker and escape. Normal campaign access is a one-time hard-paywall purchase covering 12 levels and unlimited normal retries. Cosmetic purchases change appearance, never ranked performance. A daily challenge provides shared rules without requiring a multiplayer lobby.

Build the requested paid-entry/success-return flow on devnet as a separate test mode. Display TEST SKR clearly; real SKR remains the intended mainnet currency, but a devnet token is not real SKR. Ordinary campaign retries must not unexpectedly become paid attempts.

## App screens and navigation

`Launch → introduction/access offer → wallet → checkout/restore → hideout → mission map → briefing → game → results`

| Screen | Required content and behavior |
| --- | --- |
| Introduction and paywall | Game premise, 12 missions, one-time price, retry policy, network and restore |
| Wallet | Connected account, network, test-token/SOL balances, disconnect and account switching |
| Checkout | Exact item and quote, fee estimate, Phantom handoff, pending/success/failure, receipt |
| Hideout | Continue, mission map, collection, shop, daily challenge and settings |
| Mission map | Three districts, prerequisites, stars and personal bests |
| Briefing | Objective, new mechanic, loadout, target time versus hard timeout |
| Game | Move, pickup, dash, tool, battery, alert, objective count, pause |
| Results | Reason for failure or extraction result, stars, best time, next/retry, online verification status |
| Shop/wardrobe | Preview, buy, owned and equipped states; actual in-game appearance changes |
| Collection | Recovered fictional phones and earned badges; no implied real-device reward |
| Daily/rankings | Published daily rules, fixed loadout, verified results and personal position |
| Devnet challenge | Entry and gross return, interruption rules, run status and settlement receipt |
| Settings/help | Audio, haptics, reduced effects, controls, support and build information |

Every service-backed screen needs loading/offline/retry states. Cancellation must return to a usable screen. Backgrounding must not silently lose a purchase or advance a paused campaign run. Public browsing is available before purchase; campaign gameplay requires access. Private test/judge entitlements are explicitly provisioned, not a public unlock button.

## Twelve distinct levels

Retain the existing three-district design. The camera and 3D prototype may change geometry, but each level still teaches a different decision. Times below are starting tuning values, not measured results.

| # | Mission | Distinct mechanic/layout | Target / hard limit |
| --- | --- | --- | --- |
| 1 | Quiet Pickup | Unguarded teaching room; movement, pickup, carry and exit | 1:00 / 2:00 |
| 2 | Cone Lesson | One patrol loop around cover; wait and cross | 1:30 / 3:00 |
| 3 | Battery Dash | Short exposed return versus long covered return | 2:00 / 4:00 |
| 4 | Crossing Signals | Two crossing patrol lanes and a central safe pocket | 2:30 / 5:00 |
| 5 | Sweep Window | Scanner sweeps an open roof; shelter breaks sight | 2:30 / 5:00 |
| 6 | Narrow Crossing | Timed gate, two bridges and a safe waiting platform | 3:00 / 6:00 |
| 7 | False Footsteps | Decoy opens a shortcut; a longer route remains viable | 3:00 / 6:00 |
| 8 | Warden Gate | Slow heavy guard, noise lure and defended exit | 3:30 / 7:00 |
| 9 | Power Trade | Switch alternates doors and scanner coverage | 3:00 / 6:00 |
| 10 | Two Targets | Two sequential deliveries; first changes the patrol phase | 4:00 / 8:00 |
| 11 | Silent Circuit | Relay doors and investigation; clean run is optional mastery | 3:30 / 7:00 |
| 12 | The Last Vault | Multiple routes combine previously taught rules | 4:00 / 8:00 |

Each map needs its own collision geometry, a successful touch playthrough and failure/retry/background checks. Gates must not trap the courier when closing. Noise investigation needs reachable paths and a reliable return state. Switch combinations must not soft-lock the map. Two-target mode needs separate target batteries and no premature win after the first delivery. Final-phone battery determines its charge star.

Unlock the next mission with successful extraction. Proposed stars: completion, final-phone battery at least 40%, and clean completion under target. Never require a purchased item or three stars to advance. Freeze thresholds and rules per ranked version after playtesting.

## Items players can buy

Illustrative devnet fixture prices, not validated real-SKR launch prices:

| Product | Test price | Working deliverable |
| --- | --- | --- |
| Campaign pass | 50 TEST SKR | Access to the 12-level campaign and unlimited campaign retries |
| Night Courier outfit | 20 TEST SKR | Permanent charcoal/mint outfit |
| Signal Runner outfit | 20 TEST SKR | Permanent alternate trim/material treatment |
| Escape trail | 8 TEST SKR | Equipable visual trail, hideable in reduced-effects mode |
| Profile frame | 5 TEST SKR | Visible frame on profile/ranking entry |
| Rack theme | 12 TEST SKR | Alternate collection display in the hideout |

All items must be usable and restorable, not just checkout illustrations. In 3D, outfits use the same rig with material/mesh variants. Tools are earned or supplied by the mission. No paid speed, extra ranked battery, loot boxes or paid ranked revives.

## Architecture and data

Keep React Native for app UI and MWA unless the 3D prototype establishes a compelling reason to change engines. Current Skia gameplay remains the baseline while testing a native 3D renderer. Do not assume that renderer also supports React Native Web.

First refactor: `simulation.ts`, `guards.ts`, `art.ts` and `GameCanvas.tsx` depend on the global `LEVEL`; the canvas fixes the guard count at two. Introduce validated level definitions and entity lists. Rendering, collision, sight and replay consume the same geometry. Do not move per-frame simulation into React state.

| Layer | Responsibility |
| --- | --- |
| App | Navigation, wallet handoff, shop, collection and accessible controls |
| Shared game rules | Versioned maps, movement, collision, guards, tools, objectives and scoring |
| Local SQLite | Progress, settings, equipped choices and pending operation IDs |
| Native secure storage | Session credentials; no wallet private keys |
| TypeScript API + worker | Authentication, catalog, orders, entitlements, ranking, settlement and reconciliation |
| PostgreSQL | Durable accounts, quotes, receipts, purchases, runs, allocations and jobs |
| Solana RPC | Independent payment verification and transaction reconciliation |
| Versioned files/storage | Bundled art/maps and private bounded replay uploads |

Use one service codebase and a Postgres-backed worker queue. A phone needs a reachable HTTPS test API; localhost on the phone is not the development computer. Keep signing keys, RPC secrets and service credentials out of the APK/repository.

On chain: token purchases and test returns/refunds. Off chain: entitlements, inventory, progress, scores and jobs. Local simulation: movement, guard AI and every-frame events. Ordinary cosmetics do not need NFTs, and ordinary purchases do not need a custom program.

## Wallet and commerce

The current [Solana Mobile installation guide](https://docs.solanamobile.com/get-started/react-native/installation) recommends `@wallet-ui/react-native-kit` with `@solana/kit` for a new integration. Pin a working dependency set after testing against our Expo/RN versions. Native MWA requires a custom build, not Expo Go.

Set the chain explicitly to `solana:devnet`. Android uses MWA; browser functionality has a separate adapter. Use a nonce-bound signed login, verified on the server, and atomically consume each nonce. Connection alone is not authenticated backend access. Validate account/network changes, expired sessions, absent wallet, rejection and app death. [MWA reference](https://docs.solanamobile.com/get-started/react-native/invoke-mwa-sessions-directly).

Create a separate test SPL mint, label it **TEST SKR — no monetary value**, and store its actual mint/program/decimals in devnet configuration. Real SKR uses separately verified mainnet configuration later. A symbol is not token identity. Devnet builds cannot switch to real money through a UI toggle.

Purchase lifecycle:

1. Server quotes SKU, wallet, network, mint/program, integer amount, destination, order binding and expiry.
2. App explains the item, token cost and SOL fees, then asks Phantom to sign the intended transfer.
3. Server fetches the transaction and verifies success, authority/source owner, mint/program, amount, recipient and order binding. Use [TransferChecked](https://solana.com/docs/tokens/basics/transfer-tokens); a memo or callback alone is not payment proof.
4. Grant after finalized verification, atomically and once. A unique transfer binding prevents the same payment fulfilling two orders.
5. Restore through the authenticated backend. If signing succeeded but the app died, reconcile the original order before offering another charge. A paid expired quote needs an explicit fulfill/refund/review outcome.

Durable records: wallets, one-use auth challenges, sessions, catalog, orders, unique payment receipts, entitlements, inventory, progress, level versions, daily manifests, runs, replay records, ranks, reward allocations, settlements and jobs. Only trusted server code changes fulfillment, inventory grants or verified results.

API groups: auth challenge/verify; profile/catalog; create/read order and attach transaction; entitlement restore/equipment; progress sync; daily/ranking; start/finish run; settlement status. Apply ownership checks, idempotency keys, input limits and rate limits.

## Progress, rankings and test returns

Local campaign progress survives restart; sync completion/stars/bests without overwriting better progress. Entitlements remain server-owned. Cached access permits ordinary offline campaign play; initial purchase/restore and ranking need a connection. Local saves must never authorize money or verified rank.

Ranked runs use server tickets bound to wallet, level hash, seed, loadout and expiry. Record quantized tick inputs and replay the pinned simulation server-side. First establish cross-runtime parity: existing floating-point worklet code is not automatically deterministic. Reject malformed inputs, impossible movement, expired/reused tickets and wrong versions. Legal input replay does not prove a human played; do not call it cheat-proof.

Daily content comes from tested maps and a small whitelist of tested variants. Everyone gets the same published rules and loadout. Avoid arbitrary generated walls that can produce impossible maps.

Devnet challenge prototype: entry 10 TEST SKR, gross success return 10 TEST SKR, failure zero. Show fees, success condition and interruption policy before entry. Reserve the maximum return, verify the run, allocate one terminal outcome and reconcile the recorded payout transaction before retrying. Test duplicate claims and worker crashes around broadcast. Clearly describe the devnet treasury as operator-controlled; it is not trustless escrow.

Real-money paid attempts retain the unresolved release conditions in the [existing economy review](../../seeker-plan/economy.md), including funded obligations and reviewed settlement/eligibility design. A functioning devnet test is not mainnet clearance. Ordinary campaign/cosmetic purchases remain separate from conditional monetary play.

## Performance, assets and feel

Use the existing charcoal/ivory/mint direction with readable detection cues. Runtime art must match geometry. Posters and location sheets are references; they are not usable collision maps or rigged models. New location reference sheets retain the user's Soul/Soul Cinema-only instruction. For 3D, build low-poly models, rigs, animation clips, materials and collision proxies; PNGs alone cannot provide rotating characters.

Target responsive movement and 60 fps on the test phone; establish a stable 30 fps quality fallback if native 3D cannot maintain 60. Profile release builds, actual Android frame timing, loading and a 15-minute thermal run. Current callback FPS is not GPU evidence. Bound lights, shadows, particles, guard counts and texture memory; preload before a run. Don't introduce nondeterministic physics into reward outcomes.

Add original footsteps, detection, gate, decoy, catch and extraction cues. Social-video songs are not the app soundtrack. Provide volume, haptic and reduced-effects settings. Camera changes and close-up shots must not hide actionable hazards or steal control.

## Work sequence and acceptance gates

| Stage | Work | Completion gate |
| --- | --- | --- |
| 0 | One-room angled 3D prototype; native compatibility check | Movement, cover visibility and camera feel work on Android; renderer proven before mass content |
| 1 | Parameterized levels, app shell, native MWA/config | Existing gameplay preserved; Phantom approve/reject/reconnect tested in an APK |
| 2 | API/database, signed login, test mint, campaign pass, local save | Buy → play one level → restart → restore succeeds without duplicate charges |
| 3 | Four warehouse levels, results/stars, first usable outfit | Four different maps beaten by touch; purchased costume visibly works |
| 4 | Eight remaining maps, scanner/warden/tools/gates/power/two targets | All 12 playable with default equipment; no soft locks |
| 5 | Complete catalog, daily route, verified rank, devnet entry/return | Every SKU delivered/restored; invalid run rejected; test settlement once across retries |
| 6 | Phone polish, recovery, signing, APK/demo/deck | Full Android playthrough, physical Phantom evidence, reproducible release |

The earlier four-room scope is now an intermediate milestone, not the final requested game. A full 3D conversion changes the workload; estimate dates after stage 0 rather than claiming it is a weekend reskin. Keep the researched internal submission target of **7 October 2026, 18:00 IST**, with a final QA/demo buffer. Deadline discrepancies remain in [rules.md](../../rules.md); recheck the live submission form before final submission.

## Your Phantom test build

Install Phantom and the native APK on the same Android phone. Enable Settings → Developer Settings → Testnet Mode and use devnet; get test SOL from the [Solana faucet](https://faucet.solana.com/). We supply the test-mint funding helper. [Phantom instructions](https://docs.phantom.com/developer-powertools/testnet-mode).

Test connect/reject/reconnect; purchase pass; inspect a devnet receipt; complete and restart a level; buy/equip/restore a costume; kill the app after signing; try a different wallet; test insufficient SOL versus insufficient tokens; restore after reinstall; submit a daily run; settle a test challenge. Record APK commit, device/Phantom versions and transaction/order IDs. Physical wallet approvals remain user testing; do not report them as passed from browser or emulator evidence alone.

## Final checks

- [ ] Current movement/guard regression tests preserved; browser still usable or explicitly documented if rendering support changes.
- [ ] Every level has an actual successful touch route, failure/retry and background check.
- [ ] Purchases reconcile after rejection, lost callback, wrong mint, stale quote, RPC outage and reinstall.
- [ ] Progress/equipment migrations recover safely; all shop items visibly work.
- [ ] Server rejects fabricated scores, reused tickets and duplicate returns/refunds.
- [ ] Release performance measured on physical Android; gameplay and store screenshots match the actual build.
- [ ] Production identity/signing, privacy/support, judge access, clean-clone build and APK checksum prepared.
- [ ] Repository access, three-minute demo and deck ready before the submission buffer.
