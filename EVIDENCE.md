# Evidence

This page lists the main claims about Steal a Seeker and where to find the proof for each one. Every figure gives its source and date. To check a claim again, run the command next to it.

## 1. The server counts only runs that it replays

The phone sends only its inputs. The server replays them under pinned game rules and calculates the score itself. A client cannot submit a score.

**Live proof on production, 10 October 2026 at 12:43 UTC** ([verification/anti-cheat/live-trace.txt](verification/anti-cheat/live-trace.txt)). A new throwaway wallet signed in with Sign In With Solana and sent these level 1 runs to the production API:

| Run sent | Server response |
| --- | --- |
| Valid run with an added score field of 999,999 | HTTP 400, refused |
| Valid run with its button inputs removed | HTTP 422, "This run does not follow the game rules" |
| Movement input out of range | HTTP 400, refused |
| Leaderboard check after the three bad runs | No row for the wallet |
| The valid run | HTTP 200, server score 12,245, 60 credits |
| The same valid run again | HTTP 200, 0 credits |
| Leaderboard check | Rank 6, 1 level, 12,245 points |

The proof wallets stay on the public leaderboard so that anyone can check them. They are test wallets, not players:

- `5yR2arGUTNsd81ngKYnQxisUw13MUEWw5to2zcjFe6zf` (the trace above)
- `CQX1PqGDdZQzQZ4F1gfTEDfYL1z5wQQ1Ke4rsjvybFF` (an earlier run on the same day)

**Run it yourself:**

```sh
npx tsx scripts/prove-anti-cheat.ts          # the server verifier, offline. CI runs this on every push
npx tsx scripts/prove-anti-cheat.ts --live   # the same checks against production, with a new throwaway wallet
```

**Code:** [server/replay.ts](server/replay.ts) (verifier), [server/campaign-service.ts](server/campaign-service.ts) (run submission and credits), [server/rule-bundles](server/rule-bundles) (pinned rules).

## 2. Edge cases and the tests that cover them

| Case | What happens | Test |
| --- | --- | --- |
| The player declines in the wallet | No automatic retry. | [tests/wallet-native-error.test.ts](tests/wallet-native-error.test.ts): "native decline retains -3 and is not eligible for authorization retry". [tests/wallet-sign-in.test.ts](tests/wallet-sign-in.test.ts): "does not retry declines, transport errors, or account changes" |
| The wallet send fails | The app never opens a second payment and never broadcasts on its own. | [tests/wallet-managed-send.test.ts](tests/wallet-managed-send.test.ts): "a wallet send error never automatically opens a second payment or falls back to local broadcast" |
| A payment callback arrives twice | The item is granted once. | [server/commerce.test.ts](server/commerce.test.ts): "orders bind prices, isolate wallets, reject forged transfers and fulfill duplicate callbacks only once", "the game pass grants its bundle once", "credit packs grant once per finalized order" |
| The payment callback is lost | The server finds the payment by its reference and grants it. | [server/commerce.test.ts](server/commerce.test.ts): "lost callback is recovered by reference and restored from a new service instance" |
| A transfer is forged or wrong | The server refuses the wrong buyer, token, amount, recipient or reference, a failed transaction and a transaction that is not final. | [server/commerce.test.ts](server/commerce.test.ts): "payment verifier rejects wrong buyer, token, amount, destination, reference, failed execution and absent finality" |
| The Solana RPC is down | No order and no credits are created. | [server/commerce.test.ts](server/commerce.test.ts): "RPC outage creates no order or credits and exposes safe readiness diagnostics" |
| The player wins while offline | The win stays saved on the phone and uploads later. An old upload cannot replace a newer win. | [tests/campaign-outbox.test.ts](tests/campaign-outbox.test.ts): "failed upload stays durable and a later retry succeeds", "old upload cannot erase a newer win on the same mission" |
| The wallet has no .skr name | The leaderboard shows a short address. Ranks do not change. | [server/wallet-names.test.ts](server/wallet-names.test.ts): "primary .skr is forward checked; missing/other-TLD primary falls back", "HTTP campaign board returns cached names without changing rankings and works while lookup fails" |
| The name lookup fails | A failed lookup is not shown as "no name", and it never blocks scores. | [server/wallet-names.test.ts](server/wallet-names.test.ts): "RPC errors are not represented as a confirmed absence", "cache never blocks scores" |
| A signed sign-in message is changed | The server refuses it. Each challenge works once. | [tests/wallet-sign-in.test.ts](tests/wallet-sign-in.test.ts): "rejects modified, missing and truncated signed messages". [server/commerce.test.ts](server/commerce.test.ts): "signed authentication consumes one nonce, enforces account isolation and supports revocation" |
| A replay is slow or the replay workers are full | The worker stops, and capacity comes back for the next run. | [server/replay-runner.test.ts](server/replay-runner.test.ts): "a timed-out worker releases capacity for the next replay" |
| A run breaks the rules | No credits and no score. | [server/replay.test.ts](server/replay.test.ts): "verifier rejects impossible inputs, oversized runs, repeated edges and post-completion ticks". [server/commerce.test.ts](server/commerce.test.ts): "free campaign grants verified credits once; forged progress and invalid replays grant none" |

## 3. Checks on every push

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on every push to `main`: type check, game rules check, app tests, the offline anti-cheat proof, and the server tests against PostgreSQL 16. On 10 October 2026 there were 415 app tests and 79 server tests, and all of them passed (local run and GitHub Actions).

## 4. A real payment on a phone

[verification/device-payment/mwa-payment-2026-10-07.mp4](verification/device-payment/mwa-payment-2026-10-07.mp4) is a 73 second screen recording from an Android phone with Phantom, made on 7 October 2026. The player connects through Mobile Wallet Adapter on Solana mainnet, buys the 500 credit pack for 61 SKR, approves in Phantom, and the balance goes from 6,480 to 6,980 credits.

## 5. Jev AI runs

Jev AI played the campaign on a [livestream](https://x.com/i/broadcasts/1XxygweZEYnGM). Its per-level results are in [verification/jev](verification/jev) (5 and 6 October 2026). Jev AI won 126 of the first 128 levels, all except levels 14 and 16. The game shows Jev AI's best score for each level before the level starts and after a win ([src/campaign/jev-runs.json](src/campaign/jev-runs.json)). These are Jev AI's own runs, not server-verified records.

## 6. Security notes

See [SECURITY.md](SECURITY.md) for how sign-in, payments and secrets are protected, and for the review of the Radiants advisory audit.
