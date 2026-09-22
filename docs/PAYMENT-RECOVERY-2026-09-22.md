# Payment recovery — 22 September 2026

## Confirmed cause

Railway's configured `https://api.mainnet-beta.solana.com` endpoint returned HTTP 429 (`Connection rate limits exceeded`) on `getGenesisHash`. `CommerceService.createOrder()` swallowed the cause and returned “Payments are not ready. No payment has been requested.” The request stopped before a payment order or MWA approval existed. Both Game Pass and credit packs used this failing path.

The separate exchange-rate message came from a one-minute price preview that never refreshed automatically. Live Coinbase pricing was available during diagnosis. The UI also showed its refresh warning during initial loading.

A real HTTP quote request reproduced the original 503 before the fix. Treasury and mint configuration were verified; they were not changed.

## Changes shipped

- Railway `MAINNET_RPC_URL` now uses `https://api.mainnet.solana.com`, the currently documented official endpoint. Verified from Railway: correct genesis, SKR mint, treasury ATA, blockhash, block height, reference history, and existing finalized transactions.
- Native and server default RPC URLs use the same endpoint. A dedicated provider can replace the backend URL through Railway without shipping an APK; keep provider keys server-side.
- Bounded retry for transient RPC reads only; safe method/status diagnostics. Transaction broadcasts are not automatically retried by this helper.
- Concurrent readiness checks share one request and successful checks cache for 15 seconds. Failed checks never become healthy cache entries.
- `/health/payments` checks chain readiness and pricing; `/health` remains database/liveness only. Payment failures now appear in structured logs without provider credentials or signed payloads.
- Price previews refresh before expiration and when the app returns to the foreground. Loading and failure states are separate. Expired prices still cannot authorize payment, and changed order prices still require review.
- Removed the separate public-RPC SOL balance request from the phone's checkout path. Phantom performs balance/preflight checks before approval. Official MWA still signs and sends the exact prepared transaction.
- No treasury, test/live pricing, entitlement, mint, or payment-verification rules were relaxed.

## Verification

- 211 app tests and 74 backend tests passed, plus typecheck. Subsequent default-RPC change passed the focused mainnet/readiness tests.
- Eight live HTTP cases passed: Game Pass and the three credit packs, each in SOL and SKR. Quote idempotency, unsigned approval preparation for pass/500-credit pack, repeated preparation, cancellation of other unprepared quotes, and no unpaid credit/access grants were checked.
- Both previously fulfilled real pass purchases (one SOL, one SKR) independently verified against the replacement RPC.
- Four unsigned mainnet simulations using the app's actual `paymentTransaction()` builder passed: pass/500-credit pack × SOL/SKR. Public payer addresses came from prior receipts; no private keys, transfer signatures, or broadcasts were used.
- Initial SKR simulation using the SOL receipt's buyer returned `InvalidAccountData`. Using the historical SKR buyer passed; the report records successful simulations against the respective SOL and SKR buyers. A buyer still needs the selected currency and SOL for fees.
- Evidence: `verification/payment-readiness-qa.json`, `verification/payment-simulation-qa.json`.
- Final deployment: `44bb540c-b6b4-4dc5-9fb5-333ddda50603`, service `seeker-api`, production environment, Mainnet. No new service created.

## Release and limits

Signed APK: `releases/steal-a-seeker-mainnet-v0.3.6-code9.apk`.
Package: `com.bluntbrain.stealaseeker`.
SHA-256: `e363b5c2b3e65dea7473083cfe143effe4a2edc3af2a98cbf8fb61cb3c74c714`.
Rebuilt later the same day with Practice buttons commented out and a full-width ranked action.
Signing certificate SHA-256: `4fa3e9942238f110824fb67dc99438fc1d70ef48a273e4a79331d5f8a1e1e913` (same as the original release).

The user chose to continue without the phone. This APK was not installed or submitted to the dApp Store in this task. Physical Phantom interaction and a new real-money settlement have not been verified. The tests did not spend funds. Existing installed apps benefit from the backend repair; automatic price refresh and the removed phone-side balance dependency need this APK.

The replacement is still a shared public endpoint, without a production SLA. Configure a dedicated mainnet RPC before broader traffic. A tested endpoint must support finalized transaction/reference history as well as basic balance calls; one evaluated alternative passed readiness but returned no known payment history and was rejected.

References: https://solana.com/docs/references/clusters and https://solana.com/docs/tools/production-readiness
