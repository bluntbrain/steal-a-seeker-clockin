# Mainnet test setup

Updated 14 September 2026. Mainnet transfers use real funds. This is a restricted test, not a public launch.

## Current deployment

- Mainnet API: https://seeker-api-production-41b3.up.railway.app (also https://stealaseeker.bluntbrain.com)
- Railway service: `seeker-api` (`fc20fdcd-565e-4d68-a37a-8f6893baf8b2`), now Mainnet only. The temporary `seeker-mainnet-test` service was removed after migration.
- Database: `seeker_mainnet_test`, with its own login, inside the existing Postgres instance. No extra Postgres instance was created. The API service adds hosting usage.
- Tester wallet: `GyftsRcgrvFWHGhhTvVTQMDGVU565UmmPvbhuZ3nYwgE`.
- New treasury: `BNgBygzFkVLGw4ipkxXgt2kuNcME1YdAE2hK5s81ogdn`.
- Real SKR mint: `SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3`, 6 decimals, standard SPL Token program. Verified against https://solanamobile.com/skr and a Mainnet mint-account read.
- No Devnet API is running. Historical Devnet data remains in its old database; it was not imported into Mainnet. The active Mainnet database, treasury, purchases and sessions were preserved during service consolidation.
- The Mainnet APK replaces the installed app and preserves stored data. Old Devnet APKs no longer have a live Devnet service.

## Change prices without rebuilding Android

Open Railway → `seeker-api` → Variables. Change the values below and apply/redeploy the service. New quotes and freshly opened paywalls read the backend settings. In-flight orders retain the price and reward terms shown when quoted; price changes never rewrite a signed or paid order.

| Variable | Current value | Meaning |
| --- | --- | --- |
| `TEST_PRICING` | `true` | Selects reduced prices. Set `false` and apply/redeploy to return to the live price profile below. It does not change the network or remove the tester allowlist. |
| `TEST_GAME_PASS_USD_CENTS` | `10` | $0.10 test pass; accepts 1–100 cents. Used only when test pricing is true. |
| `GAME_PASS_USD_CENTS` | `1000` | $10 normal pass. Preserved while testing; used when test pricing is false. |
| `SHOP_PRICE_DIVISOR` | `1` | Normal shop prices. Used only when test pricing is false. |
| `SHOP_PRICES_SKR_JSON` | unset | Optional normal per-item SKR overrides. Ignored while testing, then restored when the flag is false. |
| `CAMPAIGN_REBATE_SKR` | `25` | Whole SKR rewarded once after all 12 campaign wins are verified. Funds must be reserved before taking payment. Unchanged by the pricing switch. |

With test pricing on, every cosmetic costs **0.1 SKR**, with an equivalent SOL quote rounded up to the supported increment. Switching it off restores normal prices (e.g. Night Courier 20 SKR). All of these payments remain real Mainnet payments. A $0.10 target may display approximately $0.11 after token rounding and upward rounding to whole USD cents; network fees are additional.

Change only `TEST_PRICING` for routine switching. No Android rebuild is needed. Existing orders, entitlements and their reward terms stay unchanged, so this switch neither removes paid access nor recharges existing buyers. It also does not activate weekly prize payouts.

Both SOL and SKR quotes use live exchange rates and round up to supported payment increments. The exact amount is shown before wallet approval. Shop defaults remain in `shared/commerce.ts`; environment overrides take precedence. Mainnet test enablement and allowed wallets are separate from pricing.

There is **no weekly leaderboard token prize**. Weekly clear rewards are the permanent Ghost Courier outfit and recorded status. Do not present the campaign rebate as a weekly top-rank prize.

## Treasury key storage and audit

The Devnet treasury was created for the earlier deployment. Its local keypair is `/Users/bluntbrain/.config/steal-a-seeker/devnet-treasury.json`. A new independent keypair was created for Mainnet at `/Users/bluntbrain/.config/steal-a-seeker/mainnet-treasury.json`.

