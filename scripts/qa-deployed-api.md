# Deployed API QA

This harness only calls normal HTTPS API endpoints. It does not connect to PostgreSQL or truncate fixtures. Wallets are dedicated test identities; all signed transfers require the Solana devnet genesis hash. It never prints keys, sessions, signed login messages or raw response bodies.

## Run

From the repository root:

```sh
QA_API_URL=https://YOUR-API npx tsx scripts/qa-deployed-api.ts
```

Wallet keypairs must already exist, mode 0600, under `~/.config/steal-a-seeker/qa/buyer.json` and `other.json`. They use standard Solana 64-byte JSON arrays. Do not reuse a personal wallet.

For a complete payment and payout test, fund the buyer with at least 0.01 devnet SOL and 120 TEST SKR. The backend treasury must have test tokens and fee reserves. Then:

```sh
QA_API_URL=https://YOUR-API QA_COMMERCE=1 npx tsx scripts/qa-deployed-api.ts
```

`QA_RPC_URL` optionally selects a devnet RPC. Its URL is not written to the report. Default: public Solana devnet endpoint.

## Test scope

- HTTPS health, catalog, rules, daily manifests and public leaderboards.
- Signed Ed25519 authentication, used nonce rejection, invalid signatures and session revocation.
- Wallet isolation, missing resources, schema/price tampering and paid access enforcement.
- Full mode: real campaign payment, duplicate callbacks, outfit payment with deliberately omitted callback, restoration and equipping.
- Full mode: paid progress persistence, forbidden premature rebate claim, ranked idempotency/isolation, unfinished replay rejection, actual successful replay verification and server-computed leaderboard score.
- Full mode: all 12 deterministic game replays, idempotent campaign credit, exactly one 25 TEST SKR completion rebate, foreign-wallet return isolation.

The full mode intentionally creates ordinary test purchases and leaderboard records. Use a new dedicated buyer for a fresh full pass; a buyer who already owns the products will correctly be refused another purchase. Do not delete production data to reset QA.

The basic mode can be repeated with the same identities. It may create one unpaid quote, but never signs a payment.

## Evidence and limits

`verification/deployed-api-qa.json` updates after every case and contains public account/transaction identifiers and sanitized results. Exit code is nonzero on failure. The harness does not substitute for physical-device Phantom approval, human gameplay, load testing, or operator-triggered restart recovery. Polling and replay timing respect actual server time; no database clock or fake chain data is used.

## Restart persistence

After the full commerce pass, capture a private checkpoint, have the operator restart/redeploy the API, then verify:

```sh
QA_API_URL=https://YOUR-API npx tsx scripts/qa-deployed-api-restore.ts capture
# Operator restarts API and waits for healthy new deployment.
QA_API_URL=https://YOUR-API npx tsx scripts/qa-deployed-api-restore.ts verify
```

The checkpoint includes a session token and stays outside the repository at `~/.config/steal-a-seeker/qa/restart-checkpoint.json`, mode 0600. The public report is `verification/deployed-api-qa-restore.json`. Verification compares both the old session and a fresh wallet login against the saved purchases, progress, equipment, 12 verified campaign results, settled completion return and personal daily ranking. Run within the same UTC day so daily rotation does not change the comparison.
