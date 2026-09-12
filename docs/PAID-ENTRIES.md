# Paid devnet entry backend

12 September 2026. Backend implemented and tested locally. Native checkout, running-replay recovery and return screens are still required. No live entry or return is claimed by this checkpoint.

## Player flow

1. Own the campaign pass and review the challenge terms. Ordinary campaign retries remain unlimited.
2. Request a quote for Battery Dash. The service reserves 10 TEST SKR plus network-cost capacity before returning a quote. Requesting a quote sends no payment.
3. Prepare and approve the exact 10 TEST SKR transfer in Phantom. The service stores its blockhash lifetime before handoff. Resuming reuses the same message; a replacement requires finalized expiry and reference reconciliation. An incomplete RPC response blocks replacement.
4. Finalized payment creates a ready entry, not a running attempt. Choose Start within 24 hours. Cancelling before Start, or letting that window expire, queues a full entry-token refund. Devnet SOL fees are excluded.
5. Start issues one run ID with frozen rules and a deadline. Battery Dash allows 240 seconds of simulation and a 420-second submission window from Start. Pause/restart does not extend that window.
6. Submit recorded inputs. Only the pinned server verifier decides the gameplay result. A verified escape allocates one gross return of 10 TEST SKR; verified capture or timeout returns zero. The return worker persists signed bytes before broadcast and marks completion only after finalized verification.

Missing, late, invalid or incomplete evidence enters review with any existing reserve retained. A syntactically rejected submission can be retried before its deadline. A replay accepted into the queue that encounters five infrastructure failures gets a refund allocation; worker saturation alone does not consume this retry budget. A late payment against an already released unpaid quote also enters review and needs reconciliation/funding intervention. Review resolution is not implemented yet.

TEST SKR has no monetary value. The treasury is operator-controlled. This implementation does not activate real SKR or trustless escrow.

## API

All entry endpoints require a wallet session and enforce ownership. Only the challenge description is public. Bodies reject extra fields.

| Method and path | Body / purpose |
| --- | --- |
| GET `/paid/challenge` | Current terms, map, prices and enabled state |
| GET `/paid/entries` | Most recent 30 entries for the signed-in wallet |
| POST `/paid/entries` | `requestKey`, `termsVersion: "devnet-v1"`; reserve and quote atomically |
| GET `/paid/entries/:id` | Entry, run and linked return status |
| POST `/paid/entries/:id/prepare` | Empty object; reconcile and persist/reuse payment authorization |
| POST `/paid/entries/:id/transaction` | `signature`; independently verify payment |
| POST `/paid/entries/:id/reconcile` | Empty object; recover payment without its callback |
| POST `/paid/entries/:id/start` | `rulesHash`; one attempt after finalized payment |
| POST `/paid/entries/:id/cancel` | Empty object; refund a paid, unstarted entry |
| POST `/paid/entries/:id/finish` | `runId`, `rulesHash`, `replay`; persist before verification |

`shared/paid.ts` defines responses. `PaymentQuote` is shared with the existing shop transaction builder. A shop order and paid entry have different memo/reference bindings and share a database-wide unique `(signature, instruction_index)` receipt, preventing one instruction from satisfying both.

Workers retry unpaid reconciliation, accepted replay verification and returns. Expired unpaid entries receive background reconciliation for seven days; authenticated reconciliation remains available later. A payment RPC outage leaves the original approval unresolved.

## Enablement and migration

`DEVNET_RETURNS_ENABLED=1` enables settlement with a dedicated external signer. `DEVNET_PAID_ENTRIES_ENABLED=1` separately enables new entry quotes, approval preparation and Start, and requires settlement configuration. Leave new entries disabled until native recovery and live testing are ready. Disable new entries without disabling processing of existing obligations.

Migration 005 backfills shop instruction receipts and creates entry/payment-attempt records. Stop old API writers before applying it, then restart only code that writes the shared receipt table. Do not mix old commerce writers with paid-entry enablement. Applied migrations are immutable.

The service permits at most one active entry per wallet. Repeated request keys recover their original entry. Entry and reserve creation share one database transaction; pinned outcome and return allocation share another. Started runs cannot be cancelled for an automatic refund. Repeating Start returns the same ticket and deadline; repeating the same finish payload is idempotent, and changing an accepted replay is rejected.

## Evidence and remaining work

`verification/paid-entry-check.json` records source hashes, test totals and local API observations. The 42 server tests use PostgreSQL and synthetic Solana RPC evidence, including actual encoded payment messages and the pinned game verifier. The 58 game/client tests pass; the rules manifest remains unchanged. The suite's independent test wallets use distinct loopback addresses so authentication fixtures do not accidentally exhaust one shared production rate-limit bucket. Production limits are unchanged.

Next native increment: terms and checkout; wallet-bound entry history; periodic serialized input-log persistence; state reconstruction without resetting the server ticket; retryable result submission; finalized/refund receipts; account-switch and process-death checks. Operator review resolution, stable HTTPS, funded devnet mint/treasury and a recorded physical Phantom entry → escape → return remain necessary before claiming end-to-end completion.
