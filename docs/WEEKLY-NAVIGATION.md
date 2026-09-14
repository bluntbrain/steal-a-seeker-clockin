# Weekly leaderboard and navigation — 14 September 2026

## Shipped behavior

- Three bottom tabs: Missions, Leaderboard, Hideout. Original 21dp icon artwork with labels, mint selected pill, stronger selected text, and screen-reader selection state. Tabs stay off the playable screen.
- A weekly leaderboard card sits above the district map; it opens the full leaderboard. Daily-run return opens Leaderboard again. Wardrobe and rewards live in Hideout; settings stays in the header. Closing these panels returns to home when opened there.
- Original navigation artwork is in `assets/navigation`: editable SVG masters plus 72px PNGs for both platforms. Regenerate with `scripts/build-navigation-icons.cjs` using Playwright/Chrome.
- Mission imagery uses aspect-preserving cover instead of stretching on short screens. Hideout scales to leave room for the bottom navigation.

## First weekly rules (implemented, not the proposed three-contract league)

The API exposes `GET /weekly/leaderboard`, optionally authenticated to include personal rank and nearest better rival. A week runs Monday 00:00 UTC through the next Monday, exclusive. Existing replay-verified daily runs contribute automatically, using the run's issued challenge date. Only successful, verified extractions count.

Take the highest-scoring successful run per wallet per day; when those scores tie, take the faster one. Add up those daily best scores across seven days. Higher weekly points rank first; lower total ticks breaks a tie. Exact ties share rank. The response includes the top 50, personal standing, nearest better rival, contributing day count and total participants. There is no schema change or new payment.

Daily routes still rotate from the existing twelve missions. Repeating a day improves its best result rather than accumulating attempts. A missed day contributes zero. Attempts remain unlimited with campaign access. Weekly ranks have **no token prizes**; the existing campaign purchase and completion terms have not changed.

The browser shows **only local practice results**, explicitly labeled, and does not claim global rank. Android shows the service's verified leaderboard. Neither mode inserts fictional opponents or prize pools. Standings can be browsed without prompting a wallet sign-in.

## Validation

- TypeScript check passed; 110 client and 57 server tests passed.
- Added checks for Monday/year-boundary rollover, best-per-day aggregation, faster-run selection, exclusion of other weeks/unverified/failing runs, shared ties, rival ranking and the public endpoint.
- Browser checked at 360×640, 360×797 and 390×844: tab selection semantics, bounds, selected colors/icons and screen content. Checked return from daily challenge and wardrobe.
- Screenshots: `verification/weekly-navigation/`.
- Railway deployment `a3d30205-9150-488a-b63b-76fd5919b887` succeeded. Live read returned the current week with zero participants, correctly represented as an empty board.
- Signed devnet APK rebuilt. No USB device was connected; physical installation and testing of this build remain pending.

## Still separate work

The audience proposal's three weekly contracts, limited ranked attempts, funded prize pools, earned Master cosmetics and verified Seeker IDs are not part of this UI release. Weekly ranking here uses the existing daily challenge, so there is a working return loop now without promising those features.
