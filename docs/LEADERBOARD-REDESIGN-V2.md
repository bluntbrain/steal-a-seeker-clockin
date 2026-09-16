# Weekly League redesign

17 September 2026.

## Direction

The user requested a generated screen first, then a working screen based on it. Used `gpt-image-2.5-flare`, verified as available in their API account. Generated a 1024 × 1536 screen reference and a separate 1536 × 1024 podium asset. Preserved the charcoal/mint palette and existing courier identity.

Sources and prompts: `output/imagegen/leaderboard-v2/`. Runtime images and provenance: `assets/leaderboard-v2/`. Review page: `/design/leaderboard-v2/index.html` after `npm run export:web`.

## Implemented

- Rankings open first, with a compact Weekly League header and underline tabs for Rankings, Missions and History.
- A three-courier podium uses generated artwork. All ranks, wallets and points remain native text from the actual board.
- Dynamic rank labels preserve shared ranks. No baked-in podium numbers contradict a tie.
- Ranking rows use thin dividers and consistent point alignment. Top-three entries appear only in the podium; they are not duplicated below.
- Nearby rivals are shown from `board.nearby`. The personal row stays visible with its score and a points/time gap. Copy says “match” because matching a score alone does not guarantee promotion.
- Personal .skr display uses the existing account domain; the app does not invent other players' names or outfits.
- Your position, Share and Play weekly missions stay below the scrollable ranking area. Small screens use smaller hero art.
- The main bottom tabs retain their selected state and compact labels.
- Existing practice/ranked starts, payment, recovery, history and Courier Card flows remain in `WeeklyBoard`.
- Browser scores are labelled as local tests. Loading, no entries and unavailable states are explicit. No sample concept names, scores or token payouts enter the game.

## Review fixtures

`scripts/preview-leaderboard.tsx` imports the actual `WeeklyStandings` component with isolated review-only data. States: populated, empty, tied first place, long name, unranked, local test, loading and unavailable. This fixture does not call the wallet or write game storage. Its thin header is a review wrapper; the full app is verified separately.

Rebuild with `node scripts/build-leaderboard-preview.cjs` or `npm run export:web`. The generated gallery bundle and copied assets are ignored by git.

## Scope

No combat rules, map definitions, prices, payouts, backend schema or active weekly manifest changed. No API deployment is needed for this UI change. Phone detail findings and the inactive dash explanation are in `docs/PHONE-DETAIL-PLAN.md`.

## Verification

- TypeScript check and 156 tests passed, including preserved tied ranks, empty/partial boards and points-versus-time rival copy.
- Web export passed with unchanged rules checks.
- In-app browser responsive QA: populated/nearby and long .skr name at 390 × 844; tied #1/#1/#3 at 360 × 640; empty board at 320 × 568. Footer and dock stayed within the viewport. At 360 × 640, Play ended at y=543.5 and the dock at y=628.
- Full game at 390 × 844: Rankings → Courier Card → Back; Rankings → Missions → Ghost Freight preview → Practice → pause → return to league; History empty state. Practice retained the existing ranked chance count. The existing pause action is labelled Restart although it returns to the league for weekly runs; follow-up copy cleanup remains outside this redesign.
- Unavailable fixture disables Play. Long .skr row stays clear of its score. No browser warning/error logs during the checked full-game flow.
- Visual evidence: `design/visual-v2/leaderboard-v2/qa/` contains the actual local game screen, populated review fixture and tied-rank compact fixture. Fixtures are explicitly labelled.
- Signed ARM64 Mainnet APK built successfully. APK v2 signature verifies. All 193 source hashes match its receipt. SHA-256: `92906831c12bf7e9bbff4febca6632df90e1f4724d67d7b3adf2ad75bb85ec34`. The new APK was not installed or tested on a physical Android phone in this pass.
