# Payment rate-limit recovery

## Evidence

- Purchases still use official Mobile Wallet Adapter `signAndSendTransactions` in `src/wallet/sendWithWallet.ts`. The wallet broadcasts; there is no second local payment broadcast.
- The reported text came from the API's generic 503 handler, not Phantom.
- The user's latest 1,500-credit SKR order was quoted, with no payment authorization or signature. The app had stopped before wallet approval.
- An independent live unsigned checkout reproduced the same 503 on `/orders/:id/prepare`.
- Direct probes inside Railway reproduced `RpcError` HTTP 429 on `getSignaturesForAddress` and `getGenesisHash` against the configured shared official mainnet endpoint.
- The background worker scanned up to eight recent quotes every 15 seconds. Failed scans did not update `checked_at`, causing repeated retries and queue starvation. Prepared approvals were scanned twice during each reconciliation.
- Generic exception details used the `message` log field, which was replaced by the log message. Background errors omitted their cause entirely.

## Repair deployed

- Background reconciliation prioritizes prepared/signed payments. Batch size is four; pending payments wait 30 seconds between checks, unprepared quotes five minutes. The check timestamp is recorded before RPC work so failed attempts also back off.
- Prepared payment reconciliation scans reference history once. Finalized verification, expiry checks, payment bindings, idempotency and duplicate-payment protection remain intact.
- HTTP 429 read retries wait 1.5 seconds by default and honor a numeric Retry-After up to three seconds. Retries remain bounded and do not rebroadcast transactions.
- Structured logs now retain sanitized RPC method/status or database error code, plus route/order context. No provider URLs, keys or signed payloads are logged.
- Errors distinguish an unavailable preparation step from unavailable confirmation. They no longer claim that every failed request represents a submitted payment.
- Deployment `9aa6c48d-e5f6-4b5b-9da6-2fb42889a009`: SUCCESS, existing `seeker-api` service, production. No payment prices, treasury, token mint or network changed. No APK required for these backend changes.

## Verification

- TypeScript passed; 219 app/shared tests and 75 backend tests passed. Focused RPC tests passed again after the retry delay change.
- Eight live HTTP cases passed: Game Pass and all three credit packs, each in SKR and SOL. Every case prepared and re-prepared the same unsigned approval, preserved quote idempotency, and granted no credits/access without payment.
- Four unsigned mainnet simulations passed using the actual app transaction builder: Game Pass and 500 credits, each in SKR and SOL.
- No transfer signed or broadcast. No physical Phantom approval or new settlement verified; ADB had no connected phone.

## Remaining infrastructure issue

A background 429 still appeared after deployment. The code repair reduces avoidable RPC load but cannot provide capacity on a shared public endpoint. Production reliability remains unresolved until an authenticated provider is configured in Railway `MAINNET_RPC_URL` and revalidated. Keep provider credentials out of chat and the app bundle.

Two read-only alternative-provider probes were rejected: dRPC's public endpoint required a paid plan; OnFinality's public endpoint returned 429 from Railway. Neither was configured. No unsupported provider fallback was added.

References: [Solana transaction reference lookup](https://solana.com/docs/rpc/http/getsignaturesforaddress), [Solana blockhash lifetime](https://solana.com/docs/rpc/http/getlatestblockhash), [dRPC Solana API](https://drpc.org/docs/solana-api), [OnFinality Solana](https://www.onfinality.io/en/networks/solana).

## Add Credits design

Built-in image generation produced `design/add-credits/options.png`; the user selected B, illustrated pack cards. Prompt and implementation constraints are saved beside it. UI implementation is deferred as requested; live prices must be visible in the eventual screen.
