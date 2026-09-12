# Low-cost hosting without idle cold starts

Checked 12 September 2026. Recommendation: **Railway Hobby for the devnet build**, with Serverless/app sleeping disabled on the API and database. No service has been deployed or purchased in this task.

| Option | Current published baseline | Fit for this backend |
|---|---|---|
| Railway Hobby | $5/month minimum, includes $5 usage; excess usage additional | Least setup. Run API + embedded verification/return loops in one service, PostgreSQL in another with persistent volume. Both must remain awake. Budget roughly $10–15/month initially; this is an estimate, not a quote or cap. |
| Hetzner CX23 VM, EU | June 2026 price adjustment lists €5.49/month; taxes, IPv4 and backups may add cost | Often lower predictable total for Node + PostgreSQL together. You manage Linux updates, HTTPS, backups, restore, monitoring and treasury-secret permissions. Capacity/location availability must be checked at purchase. |
| Render paid Starter API | $7/month API compute, database separately | Always-running paid compute is suitable. Total is more than $7 once a non-sleeping durable database is included. |
| Render free | $0 | Fails the requirement: free web services spin down after 15 idle minutes. Background settlement cannot depend on visitors waking it. |
| Oracle Always Free VM | Eligible resources can be free | A possible development sandbox, not a dependable zero-maintenance recommendation: idle instances may be reclaimed; account/region capacity restrictions apply. |

No free offering here guarantees a continuously available API, database and treasury worker. “No idle sleep” also does not mean zero restarts during deploys, outages or maintenance. Durable PostgreSQL state and reconciliation after restart are still required.

## Railway deployment layout

Use existing `Dockerfile.api` and `railway.toml`. One replica initially. The API process already contains bounded replay workers, purchase reconciliation and a serialized return worker, so a separate paid worker service is unnecessary at this scale. PostgreSQL stays on private networking and persistent storage. Never expose its port publicly. Keep static game assets out of the API image; native app bundles them and web preview/static hosting can serve them separately.

Set `DATABASE_URL`, `DEVNET_TEST_MINT`, `DEVNET_TREASURY`, `DEVNET_TOKEN_DECIMALS`, `DEVNET_RPC_URL`, `APP_IDENTITY_URI`, and `DEVNET_RETURNS_ENABLED=1`. The treasury signer must be provided as a private secret file readable by the service's `node` user, and `DEVNET_SIGNER_PATH` must point to that file. **Do not bake the key into Docker, Git, an asset URL, or the client.** Current loader is file-based; arranging that secret mount is part of deployment setup, not already completed here.

The same treasury owner collects and sends the devnet token. Fund its token account and devnet SOL fee reserve before offering purchases. Starting without a usable signer leaves new v2 campaign wallet approvals unavailable; it does not fall back to unfunded promises. New paid entries remain disabled even if an old environment contains their former enable flag.

Health check `/health` checks database connectivity. It does not yet report settlement lag or mint liquidity. Before inviting paying users, add alerts for held liabilities, queue age, rejected/review payments, return reconciliation errors and backup failures. Use resource alerts before a spending stop: stopping the service to enforce a hard budget also stops payouts. Begin with 512MB–1GB API allowance; two verifier workers each have a 128MB heap limit, so observe real memory before lowering limits. Measure total API + Postgres memory, CPU, storage and egress, not just the plan subscription.

Do not use an external ping service as a substitute for an always-running worker plan. Do not enable Serverless on PostgreSQL if database wake-up latency is also unacceptable. Avoid a database whose free tier auto-suspends if the goal is no end-to-end idle cold starts.

## Sources

- Railway pricing: https://railway.com/pricing
- Railway billing: https://docs.railway.com/pricing/understanding-your-bill
- Railway Serverless sleeping behavior: https://docs.railway.com/deployments/serverless
- Railway resource rates / example estimate: https://docs.railway.com/guides/cut-idle-costs-serverless
- Render prices: https://render.com/pricing
- Render free-service sleep: https://render.com/docs/free
- Hetzner current price adjustment: https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/
- Oracle free-resource reclamation: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
