# Solana skins and encounter update — v0.3.18 (21)

Implemented 23 September 2026. This is the execution record for GAMEPLAY-SOLANA-SKINS-PLAN.md.

## Delivered

- All twelve campaign layouts updated. Level 1 keeps the tutorial's targets and scripted dodge, with an added cross-link. Levels 2–12 use distinct cover forms: loops, U/L shapes, offset lanes, courtyards and an S-shaped finale. Existing dark mint textures and collectible identities remain.
- Campaign revision 8 uses seeded roaming within authored home zones, sustained sight confirmation, local radio reports, a capped support group, last-seen pursuit, corner search and patrol return. Radio reports cannot cascade or exceed the simultaneous support cap on repeated broadcasts. Two path searches per simulation tick; no network/model calls in the game loop.
- One scout drone in missions 2–3; two in 4–6. Delayed reserves in 4/5/7, with a safe spawn distance. Switch/gate, two-phone and timed-exit objectives remain.
- A 650 ms mint ring closes onto the courier after scene assets are ready. Gameplay inputs and the local timer wait for completion. Reduced effects skips motion. Existing weekly ticket expiry includes a 120-second presentation/network allowance.
- District map snakes 1→4, 5 below 4 through 8, then 9 below 8 through 12; saved IDs and records are unchanged.
- Hideout now has Outfits / Solana / Phones. Five generated human characters have matching portraits, four idle and four walking views, and share-card art. The source UI reference was generated before implementation. No Higgsfield used.
- Full-skin checkout uses the existing MWA `signAndSendTransactions` flow and server payment verification. A pending skin wallet checkout blocks spending credits on the same skin. Duplicate callbacks cannot grant twice. Previously owned effects remain usable; new effect sales are retired.

## Pricing

Each Solana skin defaults to **3,000 credits**; regular defaults are 300–600. Direct purchase defaults to **100 SKR** outside test mode, with live SOL conversion. The existing production service currently has `TEST_PRICING=true`, which overrides cosmetic token prices to **0.1 SKR**. SOL quotes apply the existing 0.0001 SOL minimum step. No test/pricing environment variables were changed.

Backend configuration: `STORE_CREDIT_PRICES_JSON` and `SHOP_PRICES_SKR_JSON`, keyed by `solana-toly`, `solana-mert`, `solana-chase`, `solana-lily`, `solana-vibhu`. TEST_PRICING overrides shop token prices while enabled. Credits are not partly spent in a full-token purchase.

## Verification

- 250 game/client tests passed, including complete tutorial, all twelve wins, collisions/reachable home zones, radio caps, loss of sight, search/return, deterministic runs, inventory and share-card identity.
- 78 backend tests passed against the local test database, including purchase verification, restore, duplicate callbacks and concurrent credit-versus-token purchase exclusion. Test chain fixtures are not real mainnet transfers.
- Archived revision 3, 6 and 7 replay outcomes match the current verifier. The live week of 2026-09-21 remains frozen on revision 6 and is compatible with the new client. The new campaign maps and AI do not rewrite the active league.
- TypeScript check and production web export pass. Browser checks at 390×844: five-skin tab, direct demo checkout, unchanged 1,510-credit balance, Toly equipping and appearing in gameplay, scene loading and advancing timer; no captured browser console errors.
- Signed mainnet APK built as version 0.3.18 / code 21, package `com.bluntbrain.stealaseeker`. Signing material stays outside Git.
- Backend deployed to the existing `seeker-api` production service. Health, payment readiness, premium catalog and live SKR/SOL quotes checked over HTTPS. No new service was created.

### Solvability audit

These are automated ordinary-input winning replays, not human difficulty scores. No health, position or score overrides. A fast, accurate solver wins with full health, so these results prove solvability, **not** the proposed human first-attempt win rates. Those need fresh-player testing.

| Mission | Winning time | HP remaining | Defeats |
|---|---:|---:|---:|
| 1 | 12.83 s | 100 | 1 |
| 2 | 12.00 s | 100 | 1 |
| 3 | 16.80 s | 100 | 2 |
| 4 | 15.87 s | 100 | 3 |
| 5 | 13.37 s | 100 | 2 |
| 6 | 24.10 s | 100 | 2 |
| 7 | 17.77 s | 100 | 4 |
| 8 | 28.07 s | 100 | 4 |
| 9 | 15.37 s | 100 | 4 |
| 10 | 17.17 s | 100 | 5 |
| 11 | 14.63 s | 100 | 4 |
| 12 | 16.87 s | 100 | 3 |

## Remaining physical checks

No USB device was detected. This build is not installed or tested on Realme/Seeker yet. Physical haptics, frame pacing and a real Phantom purchase still require device validation. No mainnet payment was approved during this task. The APK is for testing; it has not been uploaded as a new dApp Store release.

New AI stays local: no Jev integration and no per-play model API bill. Normal backend hosting and wallet transaction costs remain. Future league maps/rules should roll over only at a week boundary after validation; this release intentionally preserves current weekly gameplay.

## Files

- `src/game/encounters.ts`, `src/game/campaign-layouts.ts`: behaviour and geometry.
- `assets/solana-skins/`: generated assets, prompts/briefs, packing and provenance.
- `design/solana-store/`: UI reference and review gallery.
- `src/components/HideoutStore.tsx`, `src/commerce/SkinPurchaseHero.tsx`: implemented store and checkout hero.
- `verification/combat/solvability.json`: ordinary-input winning replay evidence.
- `releases/steal-a-seeker-mainnet-v0.3.18-code21.apk`: signed testing build; adjacent JSON records its hash and compiled sources.

Deployment: `c9965264-4ba2-4fb3-91b0-3d5540a26002` (SUCCESS). APK SHA-256: `4df725515217cbf1416d7b42f37b07a4ee19083f8ab59204c8bfa28347f0cd3b`. Build source hashes match the final game and shared files.
