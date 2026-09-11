# Devnet return worker

Implemented backend foundation, 12 September 2026. This is not yet a playable paid challenge: entry checkout, paid-run recovery, verified-outcome wiring and the native settlement screen remain to be connected. No live return has been sent. The current local API leaves the return worker disabled.

## What is implemented

`server/returns.ts` reserves both the maximum TEST SKR return and 0.003 devnet SOL for account creation/network costs. Reservations have a unique external key and immutable wallet, mint, treasury, amount and destination. A reservation permits one allocation, either success return or refund. Changing the outcome cannot allocate a second transfer. Allocated funds cannot be released as unused.

Capacity checks and settlement bookkeeping share a PostgreSQL advisory lock. This prevents a completed transfer from releasing its liability while a quote is still using an older balance. New balance reads also require a context at least as recent as the latest recorded finalized return. Pending/review transactions retain their reserves. Token capacity is tracked per mint; SOL liabilities are counted across all mints using the same treasury.

The queue uses claim tokens and leases. A worker prepares and signs locally, then persists the complete transaction bytes, signature and lifetime before broadcasting. Another worker can recover the record after a process crash. Stale workers cannot persist a replacement under a newer claim. Lost send responses reuse the existing bytes rather than creating another payment. Eight conclusively failed/expired transaction lifetimes send the allocation to review; they do not discard its liability.

A return is complete only after finalized RPC evidence matches the reserved authority, source, recipient, mint, amount, memo and reference. The receipt stores signature, slot and devnet cluster. A non-finalized status, missing transaction, stale provider, incomplete history or unknown reference keeps it unresolved. An unexpected finalized transfer requires review. The owner can read status through authenticated `GET /returns/:id`; no signing bytes or key material are exposed by that endpoint.

There is no public reserve, allocate, release or force-success API. The future paid-entry service must call these internal methods only after verifying its payment and run/refund outcome. The reservation's external key must identify the paid entry, so success and refund share one allocation limit. This authorization wiring is required work, not established by having a worker.

## Solana transaction

`server/return-chain.ts` verifies the devnet genesis, classic SPL mint, decimals and initialized treasury account before preparation. It validates the recipient's derived associated token account, includes idempotent account creation, a TransferChecked instruction, the allocation reference and a memo. It checks actual message fees/rent against the reserve and simulates the signed transaction without broadcasting. The signing key must match the configured treasury and be stored in a private local file.

The implementation distinguishes RPC acceptance from final execution, as required by [sendTransaction's contract](https://solana.com/docs/rpc/http/sendtransaction). It uses [signature history search](https://solana.com/docs/rpc/http/getsignaturestatuses), transaction verification and a finalized reference scan before replacing an expired attempt. The balance/transaction data still depend on an honest, sufficiently complete RPC provider. A provider's pruning or unavailable history leaves a return pending for archival reconciliation; this is not trustless escrow.

## Configuration

Purchase verification and the read-only return status endpoint need no signing key. Return processing is opt-in:

```sh
# The path must point to a dedicated private devnet key outside the repository.
DEVNET_SIGNER_PATH=/absolute/private/devnet-treasury.json \
  node --env-file=.env.server --import tsx server/check-return-signer.ts

# Enable only when the verified paid-entry flow is connected and tested.
DEVNET_RETURNS_ENABLED=1 DEVNET_SIGNER_PATH=/absolute/private/devnet-treasury.json \
  node --env-file=.env.server --import tsx server/main.ts
```

The check command validates file permissions and the configured public identity. It sends no transaction. Never mount a mainnet treasury key here. The worker independently rejects a non-devnet RPC before broadcasting.

Migration 004 creates reservations, allocations and signed attempts. It has been applied to the dedicated local/test databases and must not be edited in place. Add another migration for changes. Signed transaction bytes are recovery records, not private keys; the signing key remains outside PostgreSQL and source control.

## Evidence and remaining work

The 32 server tests include eight PostgreSQL return tests and six tests of actual signed transaction encoding with synthetic RPC responses. They cover insufficient capacity, concurrent reservations/outcomes, owner-only status, persistence before broadcast, crashes before/after persistence, lost callbacks, lease replacement, exactly one allocation, finalized settlement, expiry/history checks, recipient identity and the stale-balance/released-reserve race. The generated wire transaction has a cryptographically valid treasury signature and the expected instruction accounts/amount.

`verification/return-worker-check.json` and `verification/return-worker-tests.txt` retain the checkpoint's scope and sources. The local API restarted with migration 004 and the authenticated status route. The dedicated development signing file passes the offline identity check. These tests do not establish a live devnet transfer, physical Phantom, paid-entry verification, player recovery or real-money readiness.

Next: persist entry quotes and payment lifetimes; reserve before entry payment; issue a paid run only after payment finality and explicit Start; recover its input log; allocate a return from the pinned verifier; show pending/finalized/refund receipts in Android; test the complete flow with Phantom on a physical device. Unstarted entries, expired runs and infrastructure errors need the explicit policies in [the settlement contract](SETTLEMENT-DESIGN.md). Mainnet and economic release conditions remain unchanged.
