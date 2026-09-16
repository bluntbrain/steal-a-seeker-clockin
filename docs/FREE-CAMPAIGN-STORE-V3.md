# Free campaign, weekly pass and Hideout store

17 September 2026. This replaces the campaign paywall and the token-priced wardrobe. The old `campaign` entitlement stays as the internal pass ID so existing buyers keep access.

## Product decisions

- All 12 campaign missions are free, with unlimited retries and no wallet requirement. Unlock them through play.
- Leaderboard standings and weekly practice are free to view/play. A one-time Game Pass unlocks five ranked attempts per mission across three weekly missions. No paid extra attempts.
- Live pass: fixed 500 SKR OR $10 worth of SOL, plus network fees. These are alternative prices, not a claim that 500 SKR equals $10. Existing backend test switch reduces both. Every order freezes its exact amount.
- Credits are game currency, never withdrawable and never a token prize. First clear: 100 credits; each additional star: 25 credits. Total available from a three-star campaign: 1,800 credits. Replaying the same result does not mint credits again.
- Outfits, trails and room finishes cost credits. Existing purchased items stay owned. Credit packs: 500/$1, 1,500/$2.50, 3,500/$5, payable in SKR or SOL at the quote rate. Testing discount remains server-controlled.
- Bought gameplay advantages must never enter ranked weekly play. First release prioritizes permanent cosmetic unlocks. A campaign-only protective lining can be added only with matching replay verification; do not sell an unimplemented power-up.
- A credit plus button appears in the shared navigation header and as a compact balance during gameplay. Gameplay pauses before opening a store screen.
- Three main tabs: Missions, Leaderboard, Hideout. Hideout uses Outfits / Gear / Collection sections. Selecting a shop item updates its inline preview and purchase/equip button. Credits checkout and pass checkout are full screens with Back. No nested shop bottom sheets.
- Weekly token prizes are currently not active in the service. Do not advertise $30/$20/$15 as payable until a funded, enforced prize schedule exists. Pass copy describes competition access, not guaranteed winnings.

## Implementation and trust

Authenticated wallet credits live in an append-only PostgreSQL ledger with a nonnegative balance. Completed campaign replays, verified by the server, grant each mission/star reward once. Transaction receipts grant credit packs once, including reconciliation retries. Credit redemptions lock the wallet row and atomically debit/grant ownership. Client progress upload never creates credits. Guest credits and cosmetics are device-local. Connecting a wallet keeps campaign progress and submits queued, complete guest replays for verification. Only verified wins earn wallet credits; the raw guest balance is never trusted. Guest cosmetics are not automatically repurchased with wallet credits. Training runs resumed from a checkpoint remain local; replay that mission without a checkpoint to earn wallet credit. Browser test inventory is a separate demo.

## Research and gameplay changes

Sources checked 17 September 2026:

