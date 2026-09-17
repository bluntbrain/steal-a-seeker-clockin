# Publishing 0.3.4 — tutorial repair

Package: **com.bluntbrain.stealaseeker**. Version **0.3.4**, Android versionCode **7**.

APK: `releases/steal-a-seeker-mainnet.apk` (ignored local artifact).
SHA-256: `b9a76e8a1c7bc9247c98f16e29e4d2bce833996958b8577a23012523d2290a13`.
Latest rebuild: 2026-09-17T11:55:45.195Z. Versioned upload: `releases/steal-a-seeker-mainnet-v0.3.4-code7.apk`.
Signer certificate SHA-256: `4fa3e9942238f110824fb67dc99438fc1d70ef48a273e4a79331d5f8a1e1e913`.

The same release signer is retained at `~/.config/steal-a-seeker/distribution.jks`, with private `release-signing.json` beside it. Alias: `seeker-distribution`. Do not put either private file in Git or a store submission. Build using `npm run build:apk` on the configured Node 22 / Java 17 / Android SDK 36 Mac. Increase versionCode for each new release.

## Change and validation

This patch fixes off-centre tutorial taps, guide/level mismatch after returning from Missions, and checkpoint persistence. It follows moving guards with the marker. Full detail: [tutorial audit](TUTORIAL-AUDIT-2026-09-17.md).

TypeScript and 189 game/client tests pass. Browser tutorial reaches extraction, awards 60 local credits and opens mission two. APK signatures verify. The new build installs and cold-launches on the connected Realme RMX5033. A physical touch/audio/payment walkthrough remains unverified because the phone was locked during the audit. Existing phone saves were not cleared.

No economy, token amount, treasury, backend or weekly simulation changes are included. Mainnet TEST_PRICING remains enabled; prices come from the backend. See [PRICING.md](PRICING.md).

## Publisher identity

App NFT: `39YPwP5Um3Bs9sNXTfthGesCPGMqXxjytc3hEkwA5RYZ`.
Publisher wallet: `HrME4xg2hinc7edR5shEhVqHj3Ec3kNQTS8UzqmWgPkf`.
The verified prior mint receipt is `publishing/0.3.2/app-mint-mainnet.json`.

[Publisher releases](https://publish.solanamobile.com/dapp/com.bluntbrain.stealaseeker/releases).
The user submitted this first store release on 17 September 2026. Their portal receipt shows **In Review**, submission **335466789624**. Approval has not been confirmed. The version number reflects internal builds; this is the first public release.

## Live URLs

- https://stealaseeker.bluntbrain.com/
- https://stealaseeker.bluntbrain.com/privacy
- https://stealaseeker.bluntbrain.com/terms
- https://stealaseeker.bluntbrain.com/support
- https://stealaseeker.bluntbrain.com/delete-account

All returned HTTPS 200 during this audit. Support: hello@kraneapps.com.

A private signing backup and an unsent draft email were prepared outside the repository. No signer, signing password, treasury key or API key is included in this public release record. GitHub authentication recovered, and code through `9ba1c4d` was verified pushed to the private repository before the store audit.

## Submitted release audit — 17 September 2026

- Downloaded the store APK and computed its SHA-256: exact match to the signed local build above. Size 122,925,059 bytes (117.23 MiB; the portal labels it MB).
- Release NFT: `3uxbBTHUxNLwF19eFTQNB1JYosdrJEXcDzRKd1G5Jhax`. On-chain metadata references the submitted JSON and has a verified collection equal to the App NFT above.
- Release transaction: `5rnTjhtszprppxdeS22Nwb1xLDQhFjc6Hax9QBuGJhJJLs6m4Vd3Ra8mnu71tWCvo81FaE2M4QiDa4YhnxVaqVtz`, finalized with no error.
- Public release metadata saved at `publishing/0.3.4/release-metadata.json`; package, version/code, SDK 24/36, certificate and nine permissions match the local build.
- Website, privacy, terms, support and account-deletion URLs returned HTTPS 200. Mainnet health and weekly endpoints returned 200; three weekly missions available.
- Live catalog still has TEST_PRICING=true: pass 1 SKR or $0.10 worth of SOL. No prices changed during this read-only live audit. Choose launch pricing before approval; official publishing docs say approval goes live immediately.
- The release external_url inherits the publisher website `https://bluntbrain.com/seeker`, which currently lists other apps and omits this game. Prefer the dedicated game URL in app fields where available, or update that publisher page to include the game. It is a working link, not evidence of an APK problem.
- Submitted copy explicitly says weekly token prizes are inactive. Keep that promise aligned with the service; no token rewards were activated.
- This verification does not replace the outstanding physical-device touch/audio/payment walkthrough recorded above.

Reference: https://docs.solanamobile.com/dapp-store/submit-new-app (accessed 17 September 2026). The official estimate is 3–5 business days; review and approval remain the store team's decision.
