# Mainnet release 0.3.30 — code 33

Built 25 September 2026 for manual upload to the Solana dApp Store. Package: `com.bluntbrain.stealaseeker`. Upload artifact: `releases/steal-a-seeker-mainnet-v0.3.30-code33.apk`.

Includes the latest local game changes, generated patrol/Heavy/scout-drone sprites, role-specific vision cones, updated mission demonstrations, and selected music tracks 2, 3, 4, 10 and 12. Uses the existing Filament phone renderer and mainnet API.

## Production pricing

The user requested normal purchase values. Railway production `seeker-api` now has `TEST_PRICING=false`; other price settings were retained. Catalog and live pricing endpoints confirmed:

- Game Pass: 500 SKR or a $10 SOL target, plus network fees. These are alternative prices, not a fixed equivalence.
- Credit packs: 500/$1, 1,500/$2.50, 3,500/$5; live SKR/SOL conversion.
- Regular outfits: 20 SKR; Solana character skins: 100 SKR; live SOL alternatives.
- Existing owned items and snapshotted orders retain their terms.

Deployment `2e27542c-fd02-4543-a005-8635eeb526ca` succeeded. Mainnet health and payment-health endpoints passed. The deployed verifier accepted ordinary-input winning replays for the first and final campaign missions under rules `6def64a8028a9aacdd926441f15e07135318a88609042d9a17a635b94367d354`.

## Verification

- 332 client tests and 81 backend tests passed.
- Release build succeeded; package/version/min SDK 24/target SDK 36 verified from the APK.
- APK signature and 16 KB ZIP alignment verified. Certificate SHA-256 matches previous releases: `4fa3e9942238f110824fb67dc99438fc1d70ef48a273e4a79331d5f8a1e1e913`.
- 274 source hashes matched the build receipt.
- APK music content hashes match exactly the five selected tracks. All three enemy sprites match their source pixels after Android packaging.
- Artifact SHA-256: `f0cfb913de9b9e7c7fb79a51a9902de53456564037971693b4fbcaf3d49156df`.
- Detailed evidence: `verification/releases/code33/`.

No physical-device installation, payment transfer or store upload was performed during this release task.
