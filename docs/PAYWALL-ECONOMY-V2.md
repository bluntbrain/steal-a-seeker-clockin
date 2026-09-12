# Campaign purchase and rewards — finalized test design

Decision date: 12 September 2026. Supersedes the old 50-token pass and new per-run entry purchases. Mainnet is disabled. This is a test offer, not a tested claim that this is the best possible price.

## The offer

| Item | Price / return | Terms |
|---|---:|---|
| Campaign pass | 100 TEST SKR once | All 12 missions, unlimited retries, saved collection, included daily runs. No renewal, recurring approval, per-level charge or NFT. |
| Completion rebate | 25 TEST SKR once | Complete and submit valid winning replays for all 12 missions. Server verifies them. Claim to the wallet that bought the pass. Payout from the same treasury that collected payment. |
| Night Courier / Signal Runner | 20 each | Optional outfits. No statistical advantage. |
| Escape trail / profile frame / rack theme | 8 / 5 / 12 | Optional cosmetics. No rank or reward advantage. |
| Cancellation trial | Free, one attempt | First mission only. No campaign unlocks, collection rewards, ranking or rebate. Restarting/leaving ends the attempt. |

Browser mirrors amounts in **local test credits**, starts with 250, and never submits wallet transactions. Devnet TEST SKR is a dedicated test mint with no monetary value, not mainnet SKR. SOL is used only for network fees; accepting SOL as an alternative purchase currency is outside this version. Prices are fixed, not calculated from a player's wallet balance.

“Pay 100; finish all 12 and get 25 back” is the offer. There is no investment, profit, guaranteed multiplier, disguised subscription, fake timer, fake discount, or paid advantage. A 25 rebate is not a 100 refund. There is no advertised cash prize for leaderboard position.

## Why this makes money

Before infrastructure, support, network costs, refunds and taxes, campaign revenue per buyer is `100 − 25 × completion-and-claim rate`. That is 100 if nobody claims, 87.5 at 50% claims, and 75 if everybody claims. Optional outfit revenue is additional. These are test units, not dollar profits. Promising every successful player 2× would need an explicitly funded subsidy; it cannot be funded sustainably from a 100 entry alone with unlimited retries.

The price is a hypothesis. After devnet playtesting, measure completed paywall views, review opens, cancelled approvals, trial starts/completions, fulfilled purchases, repeat sessions, outfit conversion and rebate claims. Test clear published prices with separate offer versions; never change a quote or an existing buyer's conditions. Do not interpret test-token conversion as real-money willingness to pay.

## Player journey

1. Illustrated, compact paywall: courier, 12-mission value, fixed price, unlimited retries, exact rebate and test-token label.
2. Browser opens a review before spending. Cancel debits nothing. Android shows a frozen order quote and the actual Phantom approval.
3. No approval / “Not now” offers one practice attempt. The trial flag is persisted **before** gameplay begins. Clearing local storage/reinstalling can bypass a device-only trial; it is a conversion sample, not a financial anti-abuse boundary.
4. Completed purchase restores on reload / wallet sign-in. An old 50-token buyer stays unlocked and is never charged the difference. Older purchases without v2 terms do not silently gain or lose a promised rebate.
5. In the hideout, Rewards shows completions, score, time, clean wins, claim status and (on devnet) finalized payout receipt. Wardrobe previews one item at a time, with purchase confirmation and a separate equip action.
6. A captured courier retries for free. All 12 verified wins enable a one-time claim. Repeated claims return the same allocation, never another payout.
7. Previous paid-entry tickets retain their receipt/recovery screen. New per-run entries are disabled in the server's normal startup and browser UI.

A closed wallet is not proof a transaction failed. The native shop retains prepared transactions, restores receipts, and blocks reapproval while an earlier payment needs reconciliation. Taking a trial does not clear that pending payment.

## Backend and on-chain boundary

No custom Solana program. The backend is trusted with the treasury key and payout authorization; there is no smart-contract escrow.

**On chain:** the pass/outfit SPL-token transfer with order reference and memo; standard SOL network fees; the completion-rebate SPL-token transfer with a separate payout reference and receipt.

**PostgreSQL:** signed-in wallets, immutable payment quotes/terms, transfer receipts, entitlements, equipment, saved progress, campaign input replays with pinned rules hashes and server-computed results, reservation ledger, return allocation, exact signed payout bytes, reconciliation status and operator audit history. No seed phrases or user private keys.

**Device:** preferences, local campaign save, one-attempt trial flag, offline replay outbox. Offline wins may be played immediately but qualify for devnet rewards only after server verification. Browser credits and scorecards are clearly local simulations.

