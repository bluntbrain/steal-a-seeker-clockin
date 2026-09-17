# Hideout, costume and credit audit

## Findings and changes

The previous store promised more variety than gameplay delivered. Its art used unrelated detailed character designs. Gameplay recoloured one old courier. Weekly runs deliberately omitted the equipped appearance. The share-card background contained another fixed courier.

Replaced those paths with six separate outfits generated from the supplied `02-costumes.jpg` reference. Each includes an individual transparent portrait plus eight directional standing/walking frames. The same equipped ID now selects Hideout art, campaign sprites, weekly sprites and the exported share-card courier. Dynamic score text remains app-rendered, not baked into generated art.

| Item | Unlock | Implemented result |
|---|---|---|
| Default | Free | Off-white hood, mint backpack |
| Frost Runner | 400 credits | Snowflake hood, mint winter trim |
| Night Courier | 300 credits | Charcoal hood and pack |
| Circuit Scout | 500 credits | Mint circuit stripes |
| Archive Keeper | 600 credits | Cream jacket and tan satchel straps |
| Ghost Signal | Clear all 3 scored weekly missions | Glass-grey hood and mint pack; permanent earned outfit |
| Escape trail | 300 credits | Mint trail while moving with the phone; no speed bonus; off with reduced effects |
| Courier frame | Retired from new sales | Previously only a small border; existing ownership kept and legacy card border supported |
| Vault finish | Retired from new sales | Previously only a Hideout border; existing ownership kept |
| Phones | Complete campaign missions | Recovered collection and inspection, not a purchasable SKU |

Four purchasable outfits cost 1,800 credits altogether. No outfit changes damage, health, speed, ranked attempts or scoring. Kept `signal-runner` and `ghost-courier` inventory IDs for account compatibility. New orders and credit redemption reject retired items; old receipts can still reconcile.

## Credit flow

- Browser: `WalletPanel.web.tsx` runs a local demo checkout. Merely opening the screen or choosing a pack grants nothing. Explicit confirmation adds local credits. Copy now says BROWSER DEMO and “Add … demo credits.”
- Native: `AccountProvider.tsx` sets preview false. `WalletPanel.tsx` uses the real commerce UI and does not call the demo callback. The demo callback also rejects native use.
- Native payment uses the official `@solana-mobile/mobile-wallet-adapter-protocol-web3js` session through `useLoggedWallet.ts` and `wallet.signAndSendTransactions`.
- `CommerceSection.tsx` submits the transaction; the backend validates the expected currency, treasury, amount and receipt before fulfillment. The credit ledger grant is idempotent per order.
- Credits buy cosmetics. Buying credits does not purchase the weekly pass, attempts or leaderboard advantage. Campaign play remains free.
- The existing Mainnet API uses reduced testing prices. This audit made no real purchase and sent no wallet transaction.

## Evidence

- Local credit UI: balance 150 before opening and selecting a pack; explicit 1,500-credit demo confirmation produced 1,650; Frost unlock deducted exactly 400 to 1,250 and equipped it.
- Browser visual QA: Frost visible in campaign and weekly practice. Store fits 390×844 and 360×640. Screenshots under `verification/costumes-v4/`.
- Typecheck, 171 app tests, 70 PostgreSQL service tests and web export passed. Added costume identity, pose mapping, card-image/stats separation and retired-product tests.
- Existing Railway `seeker-api` deployment `1f084722-8b8f-40c5-b595-068fc50e7e1a` succeeded. `/health` returns 200 and `solana:mainnet`; `/catalog` includes the four outfits and escape trail, excludes the two retired items.
- Physical-device Phantom checkout and native sharing need a device pass. Browser verification and an APK build do not prove those interactions on a phone.

## Review

Open `/design/costumes-v4/index.html` in the local game preview for individual downloadable PNGs. `/design/courier-card-v2/index.html` is the preserved preview URL; the page now renders v3 cards, with selectors for all six outfits and native/web renderers. Its numbers are explicitly sample data.

The signed Mainnet APK built successfully: `releases/steal-a-seeker-mainnet.apk`, SHA256 `1efe79ace06afd1d0437e9f4b1bdd9bf73f999623713efd87471371681ea4069`. Verified the native card layout on web and downloaded a 1080×1620 sample PNG; stats stayed unchanged when switching outfits. No browser errors were recorded on the card review page.

## Direction correction

The initial v4 render mapping incorrectly assumed north=0. The simulation actually uses south=0, west=1, north=2, east=3 and starts at north=2. Corrected the atlas mapping so spawn and upward motion show the backpack, downward motion shows the face, and left/right keep their corresponding profiles. No simulation or scoring rules changed.

Added a regression that checks every campaign spawn and actual movement in all four directions with both tap and stick controls; 25 focused costume, combat and simulation tests pass. Browser QA confirms upward/back and downward/front poses. Refreshed web export and signed Android APK (current SHA256: `0b7ea5a4f1aad6a7205be61b6bf9bd18365a6cf23b4fce11cab51ad1f86552b2`).

### Follow-up: Archive Keeper side poses

The movement-index test above did not validate the artwork. A pixel audit found that Archive Keeper's right idle/walking frames (3 and 7) both faced left. Corrected these two frames and the source preparation recipe. Audited all 24 side poses across six outfits, with deliberately reversed-frame checks to verify that the validator catches this failure. The other five atlases, portraits, front/back poses, movement logic and replay rules are unchanged. The costume tests now also verify that each atlas matches its validated manifest hash.
