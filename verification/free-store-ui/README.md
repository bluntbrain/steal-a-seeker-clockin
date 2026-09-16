# Free campaign and store QA — 17 September 2026

Browser tests used an isolated localhost:8789 origin, not the user's saved localhost:8787 game. Purchases below were browser demos, with no real token transfer.

## Actual UI checks

- Fresh campaign opened without wallet/paywall. Eight visible tutorial taps completed First Pickup: three stars, 17 seconds, 100 health, 150 credits.
- Next mission immediately opened Blind Corner. Reload preserved mission progress and 150 credits.
- Credit checkout cancellation kept 150. One 500-credit demo pack produced 650. Night Courier redemption cost 300, leaving 350. Unequip/re-equip kept ownership and 350. Escape trail cost 200, leaving 150.
- Reload preserved both items and 150 credits.
- Weekly practice launched before buying a pass and kept 5/5 ranked chances.
- Leaderboard Game Pass checkout was a full screen. Demo unlock did not spend credits. Done returned to leaderboard. A ranked start was available and launched; leaving used exactly one chance, showing 4/5.
- Hideout, its collection and the credit-pack screen fit at 360×640 with all actions visible; reviewed again at 390×844. No browser runtime errors were reported after final reload.

## Automated and build checks

- TypeScript: passed.
- Client/game: 164 passed, none skipped.
- Backend/PostgreSQL: 69 passed, none skipped. Includes signed auth, wallet isolation, duplicate callbacks, durable payment recovery, credit pack repeat purchases, atomic redemption, unequip, insufficient funds, forged progress and replay-based credit rewards.
- Campaign audit: 1,296 trials; all 12 solvable; campaign save/unlock chain completed. Detailed policy outcomes are in `../campaign-free-v3-final/` and the product plan. Not a human win-rate estimate.
- Mainnet arm64 signed APK built successfully. Latest SHA-256/source receipt is in `releases/steal-a-seeker-mainnet.apk.json`.
- Existing Railway API deployment `93068c44-4ddb-439e-b56c-59c964fc6071`: SUCCESS. `/health` confirmed solana:mainnet. Live read-only pricing/catalog returned the new products and TEST_PRICING enabled. The observed pass quote was 1 SKR or 0.0011 SOL; rates fluctuate. No mainnet purchase was made by this QA run.

## Limits

Physical Android/Phantom approval and transfer, native frame pacing and long-session audio/haptics still need device testing for this revision. Weekly token prizes and health upgrades are not implemented or advertised as active. Guest training restored from checkpoints cannot be treated as a complete server-verifiable replay.
