# Weekly challenge variety — implementation plan

27 September 2026. No APK build in this task.

## Design

- Replace the single room family with 18 authored layouts: islands, divided lanes, staggered crossings, courtyards and vault approaches. Each has a clear starting pocket, reachable objectives and extraction, and alternate ways around cover.
- Seed the whole pack by the Monday UTC date. All players and retries get the same three missions. Use different layout families in a pack and exclude the previous four weeks' families. Bounded mirroring and objective choices provide further variation; do not promise infinitely unique maps.
- Randomize enemy counts and compositions within slot budgets. Opening contract: 3–4 active enemies; middle: 4–5; finale: 5–6. Each includes 1–2 reporting drones, with heavy guards introduced in the middle/finale. Double Haul uses one fewer active enemy in the middle/finale and caps drones and heavies at one each, because it requires two deliveries under a persistent alarm. Add 1–2 warned pickup reinforcements; reserves are scouts/sentries rather than extra armored guards. Keep movement and combat rules already supported by code 33; do not invent new AI abilities or change the replay engine.
- Sample only collision-checked patrol/roaming positions. Keep initial enemies at least six world units from the starting pocket and 2.6 units apart. Heavy guards retain front armor; drones report instead of firing. Use distinct briefing names and enemy counts so players see what changed.
- Rotate Blackout, Double Haul and Exit Window objectives across the three difficulties. Cosmetic scoring stays unchanged.

## Publication and compatibility

- Cutover is Monday 28 September 2026, 00:00 UTC (05:30 IST). Historical dates retain the old generator. Existing database manifests are immutable, including the current September 21 league.
- Read an existing week's stored manifest before generating. New weeks use one captured server timestamp, deterministic generation, and INSERT ON CONFLICT followed by readback.
- Keep the installed code-33 engine fingerprint unchanged. New maps are definitions using supported revision-13 mechanics, not new engine code.
- Use a localhost-only future-pack preview with isolated local records and a clearly marked week. Do not expose future competitive packs through a new public API. Previewing never issues a live ranked ticket or writes a production manifest.

## Checks before release

1. Generate 52 weeks: three distinct layout families per week, four-week repeat exclusion, varied enemy mixes/counts, unique geometry checks that ignore IDs and dates.
2. Verify all spawn/objective/extraction/patrol coordinates and connecting paths, distinct spawns, bounded enemies, and a safe initial window. Exercise existing drone/armor/pickup behavior.
3. Find ordinary-tap winning replays for the first scheduled packs and compare the current simulation with the pinned server verifier. Bot wins prove a route exists, not human difficulty or retention.
4. Test database publication, concurrent requests, Monday rollover, attempt budgets and old-manifest preservation in the local test database.
5. Export web. Click through the real weekly UI, inspect each new map, start missions and play. Save screenshots and observations. No wallet payment or production ranked attempt required.
6. Deploy only the API context to the existing Railway service. Compare live before/after manifest, verify the deployed source and next-week generator in local API tests, verify health and normal pricing. Push source/assets required by the current app; exclude private credentials, APK binaries and unrelated presentation/QA media.

## Shipped verification

- 342 app tests and 82 backend tests pass; TypeScript and web export pass.
- 52 weeks / 156 missions exercise all 18 families, 63 distinct wall geometries and 13 enemy-count compositions. The first six missions have ordinary-tap winning replays with exact pinned-verifier parity.
- Browser tested at 390 × 844: all three upcoming layouts, briefing/start flow, movement/pursuit, losses saved to History, chance deductions and persistence, a second week's different pack, and local-preview isolation.
- Fixed two presentation issues exposed by playtesting: terminal runs can no longer open Pause (including Escape), and exit countdowns show time until the next open/closed transition.
- Railway deployment `c9cd3c72-d8fc-4c53-ba94-66e252572e9c` succeeded. Remote generator/layout/publisher hashes match local source. Anonymous before/after manifests match exactly for the current week; health is Mainnet/OK and `testPricing` remains false.
- Existing published v0.3.30/code33 engine fingerprint is unchanged. No APK was built. No physical-device, live-wallet payment or live-ranked attempt was made here. The new browser UI labels and timer/pause fixes await the next APK release.
- Local evidence: `verification/weekly-v3/index.html`. Preview: `http://127.0.0.1:8788/?weeklyPreview=2026-09-28&build=weekly-variety`.
