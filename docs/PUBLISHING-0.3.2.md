# Android release 0.3.2

The package is **com.bluntbrain.stealaseeker**, versionCode **5**. This replaces the prototype package before the first store release. Keep this package and the existing signing key unchanged for future updates.

## Build and signing

Run `npm run build:apk` in `/Users/bluntbrain/Documents/code/clockin/seeker-game`. The signed, standalone arm64 APK is `releases/steal-a-seeker-mainnet.apk`; its adjacent JSON records source hashes, configuration and APK checksum. JavaScript, images and audio are bundled, so the Mac and cable are not needed after installation. Online services require internet access.

APK SHA256: `ee4d8c07ecb9ddc1cf9be54a11780594b104de0e65ce25263e599ccd3c67e07b`.

The same release signer was verified: SHA256 `4fa3e9942238f110824fb67dc99438fc1d70ef48a273e4a79331d5f8a1e1e913`. Private signing files remain outside the repository at `/Users/bluntbrain/.config/steal-a-seeker/distribution.jks` and `release-signing.json`. Never regenerate the key for routine updates. The keystore and passwords are not needed by APK testers or app reviewers.

## Phone testing

Installed successfully on the connected Realme RMX5033. Android reports version 0.3.2, code 5; the new MainActivity launched and its process remained running with no startup errors in the filtered app logs. Visual confirmation is pending phone unlock. Receipt: `publishing/0.3.2/device-check.json`.

The old app was not uninstalled. New Android package means a separate local save. Connect the same wallet to restore wallet-linked server purchases. Do not assume the old local campaign progress migrated.

Test the free campaign first, then Hideout outfits, then weekly practice. For paid testing, open Leaderboard and the Game Pass flow. Verify the payment amount in Phantom and verify the entitlement after returning. The native app is configured for real Mainnet, not devnet. This release did not itself perform or verify any wallet transfer.

## Publisher listing

The user deleted the old `com.krane.stealaseeker.mvp` portal listing. The replacement uses `com.bluntbrain.stealaseeker` and reuses the existing name, description, approved icon, banner, four portrait screenshots and English (United States). The assets are in `publishing/0.3.1/` and remain valid for this package-only change.

Website: https://stealaseeker.bluntbrain.com/
Privacy: https://stealaseeker.bluntbrain.com/privacy
Terms: https://stealaseeker.bluntbrain.com/terms
Support: https://stealaseeker.bluntbrain.com/support
Account deletion: https://stealaseeker.bluntbrain.com/delete-account
Contact and support: hello@kraneapps.com

The listing was saved at https://publish.solanamobile.com/dapp/com.bluntbrain.stealaseeker. The user minted App NFT `39YPwP5Um3Bs9sNXTfthGesCPGMqXxjytc3hEkwA5RYZ`; Mainnet RPC independently confirms its successful finalized transaction, supply 1, and metadata package `com.bluntbrain.stealaseeker`. Evidence is in `publishing/0.3.2/app-mint-mainnet.json`. No APK release has been submitted or approved.

The form validates the website and policy links. See `publishing/0.3.2/status.json` for the current portal state. No store approval or payment completion is implied by a successful build. The publisher must personally approve any wallet transactions after checking their simulation and amount.

The existing listing copy and policy explanation are retained in the historical [0.3.1 release guide](PUBLISHING-0.3.1.md). Weekly token prizes are inactive; do not advertise active cash prizes or guaranteed winnings.

## Remaining release steps

1. Unlock the Realme and test free missions, outfit equip, weekly practice, pass purchase, ranked result submission and reopening/restoring access. Payment testing is on Mainnet with real funds; the live catalogue currently asks 1 SKR or a $0.10 SOL target for the pass.
2. After testing, intentionally choose public launch prices (`TEST_PRICING=false` restores live targets; do not switch during the user's reduced-price testing). Confirm whether weekly cash prizes remain off; the listing currently says they are inactive.
3. Open the correct app's Releases page, choose **New Version**, upload the 0.3.2 APK and provide release notes/reviewer testing instructions. The portal currently shows **No releases yet**.
4. The publisher completes any required wallet signatures and final submission. Record the resulting release and review status. App NFT minting alone did not submit an APK or make the game live.
