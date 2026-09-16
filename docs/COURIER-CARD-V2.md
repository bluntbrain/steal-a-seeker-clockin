# Courier Card v2

17 September 2026. User request: regenerate the card using GPT Image and implement it with the proper data.

## Design

New GPT Image 2.5 Flare illustration: the courier holding a Seeker beside a mint-lit vault. Kept the existing charcoal/mint palette. Full portrait export is 1080 × 1620, matching the artwork's 2:3 proportions without squashing or cropping the courier.

The artwork contains no names, ranks or numbers. `cardLayout()` supplies one text layout for the Android component, web SVG preview and PNG export. Embedded artwork makes web export self-contained. Native sharing waits for the background to load.

## Data

- Name: currently verified `.skr` from the league summary, or shortened wallet. Local names are explicitly unverified examples.
- Rank: the server rank, including ties. Participant total comes from the selected board, including historical boards. Browser data displays TEST, never a fake #1.
- Total points: `board.personal.points`; missions cleared: `board.personal.cleared / 3`.
- Total time: `board.personal.ticks / 30`, formatted as minutes, seconds and hundredths. This is the sum of the counted best runs, not total play time or every attempted run. The card states “Best completed run per mission.”
- Week: selected board's Monday through Sunday, displayed in UTC. Handles month and year boundaries.
- Status: Live standing / Final result / Local test. Live exports say rank can change.
- Ghost Courier title: requires the record's earned flag and all three missions cleared. Local completions retain the TEST qualifier.

Removed the obsolete “Devnet test season” footer, “contracts” wording and old flat drawn phone. The card does not promise token rewards. No scoring, payment, backend or weekly rules changed.

## In-app flow

Leaderboard → Share → card preview → Share image or Save image. The optional `.skr` editor is folded initially. Sharing uses the existing Android OS share sheet, so the player can choose Telegram, X or any supported app. Web downloads PNG when file sharing is unavailable. No automatic social publishing.

## Files

- `src/league/card.ts`: shared layout, labels, validation/escaping, export geometry.
- `src/league/CourierCard.tsx`: native and web preview, artwork load signal.
- `src/league/shareCard.ts` and `.web.ts`: consistent export dimensions and filename.
- `assets/courier-card-v2/`: compressed and embedded artwork plus provenance.
- `/design/courier-card-v2/index.html`: isolated review states, native component comparison and sample PNG download.

Prompts: `output/imagegen/courier-card-v2/reference.prompt.txt` and `background.prompt.txt`. Final background: `output/imagegen/courier-card-v2/background.png`.

## Checks

- TypeScript and 160 tests passed, including data totals, local/final/empty states, UTC rollover, frame timing, XML escaping and safe filenames.
- Exported sample PNG through the actual browser download function; confirmed 1080 × 1620 with embedded artwork and readable fields. Sample values are isolated from live game storage.
- Full game on web: Leaderboard → Share opened the card with the existing 7,979 points, 1/3 missions and 00:20.83. Local status stayed TEST. The optional name editor expands/collapses; Save produced the new 1080 × 1620 PNG.
- Native component reviewed through React Native Web, including a long .skr name. This checks layout, not physical Android font rendering or the Android share sheet.
- At 360 × 640, Share and Save remained visible (y=525–566). At 390 × 844 the whole normal card flow fits with the name editor folded. No game score or identity data was changed during review.
- New Mainnet ARM64 APK built successfully. Source receipt matches and the generated artwork is present in its bundle. SHA-256: `558d1a683e943edfc8886707ec8725c3aadb815c3a2ce6a821c3ac6cde42638b`. Not installed or physically tested in this pass.
- Final review exports: `design/visual-v2/courier-card-v2/sample-live.png` (labelled sample in gallery) and `actual-local-card.png` (actual local game record).