Before Phantom approval, the server reserves 25 TEST SKR plus the existing 0.003 devnet SOL fee allowance. It subtracts all outstanding treasury liabilities when checking capacity. If funding or the return signer is unavailable, approval is not prepared. One wallet has one campaign reservation; reopening a quote reuses it. A direct out-of-band transfer without this reservation is held for review, not silently fulfilled under unfunded terms.

After all 12 wins are verified, a database transaction authorizes one return allocation. The existing worker signs locally, persists the exact signed transaction **before broadcasting**, and reconciles uncertain sends with the same signature. Funds stay reserved while a send is uncertain. A definitive failed/expired transaction is required before preparing a replacement. Never withdraw the outstanding-reservation balance as revenue.

Abandoned campaign approval reservations release only after every quote has expired, its transaction lifetime has expired, a finalized reference scan finds no payment, and the wallet still has no campaign entitlement or unresolved order. RPC uncertainty keeps funds held. A later checkout receives a new reservation reference. Unexpected/duplicate or out-of-band payments remain an operator reconciliation case.

## Leaderboard that works with 12 levels

Campaign order:

1. Number of distinct missions cleared, descending.
2. Sum of the best actual run's game points per mission, descending.
3. Total ticks from those same selected runs, ascending (30 ticks = 1 second).
4. Number of those runs completed without detection, descending.
5. Sum of remaining charge, descending.
6. Exact performance ties share rank; wallet address only stabilizes display order.

One whole replay supplies a mission's score/time/charge. We never combine a fast time from one run with a high battery result from another. Spending is absent from scoring. The existing game score includes remaining charge, speed against target time, and additional deliveries, so twelve clears do not imply equal score. The daily board remains another included route to replay mastery.

The global board uses the current immutable rules version. Historical valid wins remain usable for the completion rebate. Native server verifies replays; browser shows only the player's own local scorecard. Replays prove valid simulated gameplay, **not human play**: copied inputs/bots are a remaining competitive-integrity limitation. No leaderboard cash prizes are enabled, so do not market one.

## Sound and visual feedback

Original ElevenLabs sound effects, normalized and converted to mono 22.05kHz WAV: noise-decoy clink/chirps, detection double beep, mechanical switch, capture drop, extraction chime, purchase confirmation and a quiet rhythmic stealth loop. Existing dash, phone pickup and alarm cues remain. Ambient volume ducks during the alarm. Mute affects every player, pause stops active game cues, closing the wardrobe stops its confirmation cue. The browser audio adapter consumes normal interrupted-play/autoplay promise rejections instead of surfacing page errors.

The paywall and wardrobe fit small screens without internal scrolling. Existing siren wash, steady reduced-effects border, guard speed warning and decoy investigation text remain. Result sheets distinguish trial completion from campaign collection. The original MP3s, exact prompts and model provenance are retained in `assets/audio/manifest.json`. `scripts/prepare-game-audio.py` rebuilds normalized runtime WAV files. A deterministic synthesized fallback recipe is also kept.

ElevenLabs generation succeeded with the final key supplied in this task. The earlier two credentials failed; neither was used for the final sound pack. Keys are kept outside this repository. API reference: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert

## Verification and release boundary

- Automated client/game tests: purchase idempotency, cancelled trial access, cosmetics, fixed rebate once, complete-run ranking, existing gameplay suite.
- Backend tests: all 12 real deterministic mission replays, forged cloud progress rejected for rebate, non-owner rejection, reservation before approval, no funding → no prepared payment, duplicate claim idempotency, worker restart, finalized single payout with synthetic RPC evidence.
- Browser checks: actual review/cancel/trial/restart/reload flow, purchase/equip, locked rebate, restore and 320×568 paywall fit.
- Full actual-pointer browser campaign: 11/12 missions passed; the final-vault automation was caught in all nine timing phases. All 12 deterministic replay fixtures pass. This UI automation limitation is retained for follow-up; the game was not weakened to make the test pass.
- Real Phantom approvals, actual devnet mint funding/transfer/payout, hosted deployment, physical-device audio/performance remain unverified. Android device testing was deferred by the user.
- Mainnet is not an environment toggle ready to ship. Confirm the token mint, final prices, treasury funding, unpaid-reservation cleanup, operational support, security review and applicable paid-game/store eligibility before enabling real money. Current publisher policy: https://docs.solanamobile.com/dapp-store/publisher-policy . This document is not a determination of legal or store eligibility.
