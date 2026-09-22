# Illustrated credit store and campaign reward syncing

## What caused misleading pending states

The native win flow uploaded the entire campaign outbox, fetched the campaign summary, then called account.refresh(), which validated the session and fetched the account again. A failure in any later request discarded a successful upload's award in the UI. A started ref combined with effect cleanup could also suppress the final callback after a rerender. Most failures were incorrectly described as needing a wallet connection.

## Changes

- Submit the current win directly after persisting it. Old queued runs cannot delay its claim screen.
- Share concurrent submissions between the win screen and background importer. Preserve recent receipts across component remounts.
- Retain distinct offline wins instead of replacing a previous replay for the same mission. Queue acknowledgement cannot erase a newer win.
- Retry transient errors with bounded delay and on foreground. Explicit Sync with wallet can renew an expired session; normal wins never open Phantom automatically.
- Confirm the reward independently of account-refresh failures. Backend receipt includes the transactionally confirmed balance.
- Restore queued uploads when restoring a valid session and returning to the app.
- Skip replay simulation when the exact wallet/mission/rules/replay hash was already verified. Credit awards remain protected by the wallet lock and existing star ledger.
- Replace ambiguous Sync pending with specific retry/sign-in guidance. Local save failures are distinguished from a saved run waiting for verification.
- Implement Add Credits B with three generated pack illustrations, selected states, live native SKR/SOL checkout and a single pay action. The existing MWA signAndSendTransactions and server reconciliation flow are reused. Packs cannot change during an active order.
- Browser preview explicitly says demo; no payment or automatic credits on opening/selecting packs.

## Verification

- TypeScript passed.
- 225 application tests passed, including six new outbox concurrency/retry tests.
- 75 backend tests passed, including concurrent award idempotency and receipt-balance assertions.
- Browser checked at 390×844 and 360×740. Pack selection updates the CTA without changing the balance. Smaller screens can scroll safely. Screenshot: design/add-credits/implemented-b.png.
- Signed mainnet v0.3.8, code 11 built successfully. Package com.bluntbrain.stealaseeker. Signing certificate matches the existing release.
- Railway deployment dbb66ef3-cab7-4257-8ae6-902812298fe4 reached SUCCESS. /health returned ok:true, solana:mainnet.

## Limits

No Android device was attached, so this build has not been installed or physically exercised. No real payment was approved. Public-RPC payment rate limiting from the previous investigation is a separate remaining infrastructure risk; this change does not replace that endpoint. No matching campaign runtime errors were returned by the bounded post-deployment log check, so the original phone incident cannot be attributed to one specific request without device logs.
