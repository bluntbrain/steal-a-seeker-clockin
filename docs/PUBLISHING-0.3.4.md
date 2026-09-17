# Publishing 0.3.4 — tutorial repair

Package: **com.bluntbrain.stealaseeker**. Version **0.3.4**, Android versionCode **7**.

APK: `releases/steal-a-seeker-mainnet.apk` (ignored local artifact).
SHA-256: `b9a76e8a1c7bc9247c98f16e29e4d2bce833996958b8577a23012523d2290a13`.
Build time: 2026-09-17T11:29:02.033Z.
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
The App NFT is minted, but this patch does not submit or approve an APK release.

## Live URLs

- https://stealaseeker.bluntbrain.com/
- https://stealaseeker.bluntbrain.com/privacy
- https://stealaseeker.bluntbrain.com/terms
- https://stealaseeker.bluntbrain.com/support
- https://stealaseeker.bluntbrain.com/delete-account

All returned HTTPS 200 during this audit. Support: hello@kraneapps.com.

A private encrypted signing backup and an unsent draft email were prepared outside the repository. No signer, archive password, treasury key or API key is included in this public release record. GitHub authentication failed during the audit; local commits must not be described as newly pushed.