- [Hunter Assassin, developer's Google Play listing](https://play.google.com/store/apps/details?id=com.rubygames.assassin&hl=en): a stealth/action loop, character progression, cover and rewards. It does not disclose internal movement constants or measured beginner win rates; we cannot claim to copy those.
- [Apple's game onboarding guidance](https://developer.apple.com/app-store/onboarding-for-games/): teach one action at a time, let players demonstrate it, introduce purchases after gameplay. Apply to our guided first room and free campaign.
- [Android game-loop guidance](https://developer.android.com/games/develop/gameloops): consistent frame timing and elapsed-time simulation matter more than a high average FPS. Keep deterministic fixed steps and render interpolation; profile physical Android before claiming native performance.
- [Designing Game Feel, research survey](https://arxiv.org/abs/2011.09201): use responsive input and coherent audiovisual feedback. Concrete tuning below is our design judgment, not Hunter Assassin's source code.

The previous automated audit showed 47/48 basic wins on level 1, 34/48 on 2, 11/48 on 3, and 1/48 on 4. These are controller trials, not human conversion/retention rates. Rebalance early patrol speed, sight range, pauses and reserve timing. Keep dense cover and current colors. Teach one threat at a time; make later rooms challenging without immediately surrounding the player on pickup. Give immediate tap feedback, quick retry and direct next-mission continuation.

## Acceptance checks

Fresh guest can launch and clear a mission without payment; credits persist; repeated identical clears do not duplicate rewards; cosmetics purchase/equip correctly; insufficient balance links to credit packs; cancelled payment grants nothing; receipt replay cannot double-credit; wallet switching cannot expose another wallet's balance. Non-pass users can practice but cannot issue ranked tickets. Existing pass owners retain access. Compare controlled campaign trials before/after. Review compact phone layout and export/build Android.


## Difficulty audit

The same 1,296-trial audit was run on both versions. Counts below are wins by two basic controller policies, 48 trials per mission. These are not estimates of real player win rates. Every level also has a verified winning reference replay, and the audit completed the 12-mission save/unlock chain.

| Mission | Previous basic wins / 48 | New basic wins / 48 |
|---|---:|---:|
| 1 | 47 | 47 |
| 2 | 34 | 47 |
| 3 | 11 | 41 |
| 4 | 1 | 33 |
| 5 | 2 | 35 |
| 6 | 3 | 12 |
| 7 | 0 | 14 |
| 8 | 4 | 6 |
| 9 | 0 | 6 |
| 10 | 0 | 11 |
| 11 | 0 | 0 |
| 12 | 0 | 0 |

Levels 11–12 still demand planned routes. Do not call this balanced for beginners just because a solver can win. Next human test: five new players, no coaching after the guide. Aim for most to finish the first three missions within two tries; record deaths, time and where they stop. Tune 8–12 after those sessions rather than making guesses from bot wins alone.

Evidence: `verification/campaign-free-v3-final/`. Gameplay changes: lower campaign patrol speed and vision, longer pauses, later/staggered reserves, longer time limits and a wider mission-10 exit window. The frozen weekly competition engine is unchanged. Tap commands fire on touch-down; aim markers respond immediately; bullets interpolate between fixed simulation steps. Android frame pacing still needs physical-device profiling.

## Screens and click counts

- Missions → Continue: one tap into the next free mission. Results → Next mission: one tap.
- Hideout: large equipped-courier image, inline Outfits/Gear/Collection tabs. Select → Unlock/Equip. Equipped items can be removed without losing ownership.
- Credit + → choose a pack → checkout. Existing wallet session: choose SKR/SOL and Pay, then wallet approval. New wallet: connect/sign in first. Payment reconciliation remains in place because a missing callback must not charge twice.
- Leaderboard: rankings first; pass purchase sits here. Ranked CTA also opens the pass checkout if needed. Purchase → Done → Play for score. Practice never requires the pass.
- All balances come from local demo/device inventory or the signed-in wallet ledger. They never represent withdrawable SKR.

## Pricing controls

Existing Railway service `seeker-api`, Mainnet. Keep `TEST_PRICING=true` while testing real transfers.

| Setting | Default | Meaning |
|---|---:|---|
| `GAME_PASS_SKR` | 500 | Live fixed SKR pass price |
| `GAME_PASS_USD_CENTS` | 1000 | Live SOL pass target, in cents |
| `TEST_GAME_PASS_SKR` | 1 | SKR pass price with testing enabled |
| `TEST_GAME_PASS_USD_CENTS` | 10 | SOL pass target with testing enabled |
| `TEST_PRICING` | false | Railway currently explicitly sets true |
| `CAMPAIGN_REBATE_SKR` | 0 | No new campaign completion rebate |

Credit packs and credit item costs live in `shared/store.ts`. Testing divides credit-pack dollar targets by 100; token rounding and network fees mean the final quote may be higher than the raw target. The exact amount is shown before approval. Changing `TEST_PRICING=false` restores live targets without changing stored orders.

## Artwork

Generated through the authorized OpenAI Images API using `gpt-image-2.5-flare`. Design reference: `output/imagegen/hideout-v3/reference.png`. Prompts are next to the generated images. Runtime artwork is optimized WebP in `assets/hideout-v3/`; all balances, item names, costs, ownership and actions are actual UI text. The reference contains a speculative health-kit tile; it is not sold in the app.

## Power-ups

Deferred intentionally: a campaign-only protective lining could provide +10 starting health, cost 250 credits once, and be disabled in weekly practice and ranked play. It needs a versioned equipment snapshot in the replay and server verification before sale. Do not make ranked performance depend on credit purchases.


## Delivery checks

TypeScript and web export pass. 164 client/game tests and 69 backend tests pass without skips. The signed Mainnet arm64 APK builds. The existing Railway service deployed successfully (deployment `93068c44-4ddb-439e-b56c-59c964fc6071`). Live `/health`, `/catalog` and pricing checks confirmed Mainnet, credit pack products and reduced test prices. No real wallet transfer was initiated by this test run.

Manual browser QA on a separate origin completed the tutorial, earned/persisted 150 credits, bought/cancelled a demo pack, redeemed/equipped/removed cosmetics, practiced free and started a ranked mission after demo pass purchase. One ranked attempt was deducted. Screens fit at 360×640 and 390×844. See `verification/free-store-ui/README.md` and `/design/free-store/index.html`.

Guest replay synchronization runs in the background after wallet sign-in. It cannot hold up payment approval while many saved replays are checked. Current physical Android and Phantom checks remain outstanding for this build.
