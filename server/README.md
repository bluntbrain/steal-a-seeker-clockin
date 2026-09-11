# Devnet commerce service

Status, 12 September 2026: implemented and tested against a real local PostgreSQL database, with synthetic chain responses for success/failure cases. Native client integration compiles. A live token payment and physical Phantom sign-in are still unverified. The public devnet faucet rejected the first funding request, so the dedicated mint is not provisioned yet. No real SKR is involved.

## Run locally

Use Node 22+ and PostgreSQL. Create dedicated `seeker_clockin_devnet` and `seeker_clockin_test` databases owned by your local role. Do not point the integration tests at a production database: they truncate the test database's commerce tables after asserting its name.

```sh
npm ci
node --env-file=.env.server --import tsx server/main.ts
npm run server:test
```

The ignored `.env.server` holds configuration. Required public values: `DEVNET_TEST_MINT`, `DEVNET_TREASURY`; optional `DEVNET_TOKEN_DECIMALS=6`, `DEVNET_RPC_URL=https://api.devnet.solana.com`, `APP_IDENTITY_URI=https://github.com/bluntbrain`, `DATABASE_URL=postgresql://localhost/seeker_clockin_devnet`, `HOST=127.0.0.1`, `PORT=8790`.

`server/schema.sql` is migration 001. Applied checksums are stored in PostgreSQL; do not edit it after deployment—add a migration. `server/main.ts` runs an API and a bounded reconciliation loop. Health checks test database availability; they do not claim the mint is funded. Quoting a purchase verifies the devnet genesis, mint owner/decimals and treasury token account and fails closed if they are not ready. Auth and restore can remain available during payment setup/outages.

## Provision and fund test assets

Dedicated key files are outside the repository at `~/.config/steal-a-seeker/devnet-treasury.json` and `devnet-mint.json`. These must contain freshly generated development keys, never production keys. The local task prepared these privately with file mode 0600; no key material is included in source.

```sh
# Once the dedicated treasury has test SOL:
npx tsx server/devnet-setup.ts
# Give a tester 200 TEST SKR; their wallet also needs devnet SOL for fees:
npx tsx server/devnet-setup.ts TESTER_PUBLIC_KEY
```

The helper validates the devnet genesis hash before transactions. It uses explicit CLI signer paths and network flags, not the user's default Solana identity. The test mint has no monetary value; the app labels it TEST SKR even if Phantom shows an unknown token.

## Android connection

Set `EXPO_PUBLIC_API_URL` before bundling. A physical phone needs a reachable HTTPS test service. An emulator can reach the host through `10.0.2.2`, but release Android network policy should not be broadly weakened to allow HTTP. The current distributed APK predates this commerce increment; build a new APK after configuring its endpoint. Do not hardcode a temporary tunnel as the production API.

The native test shop is inside the wallet panel after connection. It performs wallet sign-in, gets a quote, separately asks for payment approval, and restores purchases. It does not yet enforce the campaign gate or render owned cosmetics; those remain game integration work. It deliberately labels content as in development and uses test assets.

## Payment authority and recovery

The server freezes wallet, SKU, mint/program, amount, recipient, token accounts, reference, memo and quote lifetime. The client attaches the unique reference as an extra readonly account on TransferChecked and puts the order ID in a memo. References allow recovery when the app loses the signing callback. See the [Solana Pay tracking guidance](https://solana.com/docs/tools/commerce-kit/quickstart/solana-pay).

Verification fetches [getTransaction](https://solana.com/docs/rpc/http/gettransaction) at finalized commitment. It checks execution, signer, exact transfer, token account ownership, treasury balance increase and order binding. Final fulfillment and unique receipt allocation occur in one database transaction. An existing item with a second payment or a transfer outside the quote window becomes review work; neither is silently called fulfilled.

The current worker scans recent open orders; explicit restore/reconcile can revisit older ones. Pending signatures whose blockhash expires, high-volume reference pagination and operator refunds need further recovery work before commerce is called complete. No retry path automatically signs a second transfer.

## Evidence and next gates

`server/commerce.test.ts` uses genuine Ed25519 signatures and a real PostgreSQL database. It checks nonce reuse, wrong nonce, expired/revoked session handling through the API, cross-wallet isolation, immutable quote requests, duplicate callbacks, loss of callback, restore from a new service instance, unowned equipment, and tampered transfer fields. Expiry edge coverage is being expanded; it does not substitute for live chain verification.

Remaining: live test mint/payment, physical Phantom round trip, stable HTTPS deployment, payment-expiry recovery, user-visible pending status refresh, access enforcement, usable cosmetic delivery, progression sync, rankings and reward settlement. Mainnet commerce is not enabled.

## Hosting status

Railway creation was rejected on 12 September because the account trial expired. Enable hosting before deployment. The Docker service uses private database networking; no signing key is needed for purchase verification. `Dockerfile.api`, the service-only lockfile and `railway.toml` are prepared but have not been remotely built or deployed.
