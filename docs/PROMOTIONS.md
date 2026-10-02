# Community promotions

Coupons are configured only in the backend `PROMOTIONS_JSON` variable. Never put live code values in source, public Expo variables, APK assets, screenshots committed to Git, or this document. A private operator copy lives outside the repository under `~/.config/steal-a-seeker/promotions.json` (mode 0600).

Each JSON entry has:

```json
{
  "id": "example-campaign-v1",
  "code": "REPLACE_WITH_PRIVATE_VALUE",
  "label": "Community offer",
  "sku": "campaign",
  "percentOff": 100,
  "bonusSkus": ["solana-toly"],
  "startsAt": "2026-01-01T00:00:00Z",
  "expiresAt": "2027-01-01T00:00:00Z",
  "maxRedemptions": 200,
  "enabled": true
}
```

Use a new stable ID for a new campaign; changing a code does not reset prior redemptions under that ID. Percentages are integers 1–100. Current bonus choices are the seven `solana-*` products. Future skins are not automatically included. Set `enabled: false` to stop new claims without taking away ownership already granted. Updating the Railway variable requires a redeploy/restart to take effect. Preserve the entire array when adding or changing one offer.

## Player flow

- Open the welcome Game Pass offer, Game Pass checkout, or Settings → Have a promo code?
- Apply a code to see the server-confirmed offer, included products and expiry.
- A 100% offer requires wallet sign-in, then a separate Claim button. It creates no transfer or purchase order and needs no price/RPC lookup. Already-owned items are preserved; missing bonus items are added.
- A partial discount changes both SKR and SOL prices. The normal wallet `signAndSendTransactions` flow and on-chain verification still apply. Bonus entitlements are granted only after confirmed payment.
- Discounted/free access has no purchase rebate, extra credits or extra weekly attempts. All skins are cosmetic. Ownership restores with the same wallet even after the code expires.
- Browser preview cannot claim real access. Users need the Android app for native wallet connection.

## Integrity and limits

Migration `014-promotions.sql` adds a redemption ledger and immutable promotion snapshots to orders. Wallet and campaign locks serialize claims and enforce caps across replicas. Repeated claims are idempotent. Untouched cancelled/expired quotes release capacity. Submitted or prepared payments retain their reservation until reconciled; a free claim cannot replace an unresolved purchase. Discounts cannot be stacked or supplied by the client.

Limits are per wallet, not per person. A public code can be forwarded, and one person can create multiple wallets. This intentionally simple system does not verify Cherry membership or Seeker ownership. Use the cap and expiration to bound the offer. No admin UI or frontend code update is needed to change offers.

Never log the raw config or request bodies containing codes. API redaction covers `code` and `promotionCode`; malformed configuration fails closed with a generic error.

## Verification

- `npm run typecheck`, `npm test`, `npm run server:test`, `npm run rules:check`.
- Promotion tests in `server/commerce.test.ts` cover free grants, authentication, duplicate claims, concurrency/caps, existing owners, invalid/expired offers, payments in flight, both currencies, immutable quotes and reservation release.
- `scripts/qa-promotions/serve.ts` and `build.cjs` are isolated local browser QA only. They use synthetic codes and a simulated wallet connection with real API authentication/database calls. They are excluded from the deployed API and APK.
- `scripts/qa-promotions/live.ts` is an explicit production smoke test. It uses a generated QA wallet and private config, consumes one free redemption, creates/cancels unpaid quotes, and starts/abandons a ranked attempt. It never signs or sends payments. Do not run it against production casually.

Hardware wallet approval and a real paid transfer still require separate device verification. Simulated chain tests are not evidence that Phantom approved a transaction on a phone.
