# Security

## Reporting a problem

Please report security issues privately. Do not open a public issue. Contact the maintainer, @bluntbrain, on X or GitHub, and include the steps to reproduce, the commit or app version, and what an attacker could do with it.

## How the game protects players and payments

- **Wallet sign-in.** The server issues a single-use challenge, the wallet signs it through Mobile Wallet Adapter, and the server checks the signature before it issues a session.
- **Payments.** The server prepares each purchase and only grants an item after it has verified the transfer on chain: the payer, token, amount, recipient, reference and finality. Duplicate callbacks fulfil an order once.
- **Verified runs.** Every campaign result is replayed on the server against pinned rule bundles before it counts toward credits, rewards or the leaderboard. A client cannot submit a score it did not play under the rules.
- **Secrets.** Production keys and the database connection live only in Railway variables. They are never committed. The deploy script uploads a staged copy of the API without environment files, key files or signing files. Token returns are signed with the treasury key, held only as a sealed Railway variable. The server refuses to start return processing if that key does not match the configured treasury address, and it never logs the key or its parse errors.
- **Rate limits.** The API limits requests per client, with tighter limits on run submission, promotions and friend search.
- **Android.** App backup is disabled, so the wallet session stored on the phone is not copied into device backups. Release builds are signed with a key that is not in this repository. `android/app/debug.keystore` is Android's standard public debug key, used only for local debug builds.
- **Third-party data.** The `.skr` name directory is a one-time copy of public data, stored in our own database. The app never calls the source on a user request.

## Notes on the Radiants Clock In advisory audit

The audit ran on commit `aa4657d` on 8 October 2026 and reported 174 findings. Each group was reviewed.

| Finding | Status |
|---|---|
| 142 leaked secrets in `releases/*.apk.json` and `verification/` | Not secrets. These lines are SHA-256 checksums of source files in build manifests, and the public key fingerprints of the release signing certificate. Nothing was exposed, so no key was rotated. The files stay because the release notes in `docs/` link to them as evidence. |
| `sharp` 0.34.5 advisories | Fixed. Updated to 0.35.5. It is a build-time image tool and is not part of the app. |
| `stream-json` and `uuid` advisories in the server | Not reachable. Both arrive through `@solana/web3.js` 1.x via `jayson`. The server does not use the affected stream-json filters or uuid v3, v5 or v6 with a buffer. The only fix is web3.js 3, a breaking upgrade that is tracked separately. |
| Other server dependencies | Fixed. `fastify` is updated to 5.12.5, and `fast-uri` and `ip-address` to their patched versions. |
| `android:allowBackup` is true | Fixed. Backup is now off in `app.json` and the Android manifest. |
| Docker base image pulled by tag | Fixed. `Dockerfile.api` pins `node:22-bookworm-slim` by digest. |
| Data written into a page as HTML | Not shipped. These are internal design review pages in `design/visual-v2/`. Report data is now escaped when it loads; the remaining arrays are written by hand inside the page. |
| XML parsers in Python scripts | Not shipped. They are QA scripts that read screen dumps from our own test emulator, never untrusted input. |
| Hardcoded `http://` endpoints | Not network calls. They are Android XML namespace names and comments. |
| Server fetch built from request data in `src/commerce/client.ts` | Not server code. This is the mobile app calling our own API at a fixed base URL. |
| Exported component in the Android manifest | Required. The launcher activity must be exported for Android to start the app. |
| Predictable random in `scripts/make-audio.py` | Not security related. It generates sound effects, not tokens or keys. |
| Advisories in Expo CLI, Metro, Jest and patch-package | Build and test tools only. They are not inside the APK. Fixes require major Expo and React Native upgrades and will follow the next SDK upgrade. Non-breaking fixes were applied. |
