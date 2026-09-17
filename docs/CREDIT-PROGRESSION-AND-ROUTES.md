# Credit progression and movement route — 17 September 2026

## Earning and spending

| Result on a campaign mission | Total earned for that mission |
| --- | ---: |
| First clear, one star | 50 credits |
| Two stars | 55 credits |
| Three stars | 60 credits |

The cheapest paid outfit, Night Courier, costs 300 credits. Escape trail now also costs 300; other purchasable outfits cost 400, 500 and 600. Starting from zero and saving credits, the first purchase takes five three-star clears or six one/two-star clears. The default outfit remains free; Ghost Signal remains earned through weekly completion.

Rewards apply once per distinct campaign mission. Improving an earlier result adds only the missing 5/10-credit star bonus. A perfect twelve-mission campaign earns 720 credits. Replaying a completed result does not farm currency. Existing balances and owned cosmetics remain untouched; old rewards are not clawed back.

Credit packs remain 500 / 1,500 / 3,500 credits. Android checkout uses the existing SOL/SKR quote and Mobile Wallet Adapter approval flow. Only a verified payment receipt credits the wallet, with idempotent ledger entries. The browser labels its separate demo-credit flow. Buying credits does not buy ranked attempts or stronger weekly stats.

`shared/store.ts` is the common reward/price definition used by the app and backend. Native mission rewards still require a successful server replay. Guest saves can sync verified replays after connection. No database reset or new migration is required.

## Route appearance

Reference: [Hunter Assassin gameplay](https://www.youtube.com/watch?v=raDBMEIr6Uo), paused around 6:08. The frame shows a continuous outlined route, a softened bend and a triangular destination arrow. The screenshot is in `verification/credit-route-ui/hunter-reference-6m08.png`.

- Kept the game's mint and charcoal palette.
- Replaced the faint dashed path with a solid mint line, dark outline and light centre.
- Rounded turns with quadratic curves. Rounding reduces near walls and closed gates.
- Added a destination arrow and reduced the target radius from 0.50 to 0.22 world units.
- Route begins at the interpolated courier position for smooth rendering between simulation ticks.
- The path disappears after completion. This is display geometry only; movement, collision, combat and ranked replay rules are unchanged.

## Verification

- 184 game/client tests, including five/six-clear affordability, duplicate clears, old balances, curved-corner clearance and arrow orientation.
- 70 backend tests, including verified mission credits, duplicate receipts, paid packs, wallet isolation and concurrent redemption. One full rerun was needed after a local database connection timed out during heavy machine load; the rerun passed all 70.
- TypeScript and rules-manifest checks pass. No weekly rules migration.
- Browser QA at 390×844 and 360×640: long path around several walls, small target, outfit credit progress, credit-pack checkout and cancellation. Cancelling kept the original 25-credit test balance.
- Fresh signed mainnet APK built. Physical Android play and a real-money purchase were not performed in this change.

Screenshots and deployment/build receipts: `verification/credit-route-ui/`.