Both are outside the repository, with file mode 0600 and parent directory mode 0700. The running services receive their own signer through Railway variables; neither the APK nor the API Docker image contains the private key. The backend is an operator-controlled hot wallet, not a hardware wallet or trustless escrow. Local user/admin access and Railway project access remain security boundaries.

An exact-material scan of 1,617 reachable Git file versions found no Devnet treasury key matches in compact JSON, base58, base64 or hex representations. This is evidence about the checked repository history, not proof against every possible leak elsewhere. Never paste either key into a ticket, message, screenshot or repository.

## Initial verification on 14 September 2026

- Dedicated Mainnet API and database are live, with network binding and all 12 migrations applied.
- The deployed signer matches the new treasury. A read-only check through the deployed reward adapter confirmed 75 SKR and 0.01 SOL at finalized commitment, the expected Mainnet genesis, and the canonical token account. No transaction was signed or sent by that check. See `verification/mainnet/treasury-readiness.json`.
- 124 app/shared tests and 62 server tests passed. Web practice, scoring-attempt consumption, navigation and compact checkout passed at 360×640 and 360×797.
- The signed Mainnet APK was rebuilt and installed on the connected Realme without clearing app data. SHA-256: `f68d59a11dda0074a82077b7172a8dd8200ae11cbb492c3b67fda11f6f98e0d6`. Installation and launch succeeded; actual Phantom approval and a real buyer payment remain manual checks.
- Rankings now open first, with a top-three podium and one primary play button. Mission cards show five chances visually; instructions are behind How to play.

## What is still a hands-on check

Use Phantom's normal Mainnet mode. Check the app says **MAINNET · REAL MONEY**. Connect the allowed wallet, select SOL or SKR, review the reduced quote and approve in Phantom. Verify that access opens and Restore purchases works. Do not pay a second time while an earlier payment is being checked.

The treasury needs SOL for fees and SKR for the reserved reward. Real buyer payment and the final campaign reward must be observed on chain before calling the complete Mainnet money flow tested. Automated tests use fixtures; they do not spend the user's funds.

## Larger mission detail — 14 September follow-up

The weekly mission detail removes the repeated app/leaderboard headers, sizes the actual map to the available space and shows the district illustration behind it. The full map remains visible. Practice and ranked actions stay above the bottom navigation. Ranked confirmation overlays the map rather than shrinking it. Five dots and a numeric count show remaining attempts.

The browser's credits are local simulated currency from `seeker.browser-playtest.v1` (starting balance 250, adjusted by simulated purchases and rewards). They have no cash value and cannot be withdrawn. The balance is now labelled “demo credits” and only shown in Hideout; mission/ranking screens show BROWSER DEMO instead. Native Android displays the real network label, not this simulated balance.

Follow-up build: SHA-256 `2a02754b4425d581e110ffcb0d239d704f21b11d73c5e83317d2a1b2140c1aab`. The test-pricing update passed 125 app/shared tests, 62 server tests and TypeScript checks; the mission preview and practice/ranked flows passed at 360×640 and 360×797. Mainnet deployment `7080f140-320e-43cb-a351-264750e67387` was verified healthy with `TEST_PRICING=true`.

## One API service — 14 September consolidation

Converted the original `seeker-api` service to Mainnet so its custom sign-in domain remains intact. Copied the active Mainnet database connection and treasury settings privately, checked equality without printing secrets, and cleared the old Devnet signer from the service. After checking both domains and installing the updated Android build, removed the temporary service. Postgres remains required; “one service” here means one API service plus its database. No database or wallet key file was deleted.

`npm run build:apk` now selects Mainnet and defaults to the surviving API URL. The opening paywall says “Steal the phone. Escape the guards.” followed by the 12 heists and weekly leaderboard. The existing 25 SKR campaign offer is unchanged pending the builder’s answer about removing it for new purchases; weekly cash prizes are still not live.
