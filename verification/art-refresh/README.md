# Art refresh verification — 4 October 2026

## Scope of the existing PR

PR #1 (`hunter-stealth`) already introduced guard revision 17, suspicion/local alerts and finite pursuit, persistent bodies, top-down courier/boss rendering, 88 published levels after the 12 authored missions, campaign leaderboard and the revised pass bundle. This follow-up changes only artwork and presentation. It does not implement another balance or AI revision.

## Checks

- TypeScript check and web export pass.
- All 376 existing client tests pass. Three new layout tests pass at 296, 366 and 540px map widths using the full bundled campaign: unchanged order, exact source aspect ratio, continuous scene offsets, crossfade overlap, target spacing and bounds.
- `npm run rules:check` passes; no simulation, server, campaign definitions, rewards or rule manifest files changed.
- Browser at 390 × 844: scrolled the illustrated campaign, opened the locked Mert boss briefing and verified its Start button remains disabled, returned to the map, launched level 13 through its teaching screen, moved the courier and observed one guard takedown (1/4), paused and returned to missions.
- Final browser pass: seven missions visible at 390 × 844, no district partition or campaign/share/continue clutter, natural-size artwork, smooth overlapping scene fade, and level 8 node opens an enabled Play briefing. No browser errors observed.
- Screenshots capture the district artwork and the gameplay check. Real Android frame rate and native texture memory were not measured; no APK was built for this update.

## Asset budgets

Three world WebPs and six courier atlases total approximately 1.7 MB. Source PNGs are retained for future editing but not imported into the app. The map virtualizes nearby full scenes, uses three shared background textures and a smooth alpha crossfade. Each image keeps its 1:3 aspect ratio. Nodes follow the painted road without a separate overlay line; the campaign/share header, district banners and free-campaign footer are removed.

## Reproduce

1. `npm run export:web`
2. `node scripts/preview.cjs`
3. Open `http://127.0.0.1:8787/?build=world-art-v3`.
4. Scroll through districts, select a locked boss, return and start an unlocked level. The giant scenes are decoration; actual combat behavior is unchanged.

Prompts, source/output manifest and regeneration instructions are in `assets/campaign-world-v2/`.
