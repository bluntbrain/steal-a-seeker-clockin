# Steal a Seeker commerce and competition API

Current state, 17 September 2026: the existing `seeker-api` Railway service runs on Mainnet with private PostgreSQL and sleep disabled. **TEST_PRICING=true** keeps real transfers small. No Devnet API is active. Historical Devnet setup and payout evidence must not be presented as proof of a current Mainnet payment.

Current design: [free campaign, credits and weekly pass](../docs/FREE-CAMPAIGN-STORE-V3.md). The old internal `campaign` SKU remains the Game Pass entitlement so existing owners retain ranked access.

## Runtime and configuration

Node 22+ and PostgreSQL. Mainnet configuration includes `SOLANA_NETWORK=mainnet`, `MAINNET_TEST_ENABLED=1`, `MAINNET_ALLOW_ALL_WALLETS=true` (or a tester allowlist), `MAINNET_TREASURY`, `MAINNET_RPC_URL`, `DATABASE_URL`, and `APP_IDENTITY_URI=https://stealaseeker.bluntbrain.com`. The official SKR mint is fixed by `shared/network.ts`. The database is bound to one network and refuses accidental reinterpretation.

Keep keys in Railway sealed variables or private files outside the repository. Mainnet return signing uses `MAINNET_SIGNER_JSON` or `MAINNET_SIGNER_PATH`, not both. Never print keys. Funding/payouts are separate from purchase verification.

Pricing: `GAME_PASS_SKR=500`, `GAME_PASS_USD_CENTS=1000`; testing uses `TEST_GAME_PASS_SKR=1`, `TEST_GAME_PASS_USD_CENTS=10`. Credit pack targets are in `shared/store.ts` and divided by 100 when testing is enabled. Exact quote amounts include upward token rounding; network fees are extra. `CAMPAIGN_REBATE_SKR=0` disables new campaign rebates. Weekly token-prize settlement is not active.

```sh
npm ci
# Local configuration file is ignored; do not use production DB for tests.
node --env-file=.env.server --import tsx server/main.ts
npm run server:test
```

Tests assert the database is named `seeker_clockin_test` before truncating. They use genuine Ed25519 signatures, real PostgreSQL and synthetic chain responses. Never run that suite against Railway.

## Credits and free progress

Migration 013 adds wallet credit balances, an append-only `credit_ledger` and per-mission rewarded stars. It permits credit-funded entitlements with no payment order ID. Previous migrations remain unchanged and checksum-verified.

- `POST /campaign/runs`: authenticated, pass not required. Server replays a complete extraction. Current rules grant 50/55/60 credits for 1/2/3 stars; upgrades grant only the difference. A 300-credit first outfit takes 5 perfect or 6 ordinary clears. Existing credits and owned items are retained. Wallet row locks and ledger source uniqueness prevent duplicate awards.
- `PUT /me/progress`: authenticated, pass not required. Merges campaign bests. This client-reported data never grants credits or ranks.
- `POST /credits/redeem`: authenticated `{sku}` from the store catalog. One atomic transaction locks the wallet, checks balance/ownership, debits, grants ownership and equips. Repeating an owned redemption does not charge again.
- `PUT /me/equipment`: equips an owned cosmetic. `POST /me/unequip` clears a cosmetic slot without revoking ownership or changing credits.
- `GET /me`: authoritative balance, rewarded stars, entitlements, equipment and progress. Guest balances are never accepted as authoritative. Queued guest replays may be submitted after wallet sign-in.

Credit packs are repeatable SKUs, not permanent entitlements. Each finalized order grants its pack quantity once. Credits cannot be withdrawn or converted into SKR. Cosmetics do not alter weekly stats or buy attempts.

## Payments and recovery

`/auth/challenge` and `/auth/verify` use one-use signed wallet challenges. `GET /pricing/:sku` provides expiring SKR/SOL estimates. An order freezes wallet, SKU, currency, mint/program, amount, recipient, token accounts, reference, memo and quote lifetime. The client uses Mobile Wallet Adapter for wallet-managed signing and sending.

`POST /orders/:id/prepare` persists a blockhash and last-valid height before approval. Lost callbacks reconcile against finalized transaction/reference data before allowing another payment. Verification checks execution, signer, exact transfer, account ownership, treasury increase and order binding. Unique receipts and grants are committed together. Infrastructure failures cannot silently grant purchases or erase a live authorization.

`GET /orders`, `POST /orders/:id/reconcile` and receipt links support restore. A fulfilled pack credits once; a second pack requires a distinct order. Existing reserved campaign rebates retain their stored terms; new Game Pass orders have none. Return reservations and signed attempts remain internal and durable. See [return settlement](../docs/RETURN-SETTLEMENT.md).

## Weekly competition

Public `GET /league` shows the week's maps and standings. Native practice is local and unlimited. Authenticated `POST /league/start` requires the Game Pass and issues a wallet-bound ticket, up to five per weekly mission. The backend freezes three maps/conditions per week; everyone plays those definitions. Server input replay verification and immutable rules bundles determine rank. The best complete run per mission contributes; exact time breaks score ties. Cosmetic purchases do not enter score calculation.

Historical weeks and the earned Ghost Courier outfit survive reset. The current release does not distribute weekly token prizes. See [weekly map automation](../docs/WEEKLY-MAP-AUTOMATION.md).

## Deploy and verify

Use `scripts/deploy-api.cjs PROJECT ENV SERVICE` for the existing service. It stages only API/shared/game source and Docker configuration, excluding local secrets and large artwork. `server/main.ts` applies additive migrations under an advisory lock, checks rule bundle hashes and starts bounded workers. Do not modify a previously applied migration.

API: https://seeker-api-production-41b3.up.railway.app
Identity: https://stealaseeker.bluntbrain.com

Health checks prove database/API availability, not payout funding. This release passed 69 backend tests and deployed successfully. Live read-only pricing/catalog checks confirmed test prices and the new credit products. Current physical Phantom payment approval/transfer remains a separate device check.

Pricing controls: [PRICING.md](../docs/PRICING.md). Game Pass, credit-pack purchase prices, and outfit/trail credit costs are configurable on the backend.
