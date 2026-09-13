# USD checkout / SKR and SOL

Campaign pass: USD 10.00 minimum at quote creation. Same entitlement in either currency. Devnet only: TEST SKR or devnet SOL; USD is a mainnet market-value reference, not real money collected in this build. Cosmetics retain their SKR base prices and gain a SOL alternative at the same quoted USD value. Completion reward remains 25 TEST SKR regardless of payment currency; existing purchases and reward terms are honored.

Server fetches Coinbase SKR-USD and SOL-USD spot rates (60-second cache, bounded timeout, no stale-price fallback). Quotes snapshot the rate/source/time, USD value and integer amount. SKR rounds up to whole tokens; SOL rounds up to 0.0001 SOL. Pass cannot quote below $10 at that snapshot. Display USD to cents with approximate notation; never imply a lower exact charge. Market value can change after quoting. Network fees are additional.

Five-minute new quotes. Exact quote returned by server is shown before the Pay button. Currency is locked once a payment is prepared. Unprepared quotes may be cancelled to change methods. Existing quotes, prepared transactions, finalized reference reconciliation and receipt uniqueness remain authoritative. No blind payment retries, no client-supplied amount, no mainnet switch.

Native SOL uses a System Program transfer signed by the buyer with the same order reference and memo. Server verifies finalized execution, buyer, amount, destination, reference, memo, balance movement and quote window. SPL payments retain transferChecked verification. Completion reward reserves the configured TEST SKR treasury even when payment is SOL.

Validation: pricing rounding/staleness, SOL instruction construction, wrong amount/wallet/recipient/reference, cross-currency idempotency, concurrent preparation, cancellation locks, restored purchases, reward reservation and devnet API checkout. Native sheet should fit a small phone without adding a scrolling product list.

## Verified on devnet

- 102 client tests and 55 server tests pass, plus TypeScript.
- Both a native SOL payment and TEST SKR payment finalized on deployed API, unlocking the same campaign. The SKR run also recovered a lost wallet callback through the order reference. Evidence: [QA report](../verification/usd-checkout-qa.json).
- Actual native wallet sheet rendered with a simulated wallet in React Native Web at 360 × 640; SKR/SOL selection, review, and cancellation back to payment methods checked. This preview sends no payments. Rebuild with `node scripts/build-checkout-preview.cjs`.
- Physical Phantom approval of the new two-currency checkout remains a user test. Existing campaign owners are not charged again.
