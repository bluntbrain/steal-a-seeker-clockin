# Devnet paid challenge implementation contract

Partially implemented: the backend now connects reserved entry quotes, finalized payment recovery, one explicit Start, pinned replay outcomes, refunds and durable signed returns; see [paid-entry evidence](PAID-ENTRIES.md). Native checkout, paid-run recovery and receipt screens are connected; full native interaction and live-chain evidence remain pending. This extends the complete-game plan; it does not enable mainnet money play. Daily leaderboards remain a separate, no-payout mode.

## Player contract

A separate challenge screen quotes 10 TEST SKR entry and 10 TEST SKR gross success return. Failure returns zero. Show that success returns the entry token amount, not the user's devnet SOL transaction fees. Require an explicit entry approval; campaign retries must never charge this fee.

The screen must explain the start window, run/submission deadline, restart/recovery behavior, verification and pending settlement before payment. Operator or verification infrastructure failure must be distinguished from a verified gameplay loss. The treasury is operator-controlled, not trustless escrow. Real SKR release requirements in the economy review remain unresolved.

## Durable backend records (implemented)

- Entry quote: wallet, network/mint/program, amount, reference, memo, expiry and payment authorization.
- Return reservation: entry, maximum token liability, active/released/settled state and expiry/reconciliation reason.
- Paid run: entry, immutable game manifest, ticket and one terminal verified result. Client campaign saves cannot authorize a return.
- Outcome allocation: one allocation per entry, with win/loss/refund reason and exact integer amount.
- Settlement job: allocation, claim token/lease, status and retry metadata.
- Settlement attempt: signed transaction bytes, derived signature, blockhash, last valid height, destination and submission/finality evidence.

Use database uniqueness and transactional state transitions, not only in-memory locks. Existing purchase receipts and entitlements are not reusable as paid-attempt proof; each entry needs its own payment binding.

## Reserve before requesting entry payment

Read finalized treasury token balance and account identity, then compare available balance against all outstanding maximum returns while holding the treasury allocation lock. A new quote reserves its full possible return before requesting a transfer. Pending settlements continue to consume reserved capacity. Conservative double counting during finality is preferable to oversubscribing the treasury.

Do not release a reservation merely because a UI timer or RPC request timed out. An unpaid authorization can be released only after its transaction lifetime has expired and finalized reconciliation finds no matching payment. A late/out-of-window transfer needs a visible review/refund outcome. The operator can still drain its own treasury out of band; monitoring and a stop-entry condition are required, not claims of trustless protection.

A finalized entry payment grants exactly one paid attempt. Creating the run ticket happens after the player chooses to start, so wallet approval and finality waiting do not silently consume gameplay time. A paid but unstarted attempt needs an explicit expiry/refund policy in the final implementation and UI.

## Gameplay recovery

Use the same pinned rules and quantized recorder proven for daily runs. Periodically persist the input log under the wallet and run ID, then restore state by replaying that log. A recovered run keeps its original server deadline. Reopening the app must not create a new paid entry or reset the attempt's ticket.

Only a terminal server-verified result allocates a gameplay win/loss. Invalid input, expired submission and infrastructure failure need distinct states and documented outcomes. A system failure must not be silently relabeled as a player loss. Local success graphics alone never allocate money.

## Payout sequence

1. Atomically allocate one return/refund outcome from the verified paid entry and reserve.
2. Claim the settlement job with a lease token.
3. Reconcile any existing attempt before preparing another.
4. Build a devnet TransferChecked to the player's exact token account; create its associated account when necessary. Validate mint, decimals, owners, network and available fee/rent SOL.
5. Sign with the dedicated external devnet treasury key. Persist the complete signed bytes, signature and blockhash lifetime **before any broadcast**.
6. Broadcast the persisted bytes. A lost RPC response does not justify signing another transfer.
7. Reconcile the saved signature/reference and finalized transaction. Mark settlement and release its liability atomically only after the intended successful transfer is verified.
8. If an old attempt expires, prepare a new one only after finalized evidence establishes that the previous attempt did not execute. An RPC outage leaves the original attempt pending.

A crash before persistence cannot broadcast anything. A crash after persistence reuses the same signed bytes and signature. A crash after broadcast checks/rebroadcasts that same transaction. Stale workers may not replace an active attempt or overwrite a newer lease's outcome.

Private keys stay outside source, logs, the APK and ordinary API responses. Signed transaction bytes are persisted for safe recovery, but the signing key itself is never stored in PostgreSQL.

## Required evidence before calling this done

- Insufficient treasury capacity prevents creating an entry quote.
- Wrong mint/buyer/reference/amount or failed transaction cannot start a paid run.
- Lost entry callback restores the same attempt without a second charge.
- Duplicate success submissions and simultaneous settlement workers allocate one return.
- Restart after each signing/persistence/broadcast boundary produces at most one finalized return.
- Expired blockhash plus inconclusive RPC remains pending; conclusive non-execution permits a replacement.
- Closing/recreating a player token account is handled without sending to the wrong owner.
- A verified loss, unstarted cancellation and infrastructure failure each show their actual documented outcome.
- A physical Phantom devnet entry, successful run and finalized return are recorded with order/run IDs and explorer receipts.

Local SQL tests and mocked RPC responses establish only parts of this contract. Live devnet and physical-device evidence remain necessary. Mainnet enablement is a separate decision after the existing economic and eligibility conditions are addressed.
