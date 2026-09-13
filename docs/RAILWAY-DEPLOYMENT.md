# Railway devnet deployment

Created 13 September 2026 at the user's request, in the newly authenticated My Projects workspace. This is an internet-accessible **devnet** service, not a mainnet launch.

- API: https://seeker-api-production-41b3.up.railway.app
- Health: https://seeker-api-production-41b3.up.railway.app/health
- Dashboard: https://railway.com/project/1a98618e-5079-4b16-a07a-b5fcdbfadef9
- Project: `1a98618e-5079-4b16-a07a-b5fcdbfadef9`
- Environment: `a8b9380e-948f-4690-95b3-a3069f2e5275` (Railway's default name is `production`; the chain is still strictly devnet)
- API service: `fc20fdcd-565e-4d68-a37a-8f6893baf8b2` / `seeker-api`
- PostgreSQL: `e1776324-8820-40ca-9c75-e2d3422c6497` / `Postgres`

## Runtime

One API replica with embedded verification, reconciliation and payout loops; one PostgreSQL 18 instance with a persistent 5 GB volume. Both use Railway's assigned `sfo` region and have app sleep disabled. The database has private networking only; no public TCP proxy was created. API HTTPS routes to port 8790. Sleeping being disabled does not prevent deployment or platform restarts.

The database schema is created by checksummed migrations at startup under an advisory lock. Never change an already-applied migration. Add a new migration for schema changes.

| Variable | Configuration |
|---|---|
| `DATABASE_URL` | Railway reference `${{Postgres.DATABASE_URL}}`, private network |
| `DEVNET_TEST_MINT` | `4sCj4QkKckWb452KZFyQuWp64v6edpS9Erb4pJa4hLm2` |
| `DEVNET_TREASURY` | `9k5Frxtrut62kpsQxpHJinQgUfZdSSr1Pru9a89nzAZz` |
| `DEVNET_TOKEN_DECIMALS` | `6` |
| `DEVNET_RPC_URL` | `https://api.devnet.solana.com` |
| `DEVNET_RETURNS_ENABLED` | `1` |
| `DEVNET_SIGNER_JSON` | Sealed secret; value never stored in this repository |
| `APP_IDENTITY_URI` | `https://github.com/bluntbrain` |
| `HOST` / `PORT` | `0.0.0.0` / `8790` |
| `NODE_ENV` | `production` |

The signer is the dedicated devnet treasury, not a user's payment wallet. The mint authority remains local outside the repository. The treasury was funded by the user with 1 devnet SOL and provisioned with 100,000 TEST SKR. QA uses a separate wallet, funded with 200 TEST SKR and 0.02 devnet SOL; balances subsequently change during tests. TEST SKR has no monetary value. This is not the real SKR mint.

## Update the backend

From the repository root, while logged into the correct Railway account:

```sh
node scripts/deploy-api.cjs 1a98618e-5079-4b16-a07a-b5fcdbfadef9 a8b9380e-948f-4690-95b3-a3069f2e5275 fc20fdcd-565e-4d68-a37a-8f6893baf8b2
```

The script uploads a small, temporary Docker context containing only server, shared, game logic and build configuration. Game art, APKs, local credentials and unrelated native diagnostics are excluded. Local CLI uploads are the deployment source; GitHub pushes alone do not deploy this service. After upload, check Railway deployment status, bounded runtime logs and `/health`. Upload completion alone is not proof of a healthy deployment.

Sealed variables do not echo their value when read back. To rotate the treasury, provision the new devnet identity and reserve first, and account for existing orders/return liabilities; do not casually replace addresses while payments are in progress.

## Connect Android and test

```sh
EXPO_PUBLIC_API_URL=https://seeker-api-production-41b3.up.railway.app npm run build:apk
```

The app and server must agree on the devnet cluster and MWA identity URI. Connect Phantom configured for devnet. Provide the tester's **public** wallet address to `npx tsx server/devnet-setup.ts PUBLIC_ADDRESS` to send 200 TEST SKR, after checking available treasury balance. Tester needs a small amount of devnet SOL for fees. Never ask for a tester's seed phrase or private key.

`scripts/qa-deployed-api.md` documents the separate real HTTP/chain QA harness. Its evidence is in `verification/deployed-api-qa.json`. The ordinary `server/commerce.test.ts` truncates local test tables and must never run against Railway.

## Operations still to finish before a real launch

`/health` verifies the database only. It does not prove mint funding, RPC availability, queue age or payout liquidity. Watch rejected/review orders, unpaid liabilities, reconciliation errors and memory usage. The public Solana devnet RPC may rate-limit bursts; use a dedicated devnet provider when needed. PostgreSQL has persistent storage, but a tested backup/restore and automated alert policy have not yet been established. Mainnet launch, real funds, public store publication and a physical Phantom round trip are separate gates.

See [hosting comparison](BACKEND-HOSTING.md) for the earlier $10–15/month initial estimate. It is not a fixed bill or spending cap. No hard spend-stop was set because that would also stop payouts; consult the current Railway account's credits and usage.

## Verified on the live deployment

26 automated HTTP/real-devnet QA groups passed with zero failures: real signed wallet authentication; nonce replay and wallet isolation; campaign purchase; duplicate callbacks; restored ownership/progress; cosmetic purchase recovered without a wallet callback; equip ownership; daily ticket and server-computed leaderboard score; all 12 mission input replays; one finalized 25 TEST SKR completion payout with a verified wallet balance increase; idempotent claims; and logout. These are automated signed-wallet checks, not a physical Phantom approval or human playtest.

The local backend suite passes 53 tests. Provisioning fixes put SPL Token authority flags on the correct subcommands and explicitly request base64 account data. A local test fixture now clears daily manifests inside its dedicated test database so reruns are repeatable.

Four additional checks passed after controlled redeploy `2e94b698-a6c2-4c56-9880-c620238499ee`: the old session and a fresh login restore the same purchases, 12 wins, outfit/progress, rank and settled return. Buyer balance remains exactly 105 TEST SKR (200 funded − 100 campaign − 20 outfit + 25 rebate), with no duplicate payout. This restart was after settlement, not during broadcast. Evidence: `verification/deployed-api-qa-restore.json`.

Connected Android APK: `releases/steal-a-seeker-devnet.apk`, SHA-256 `5bd2616e04d1b43d7cdc7c1459ee0f9a3855207023ca6e86355e7568785f2e31`. Its distribution signature was verified and the live HTTPS API URL was confirmed inside the Android bundle. Installation/physical-wallet QA is still separate.
