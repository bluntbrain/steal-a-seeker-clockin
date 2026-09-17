# Steal a Seeker — dApp Store release 0.3.1

Historical record. Superseded by [0.3.2](PUBLISHING-0.3.2.md). The user deleted this prototype-package portal draft. Its archived APK is `releases/steal-a-seeker-legacy-0.3.1.apk`; do not upload it for the new package.

## APK and signing

The archived app is `releases/steal-a-seeker-legacy-0.3.1.apk`. Package: `com.krane.stealaseeker.mvp`. Version: 0.3.1, Android versionCode 4. Target SDK 36; minimum SDK 24; arm64-v8a. This is a native React Native release build with bundled JavaScript, artwork and sound; it does not require Metro or the Mac after installation. Online services and wallet payments require internet access.

Build on this Mac:

```sh
cd /Users/bluntbrain/Documents/code/clockin/seeker-game
npm ci
npm run typecheck
npm test
npm run build:apk
```

Use the existing Android SDK and JDK 17. `scripts/build-release.cjs` invokes Gradle, injects Mainnet API configuration, reads the private signing config, signs the APK, then copies it to `releases/`. Do not run `signing:init` to replace an existing key. Increment versionCode for every store update; keep the package and signing key unchanged.

Private signing material (never attach to the store):

- Keystore: `/Users/bluntbrain/.config/steal-a-seeker/distribution.jks`
- Alias: `seeker-distribution`
- Password configuration: `/Users/bluntbrain/.config/steal-a-seeker/release-signing.json`
- Both files are owner-readable only (0600) and outside the repository. Git ignores keystore and secret file extensions.

The Android signing key proves that future updates come from the same publisher. It is separate from the publisher's Solana wallet and the game's payment treasury. Back up the keystore AND its passwords in a password manager or encrypted vault. Losing them can prevent updates. Someone with both can sign an app as you.

Email the APK or a restricted download link to `hello@kraneapps.com`; the recipient does not need the keystore to install or review it. The APK exceeds Gmail's normal attachment limit. If transferring signing ownership is intended, use an encrypted archive and send its password separately, or use a password-manager vault. Do not put the key and plaintext passwords together in an ordinary email.

## Website URLs

- App: https://stealaseeker.bluntbrain.com/
- Privacy: https://stealaseeker.bluntbrain.com/privacy
- Terms: https://stealaseeker.bluntbrain.com/terms
- Support: https://stealaseeker.bluntbrain.com/support
- Account deletion: https://stealaseeker.bluntbrain.com/delete-account

Account deletion is an email-based verified support process, not an automatic deletion endpoint. The operator must handle requests and document any legally necessary retention. App settings links to these pages. Public blockchain data cannot be erased.

## Listing

Name: Steal a Seeker

Subtitle: Sneak past guards. Take the phone. Escape.

Description:

Steal a Seeker is a tap-to-move stealth action game for Android. Find a path through the guards, use walls for cover, grab the phone and reach the exit. The alarm changes the pace once the phone is gone.

Start with 12 free missions across warehouses, rooftops and powerworks. Earn game credits from mission clears, collect the phones and equip courier outfits in your hideout. Outfits are cosmetic; they do not improve ranked combat stats.

Each week brings three shared missions. Practice for free as often as you like. An optional, one-time Game Pass unlocks five ranked attempts per mission. Your best complete run on each contributes to the weekly score. You cannot buy extra attempts.

Optional Game Pass and credit purchases use SOL or SKR through Solana Mobile Wallet Adapter and a compatible Android wallet. You see the payment amount and approve it in your wallet. Connecting a wallet alone does not transfer funds. Credits cannot be withdrawn or exchanged for tokens.

Early access: weekly token prizes are not active. Buying a Game Pass unlocks ranked play and does not promise winnings or a financial return. This independent game is not affiliated with or endorsed by Solana Mobile.

Contact / support: hello@kraneapps.com. Public pages identify the user-provided Krane Apps brand without asserting a registered legal entity or jurisdiction.

## Verified state before final submission

- Campaign and weekly practice are free.
- Server verifies ranked replays; five attempts per contract.
- Cash-prize payout programme is not enabled; the listing must not advertise active prizes.
- No physical Android device was attached during this release preparation. Latest binary needs an on-device smoke test before describing it as physically verified.
- Existing test prices remain active. Public pages are live under the Krane Apps publisher brand; no registered entity or jurisdiction is asserted.
- Submission is not the same as store approval. The portal's final upload/mint flow needs publisher-wallet signatures and possibly storage funding, which the owner must approve.

## Sources checked 17 September 2026

- https://docs.solanamobile.com/dapp-store/submit-new-app
- https://docs.solanamobile.com/dapp-store/build-and-sign-an-apk
- https://docs.solanamobile.com/dapp-store/publisher-policy

Solana Mobile currently describes app review as 3–5 business days and asks publishers to retain both their Android signing key and publisher wallet access for future updates. Check the portal's actual upload estimate rather than treating its rough SOL guidance as a fixed fee.

## Live publisher handoff

Website deployed successfully on 17 September 2026, Railway deployment `791f6c21-9e52-4d1c-beda-6113d661f3ae`. Homepage, Privacy, Terms, Support and Delete Account returned HTTP 200 over HTTPS; API health remained Mainnet. Existing test prices were unchanged.

The app listing has been saved at https://publish.solanamobile.com/dapp/com.krane.stealaseeker.mvp, with icon, banner, four screenshots, English and both policy URLs. It remains a draft: no live version or release in review. The overview shows **Mint App**. The owner must complete the App NFT transaction (portal estimate about 0.02 SOL plus upload costs) in the connected publisher wallet before release upload is available. No wallet transaction was approved by the agent.
