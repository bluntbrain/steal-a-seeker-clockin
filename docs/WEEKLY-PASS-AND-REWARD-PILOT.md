# Optional opening pass and reward pilot — 23 September 2026

## Verified current service

Production API: https://seeker-api-production-41b3.up.railway.app

- Mainnet receiving wallet, checked against the production MAINNET_TREASURY variable: `BNgBygzFkVLGw4ipkxXgt2kuNcME1YdAE2hK5s81ogdn`.
- SKR mint: `SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3`.
- TEST_PRICING is still true. Current pass targets: 1 SKR OR USD 0.10 converted to SOL and rounded upward. These are separate price settings, not equivalent USD prices. Normal targets remain 500 SKR OR USD 10 in SOL. No settings changed in this update.
- A pass is a one-time wallet entitlement, not a weekly subscription.
- Three server-generated missions are frozen for each week. Everyone gets the same conditions. Five starts per mission; unsuccessful, abandoned and expired starts count. Extra attempts cannot be bought.
- Best verified successful run per mission contributes to the weekly total. Each run scores 5,000 completion points plus up to 3,000 time points and up to 2,000 remaining-health points. Faster aggregate time breaks point ties; exactly tied scores/times share a rank (wallet order provides deterministic display positions).
- Weekly reset is Monday 00:00 UTC (05:30 India time). Historical standings finalize after the grace period and pending verifications, when the league is accessed. Completed runs appear in recent history before final weekly archiving.
- Clearing all three earns the Ghost Courier outfit. Campaign remains free. The practice implementation remains internal; removed practice buttons were not restored.
- **Weekly token settlement does not exist.** League archive writes history and achievements, not transfers. Existing campaign/other return workers are separate. Funding the wallet does not activate weekly prizes.

## Recommended $100 pilot — proposal only

Four weeks: first $10, second $6, third $4 per week = $80; reserve $20 for fees, price movement or another week. The earlier $30/$20/$15 idea consumes $65 per week and cannot sustain two weeks on $100.

Buy/fund only the prize portion in SKR initially; retain reserve and keep SOL in the treasury for transaction/account fees. Before the first prize week, fix and publish actual SKR quantities, dates, eligibility and exact tie treatment. Their dollar value then floats. Do not advertise perpetual dollar rewards from a finite token balance.

Before activating payouts: implement a funded per-week prize schedule and idempotent settlement ledger; require final server-verified standings; decide the exact-tie split; exclude operator/test entries; record transfer signatures and reconcile ambiguous sends rather than paying twice. Publish rules before entries and show the actual funded schedule in the app. No automatic transfers or prize promises were enabled here.

## Opening screen implementation

Reuses the existing Paywall trailer and art. Corrected the obsolete campaign paywall copy to weekly access. Small Skip has a 44px touch target. It works offline without wallet connection. Session dismissal persists through account refresh/wallet changes; existing pass owners bypass the offer. New cold launches show it to non-owners. Mission QA deep links bypass it.

Get Game Pass opens the existing full-screen checkout. No wallet connection or order starts automatically. Existing MWA sign-and-send checkout is unchanged. Trailer pauses behind checkout. Back returns to the offer; verified ownership bypasses it. Browser purchases remain explicitly labeled demos.

Prices displayed on native opening screen come from the backend catalog; checkout obtains a fresh executable quote. If catalog is unavailable, screen shows “Live price at checkout”; Skip remains available. No fixed reward payout claims are displayed.

## Verification

- TypeScript passed; 240 game tests passed, including optional-offer conditions. Rules/weekly-engine hashes remain unchanged.
- Browser: confirmed owned account bypass; fresh origin shows offer; checkout/back/Skip work; existing saves untouched; mobile viewport inspected.
- Signed Mainnet APK v0.3.15 (18), verified package com.bluntbrain.stealaseeker and existing distribution certificate.
- No physical phone payment test or store upload was performed. Backend unchanged; no deploy necessary.
