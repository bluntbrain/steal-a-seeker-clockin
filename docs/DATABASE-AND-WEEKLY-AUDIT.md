# Player data and weekly competition audit

Reviewed 14 September 2026 against the migrations, commerce service, replay verifier, league service and native account caches.

## Data stored per player

The wallet address is the player ID. We do not require a name, email, Twitter account, Telegram account or private key from the player. A wallet is not proof of one unique person.

| Data | Storage | What is recorded |
| --- | --- | --- |
| Player and equipment | `wallets` | Address, creation time, campaign progress, equipped cosmetics. |
| Sign-in | `auth_challenges`, `sessions` | Expiring nonce and message; consumed nonce; hashed session token and expiry. No wallet private keys. |
| Purchase | `orders` | Player, SKU, network, token mint, integer amount, destination, reference, memo, selected currency, exchange-rate snapshot, expiry, status and immutable campaign terms. |
| Approval/recovery | `order_attempts`, payment authorization fields | Signatures, attempts and transaction lifetime for safe reconciliation. |
| Completed payment | `payment_receipts` | Unique signature, one order, instruction index, finalized slot/time. |
| Ownership | `entitlements` | Unique player/SKU, source order and grant time. |
| Campaign result | `campaign_runs` | Mission, rules version, replay hash, replay and server-verified performance. Client-supplied progress alone cannot earn the rebate. |
| Campaign reward | `campaign_rebates` | Player's purchased reward terms and funded reservation. |
| Reward transfers | `return_reservations`, `return_allocations`, `return_attempts` | Reserved token/fee capacity, recipient, amount, retries, signed transaction and final receipt. |
| Weekly maps | `league_weeks` | Immutable week manifest: all three maps, conditions and finalization time. |
| Weekly attempts/results | `ranked_runs` | Player, week/contract snapshot, rules, request key, issue/expiry, result status, replay and verified result. Includes losses and abandoned starts. |
| Past ranks | `league_history` | Final weekly entry and participant count, unique per player/week. |
| Earned status | `league_achievements` | Player, week earned and timestamp. Persists after reset. |
| Optional identity | `league_identity` | Wallet-owned .skr name and time checked. Stale names fall back to a wallet label. |
| Deployment network | `deployment_network` | Prevents using a Devnet database as Mainnet or vice versa. |

## Correctness and changes made

- Starting a scoring run consumes an attempt in the database. A wallet lock, request-key uniqueness and active-run checks prevent duplicate taps from creating extra attempts.
- The server verifies replays. Best successful result per contract contributes to the total; repeats do not accumulate points. Points lead, combined time breaks ties, exact ties share rank.
- Week manifests are saved. Everyone plays the same conditions in that deployment, with standard gameplay stats regardless of purchased outfit.
- Final history is saved after the week and verification grace period, with unresolved results handled before finalization. It is not overwritten with next week's live ranking.
- Added indexes for weekly scores, per-player weekly attempts and past-week history. These support the actual JSON-manifest predicates used by the board.
- Fixed native account-cache handling for Ghost Courier: the earned outfit must survive restore even though it is not a shop product.
- Separated Mainnet cache keys, replay outboxes, database, session tokens and treasury. A network mismatch is rejected before constructing a payment.
- Existing order prices and promised campaign rebates are snapshotted. Changing pricing variables affects new orders, not old purchases.

## What we do NOT currently collect

No practice-session analytics, menu-view events, share-sheet completion events, push tokens, device identity, crash analytics or full payment-funnel event stream. Practice is intentionally not a ranked server record. Server-issued scoring attempts and purchases are sufficient to calculate **ranked participation retention**, but not all app visits or all practice activity.

No database backup restore drill has been completed in this audit. Raw replays and expired authentication rows do not yet have a documented production retention/archival policy. These need attention before a public Mainnet launch. Query indexes help scale, but the weekly board still aggregates verified runs; measure query latency before deciding whether a materialized summary is needed.

## Is three missions enough?

Players can play more than three times: three distinct missions, unlimited practice, five scoring starts on each. That is up to 15 scoring starts plus practice each week, alongside the 12-level campaign.

The intended return loop is learning the routes, setting three best scores, checking nearby rivals, and returning Monday for changed conditions. This is a hypothesis, not established retention. One permanent outfit is a weak repeat reward once already earned. The next experiment should add a visible weekly target and a new earned cosmetic/status progression, then measure whether players come back. More maps alone or larger cash prizes do not prove the game is enjoyable.

Measure weekly ranked starters, percent attempting all three, successful clears by mission, attempts per player, week-over-week returning players, and reward claims. Review players who exhaust five chances without a clear before increasing difficulty.

## Weekly token prizes: proposed next design, NOT live

A top-rank SKR prize needs its own funded weekly prize pool. It must not reuse the campaign rebate or imply that paying increases one's rank.

Before enabling it, define rank bands, amounts, tie splitting, eligible wallets, finalization timing and what happens if a result is rejected. Lock the displayed schedule and funding for a week before accepting entries. Do not change a promised prize halfway through the week.

Suggested data additions are `weekly_prize_pools` (week, network, mint, funded budget, rules/version, status), `weekly_prize_bands` (rank range and amount), and `weekly_prize_awards` (week/player, final rank, allocation, receipt; unique week/player). Use the existing reservation and payout worker for settlement after final results. These tables and prizes are a proposal only; no amounts or payouts have been enabled.

### Prize schedule selected by the builder

The proposed schedule is **1st $30, 2nd $20, 3rd $15, paid in SKR**. Total: **$65 per week**, before transaction fees and other game costs. Third place is 1.5× a $10 pass, not 15×. Show the actual prizes, not a promise to multiply every buyer's money. During the $1 Mainnet test, a “3×” description would be inaccurate.

This schedule is approved as the direction of the plan, but it is not a live funded prize pool and has not been added to payment promises or automated payouts. With a one-time pass, ongoing weekly rewards need an ongoing operator/sponsor budget; only new-player sales produce new pass revenue. At $10/pass, seven new purchases bring $70 before campaign rebates, fees and hosting, which is not a sustainability guarantee. At the reduced test price, the economics are different again.

Still required before launch: fund a specific week; define a cutoff and fixed SKR conversion/amount; define how exact ties divide affected prize places; publish rules; reserve the full budget; implement payout allocation against immutable final ranks. A proposal for ties is to split the prizes for occupied places equally, conserving the total budget. Do not silently award both tied players the full prize.
