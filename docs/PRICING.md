# Change prices from Railway

Open Railway → steal-a-seeker-clockin → production → seeker-api → Variables. Edit the settings below and apply/deploy the changes. The same backend serves all installed apps; price edits do not need an APK rebuild after version 0.3.3. There is no in-app admin panel or unauthenticated pricing write endpoint.

## Game Pass

| Setting | Value | Meaning |
|---|---:|---|
| TEST_PRICING | false | Normal prices active since 25 September 2026. Set true only for reduced-price testing. Does not change Mainnet to devnet. |
| GAME_PASS_SKR | 500 | Live pass price in SKR |
| GAME_PASS_USD_CENTS | 1000 | Live pass price in SOL targets $10 |
| TEST_GAME_PASS_SKR | 1 | Test pass price in SKR |
| TEST_GAME_PASS_USD_CENTS | 10 | Test SOL pass targets $0.10 |

For a $15 SOL option, set GAME_PASS_USD_CENTS=1500. Change GAME_PASS_SKR separately if you want a different SKR option. Fixed 500 SKR and $10 SOL are two prices, not an assertion of equal market value. SOL and USD equivalents use the price feed, and quotes round upward to supported token increments. Network fees are separate.

## Credit-pack payments

Set CREDIT_PACK_USD_CENTS_JSON for the live profile:

```json
{"credits-500":100,"credits-1500":250,"credits-3500":500}
```

Set TEST_CREDIT_PACK_USD_CENTS_JSON for the test profile:

```json
{"credits-500":1,"credits-1500":2.5,"credits-3500":5}
```

Values are cents, so 250 is $2.50 and 2.5 is $0.025. Live overrides must be positive whole cents; test overrides allow up to two decimal places in cents. Overrides are exact targets and are not divided again. SKR and SOL checkout quotes use the same dollar target. The number of credits in each existing pack stays fixed; these variables only change its purchase price.

If a pack is omitted, its live default is $1 / $2.50 / $5 divided by SHOP_PRICE_DIVISOR (normally 1). Test defaults are those original values divided by 100. Keep explicit maps in Railway for predictable editing.

## Outfit and trail costs in credits

STORE_CREDIT_PRICES_JSON controls both profiles:

```json
{"night-courier":300,"signal-runner":400,"circuit-scout":500,"archive-keeper":600,"escape-trail":300}
```

These are game credits, not SKR. signal-runner is the internal identifier for Frost Runner. Retired gear, unknown identifiers, zero, negative, fractional credit costs and values over 100000 are rejected. A malformed config fails startup instead of silently creating free purchases.

The app refreshes the catalogue when opened/foregrounded, on tab changes, and when the credit store opens. Checkout reads current backend token quotes. If a credit cost changes while a buyer is looking at an older price, no credits are charged; the app refreshes and asks the buyer to review again. Guest play can work offline with bundled defaults or the current session's last fetched prices. Signed-in wallet inventory always uses server validation. Browser preview purchases remain local demos.

## Existing purchases

An existing token-payment order retains its exact snapshotted amount, currency and conditions. Changing a price does not rewrite pending transactions or charge previous buyers again. Previously purchased access, outfits and credits remain owned. The pass remains one purchase per wallet.

Version 0.3.2 already supports backend pass and checkout prices, but its store tiles use bundled values. Version 0.3.3 adds dynamic credit-pack tiles and credit redemption costs. For older apps, changing an outfit cost rejects stale redemption requests rather than charging an unseen price; update to 0.3.3.

Do not change treasury keys, mint, network, credit rewards or prize settings to adjust prices. Weekly token prizes remain inactive. Normal pricing was enabled on 25 September 2026 with TEST_PRICING=false and SHOP_PRICE_DIVISOR=1. Public catalog and checkout pricing were read back successfully: Game Pass 500 SKR or $10 worth of SOL; credit packs $1/$2.50/$5; regular outfits 20 SKR; Solana character skins 100 SKR, with SOL conversions available.
