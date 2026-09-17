# Account and data requests — operator procedure

Support mailbox: hello@kraneapps.com. Public instructions: /delete-account. This release uses verified email support, not an automatic deletion API. Publishing those instructions creates an operational responsibility to monitor the inbox and handle requests.

1. Record receipt and acknowledge the request. Ask for only the public wallet address and requested scope. Never ask for a private key, seed phrase, access token or payment.
2. Verify ownership with a fresh, clearly described signed message bound to this request and a random nonce, using the wallet's public signing interface. Explain exactly what is being signed. Verify the signature against the supplied address; do not accept a screenshot or public transaction knowledge as sole proof. Offer another proportionate method where legally required.
3. Read the account's records through a restricted operator connection. Resolve unsettled orders, returns and other financial liabilities before deciding retention. Do not run ad-hoc cascading deletes against the production database.
4. Explain the impact on progress, cosmetics, credits and access. Identify any financial/security records that must remain, the legal reason and retention period; do not invent a blanket indefinite exception.
5. Prepare a reviewed transaction for the requested deletion or de-identification. Wallet/profile data, sessions, auth challenges, league_identity, league_history, league_achievements and run replays must be considered together with their foreign keys. Preserve only necessary receipt and ledger records. Record the action without copying removed data into logs.
6. Verify the result and notify the requester. Explain that public blockchain data and already shared screenshots cannot be removed by us. Backups follow the configured host retention, which the operator must verify before quoting a specific expiry.

Respond within the period stated on the public page (target 30 days, or a shorter legally required period). This is an operator checklist; no production deletion has been executed as part of release preparation.
