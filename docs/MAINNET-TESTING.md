# Mainnet test setup

Updated 14 September 2026. Mainnet transfers use real funds. This is a restricted test, not a public launch.

## Current deployment

- Mainnet API: https://seeker-mainnet-test-production.up.railway.app
- Railway service: `seeker-mainnet-test` (`a4563d7f-353d-408f-bfb7-fa597fd03632`).
- Database: `seeker_mainnet_test`, with its own login, inside the existing Postgres instance. No extra Postgres instance was created. The API service adds hosting usage.
- Tester wallet: `GyftsRcgrvFWHGhhTvVTQMDGVU565UmmPvbhuZ3nYwgE`.
- New treasury: `BNgBygzFkVLGw4ipkxXgt2kuNcME1YdAE2hK5s81ogdn`.
- Real SKR mint: `SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3`, 6 decimals, standard SPL Token program. Verified against https://solanamobile.com/skr and a Mainnet mint-account read.
- The existing Devnet deployment/database/treasury remain separate. Mainnet does not inherit paid access, wallet sessions, campaign replay outboxes or ranked attempts from Devnet.
- The Mainnet APK replaces the installed app, but network-scoped stored data is preserved. Use the Devnet APK to return to Devnet.

## Change prices without rebuilding Android

Open Railway → `seeker-mainnet-test` → Variables. Change the values below and apply/redeploy the service. New quotes and freshly opened paywalls read the backend settings. In-flight orders retain the price and reward terms shown when quoted; price changes never rewrite a signed or paid order.

| Variable | Current value | Meaning |
| --- | --- | --- |
| `GAME_PASS_USD_CENTS` | `100` | $1 pass. Use `1000` for $10 or `250` for $2.50. |
| `SHOP_PRICE_DIVISOR` | `10` | Ten times cheaper than the base shop list. `1` restores base prices. |
| `SHOP_PRICES_SKR_JSON` | unset | Optional per-item SKR overrides, e.g. `{"night-courier":"2","signal-runner":"3","escape-trail":"0.8","profile-frame":"0.5","rack-theme":"1.2"}`. These override the divisor for those items. |
| `CAMPAIGN_REBATE_SKR` | `25` | Whole SKR rewarded once after all 12 campaign wins are verified. Funds must be reserved before taking payment. |

Both SOL and SKR quotes use live exchange rates and round up to supported payment increments. The exact amount is shown before wallet approval. Shop defaults remain in `shared/commerce.ts`; environment overrides take precedence. Mainnet test enablement and allowed wallets are separate from pricing.

There is **no weekly leaderboard token prize**. Weekly clear rewards are the permanent Ghost Courier outfit and recorded status. Do not present the campaign rebate as a weekly top-rank prize.

## Treasury key storage and audit

The Devnet treasury was created for the earlier deployment. Its local keypair is `/Users/bluntbrain/.config/steal-a-seeker/devnet-treasury.json`. A new independent keypair was created for Mainnet at `/Users/bluntbrain/.config/steal-a-seeker/mainnet-treasury.json`.

Both are outside the repository, with file mode 0600 and parent directory mode 0700. The running services receive their own signer through Railway variables; neither the APK nor the API Docker image contains the private key. The backend is an operator-controlled hot wallet, not a hardware wallet or trustless escrow. Local user/admin access and Railway project access remain security boundaries.

An exact-material scan of 1,617 reachable Git file versions found no Devnet treasury key matches in compact JSON, base58, base64 or hex representations. This is evidence about the checked repository history, not proof against every possible leak elsewhere. Never paste either key into a ticket, message, screenshot or repository.

## Verified on 14 September 2026

- Dedicated Mainnet API and database are live, with network binding and all 12 migrations applied.
- The deployed signer matches the new treasury. A read-only check through the deployed reward adapter confirmed 75 SKR and 0.01 SOL at finalized commitment, the expected Mainnet genesis, and the canonical token account. No transaction was signed or sent by that check. See `verification/mainnet/treasury-readiness.json`.
- 124 app/shared tests and 62 server tests passed. Web practice, scoring-attempt consumption, navigation and compact checkout passed at 360×640 and 360×797.
- The signed Mainnet APK was rebuilt and installed on the connected Realme without clearing app data. SHA-256: `f68d59a11dda0074a82077b7172a8dd8200ae11cbb492c3b67fda11f6f98e0d6`. Installation and launch succeeded; actual Phantom approval and a real buyer payment remain manual checks.
- Rankings now open first, with a top-three podium and one primary play button. Mission cards show five chances visually; instructions are behind How to play.

## What is still a hands-on check

Use Phantom's normal Mainnet mode. Check the app says **MAINNET · REAL MONEY**. Connect the allowed wallet, select SOL or SKR, review the reduced quote and approve in Phantom. Verify that access opens and Restore purchases works. Do not pay a second time while an earlier payment is being checked.

The treasury needs SOL for fees and SKR for the reserved reward. Real buyer payment and the final campaign reward must be observed on chain before calling the complete Mainnet money flow tested. Automated tests use fixtures; they do not spend the user's funds.
