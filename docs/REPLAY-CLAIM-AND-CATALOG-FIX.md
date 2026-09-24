# Replay claim and deployed catalog fix

September 24, 2026 · Android 0.3.23 (26)

## Failure

The 0.3.22 APK included Akshay and Beeman, while the deployed API catalog stopped at the five earlier Solana skins. Both new `/pricing/:sku` requests returned HTTP 400. The native checkout caught every failure as an exchange-rate retry, so an unsupported product appeared to be a transient price outage.

The deployed API also lacked the current campaign verifier. Production logs showed repeated `/campaign/runs` failures. The reward screen had no exit while a saved run waited for verification, including replays after completing the campaign.

## Changes

- Deploy the current catalog and versioned replay bundles to the existing mainnet API. Keep prior rule bundles so installed older APKs can still verify their runs.
- Preserve the current pricing configuration. `TEST_PRICING` is still enabled; this deployment does not change the configured commercial offer.
- Mark a replay durable only after its outbox write succeeds. A saved run can continue while synchronization is pending; an unsaved run must retry its save.
- A confirmed zero-credit reward shows Continue. First-clear credits are never awarded again for an equal or worse replay; improving stars still earns only the difference.
- Unsupported checkout products show an unavailable state instead of continually retrying exchange rates. Temporary network and price-feed errors remain retryable.

## Validation

- 297 client/domain tests, 81 server tests and TypeScript checks passed.
- Server coverage completes all twelve missions and resubmits both the first and last: each returns a resolved zero-credit award and unchanged balance.
- Browser review of the actual CreditClaim component confirmed Continue exits a zero-credit reward and Continue · sync later exits a durable pending reward. These are labelled fixtures, not claims of physical-phone playtesting.
- Production `/health`, `/health/payments`, both new skin prices, catalog and weekly league returned HTTP 200 after deployment.
- Android 0.3.23 (26) is mainnet, uses the production API, passes APK signature and alignment checks, and has the same signing certificate as 0.3.22.
- No payment was sent and no live leaderboard score was fabricated during these checks.

Production deployment: `9505301f-a322-4237-b7a9-5aa19a06d1e4`.

The backend fix benefits 0.3.22 immediately. The new screen recovery and clearer checkout errors require installing 0.3.23 (26). Physical Android wallet/gameplay validation remains a separate user test.
