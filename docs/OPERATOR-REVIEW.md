# Devnet operator review

The local operator tool can refund an eligible original entry, retry its recorded replay, or resume an existing return. It uses database credentials and is not exposed through HTTP. Wallet sessions cannot invoke it. The tool does not sign or broadcast; approved returns still use the normal settlement worker.

## Inspect before acting

From the game directory, with the server environment configured and migrations applied:

```sh
node --env-file=.env.server --import tsx server/review.ts entry ENTRY_UUID
node --env-file=.env.server --import tsx server/review.ts return RETURN_UUID
```

The output contains status, payment/return identifiers and `expectedHash`. It excludes private keys, signed transaction bytes and the replay input log. Inspection is read-only. Copy the current hash into a request file:

```json
{
  "id": "NEW_REQUEST_UUID",
  "action": "refund-entry",
  "targetId": "ENTRY_UUID",
  "expectedHash": "HASH_FROM_INSPECTION",
  "actor": "operator-name",
  "note": "Explain the evidence and why this decision is appropriate."
}
```

Replace the placeholders with real values. Keep notes free of credentials and unnecessary personal information. A new request needs a UUID; an uncertain response must be retried with the same unchanged request file.

```sh
node --env-file=.env.server --import tsx server/review.ts apply review-request.json
```

`apply` is an explicit mutation. If the inspected record changed, the tool rejects the stale decision. A successful action and its audit row commit together. Reusing a request ID with altered fields is rejected; an identical retry returns the recorded result without applying the action twice. The actor is an audit label, not a separate authentication system; access is controlled by the operator's database credentials.

## Supported actions

| Action | Requirements and result |
| --- | --- |
| `refund-entry` | Original paid entry is in review, its full reserve remains held, and it has no allocated return or unresolved additional payment. The original receipt and finalized transfer must match again. Allocate one entry-token refund, excluding network fees. |
| `retry-replay` | Same payment/reserve requirements, plus an intact previously submitted replay whose canonical hash matches the stored commitment. Queue those exact inputs under the original pinned rules. The operator cannot provide a score, replacement replay or forced win. |
| `retry-return` | Existing return is in review with its reserve held and no settled receipt. Preserve its active signed transaction and queue reconciliation. If the previous budget was exhausted, permit up to eight further lifetimes, capped at 128 total. |

Missing RPC history or a payment that cannot be reconfirmed does not authorize an entry refund. Restore reliable devnet evidence and inspect again. A return retry preserves its signature and bytes; only normal finalized reconciliation can establish non-execution before a replacement is signed. Settled returns cannot be retried through this tool.

For a missing client log, inspect the payment, run deadline and reported interruption before deciding whether an operator refund is appropriate. A refund is an explicit operator decision, not proof the player won. For a verifier/configuration fault, repair the cause before retrying the same stored replay or return.

## Boundaries and remaining reconciliation work

This tool intentionally does not resolve an unrecorded late payment, a released quote reserve, an additional payment, a transfer bound to another purchase, or a return with conflicting external transfer evidence. Those cases need payment-specific reconciliation and, when necessary, a separately funded compensation record. The service must not silently clear their review state or reuse an original return allocation to cover multiple payments. That compensation workflow remains to be implemented.

No mainnet behavior is enabled. New paid entries remain paused locally; no live operator refund was performed during this checkpoint. Migration 007 adds the audit table and per-allocation retry ceiling. Applied migrations must remain unchanged.

## Evidence

48 server tests pass, including concurrent review retries, altered request IDs, stale decisions, RPC uncertainty, absent payment receipts, corrupted stored replay, pinned replay recovery, preservation of an uncertain signed return, bounded retries after eight failed lifetimes, and refusing to hide an additional payment. Tests use PostgreSQL and synthetic chain responses. See `verification/operator-review-check.json` and `verification/operator-review-tests.txt`.

Native app code and the current APK are unchanged by this backend increment. Full native paid-screen interaction, SQLite process-death recovery, live devnet settlement, physical Phantom, hosting and final release work remain unverified.
