# Weekly League and Seeker collection polish — 22 September 2026

## History

The old History tab displayed finalized past weeks only. A current-week completed run could contribute to Rankings without appearing in History. No score migration was needed.

`LeagueSummary.recentRuns` now returns the wallet's latest 30 weekly attempts, with mission, start date, verification status, outcome, verified score and time. Failed, abandoned, pending and expired attempts stay visible. Only verified wins receive points. Past weekly standings remain separate and final; campaign progress is not presented as weekly history. The same mapping serves the browser's existing local records.

Integration tests cover current-week visibility before finalization, anonymous/other-wallet isolation, past-week continuity and the normal scored-run lifecycle. Local tests cover nonwinning and nonverified records, practice exclusion and expiry.

## Layout and rules

There is one page scroller rather than a constrained middle scroller with a pinned results footer. Player position and the play action appear before the long rankings list. Three shorter mission cards have one full-width action each. Practice JSX remains commented out and its logic is retained. How to play is a dedicated view explaining three missions, five chances each, best-winning-run totals, time tiebreaks, Monday UTC resets and the cosmetic unlock. It explicitly states that token prizes are not active.

390×844: all three play buttons and the Ghost Signal unlock fit. 320×568: the page scrolls as one unit; the countdown no longer overflows. Long history/rank lists still scroll normally. Browser History displayed existing saved attempts, including the 7,979-point Ghost Freight escape; no player records were inserted or rewritten for this check.

## Seeker phones

One procedural hardware source (`src/three/seekerPhone.ts`) generates every edition: separate main camera, lower camera/sensor pill, flash, rear Seed Vault panel and lettering, three-bar Solana logo, antenna bands, side keys, front punch-hole, USB-C and speaker details. Rear components use outward-facing coordinates so the label is not mirrored. Edition colors and screen artwork remain distinct. These are reference-matched stylized models, not manufacturer CAD.

All 12 GLBs were regenerated with embedded display textures. All 216 native turntable frames were rebuilt at 512×640; each atlas is 3072×1920 and all twelve total about 1.56 MB compressed. Android still uses the safer raster turntable, with no live GL context. Opening pose shows the rear hardware. Front/back controls and error-free loading were checked in both browser live-3D and native-renderer preview modes.

## Verification and delivery

- TypeScript: pass.
- App tests: 214 passed.
- API tests: 74 passed against the dedicated local test database.
- Phone asset structural checks: 12 editions, 216 views, required hardware nodes and embedded textures present.
- Railway deployment: `24fd12d1-86c4-4e56-aab6-803da5b76b75`, SUCCESS. Existing production service only. `/health` returned mainnet healthy; `/league` returned the new anonymous-safe recentRuns field.
- Signed APK: `releases/steal-a-seeker-mainnet-v0.3.6-code9.apk`.
- Package: `com.bluntbrain.stealaseeker`; version 0.3.6, code 9.
- SHA-256: `e363b5c2b3e65dea7473083cfe143effe4a2edc3af2a98cbf8fb61cb3c74c714`.

The user chose to continue without the phone. This APK was not installed on a physical device or submitted to the dApp Store. No real payments were initiated.
