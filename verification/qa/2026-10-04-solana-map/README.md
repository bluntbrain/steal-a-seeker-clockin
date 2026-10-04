# Campaign map v3 verification — 4 October 2026

## Automated checks

- `npm run typecheck`: passed.
- `npm run export:web`: passed.
- `npm test`: 391 passed, zero failed/skipped.
- Five campaign-layout checks cover all entries exactly once, node centers on the shared road, 1:3 aspect, contiguous sections, non-overlapping tap/label regions at map widths 296/366/540, matching boundary direction, and stable existing positions when a partial block gains missions.

## Browser interaction

Checked the exported app in the Codex browser:

- 390 × 844: preview positions for levels 1, 11, 21 and 100; all three background variants, current/locked/completed nodes, readable giant portraits, road/button alignment, and smooth scene joins.
- 320 × 568: loaded the page at narrow dimensions; nodes, labels and scenery remain inside the viewport. About five missions visible; no stretched artwork.
- Clicked the Chase mission in the sample fixture; selection reported level 21 correctly.
- Real app at existing saved progress: current level 13 appeared on the road. Tapped level 13 → Offset Gates briefing, then Back to district map → map returned correctly.
- Scrolled the real map across levels 20/21; no partition, road break or color seam visible.
- No browser error logs captured during the check.
- Temporary browser viewport overrides reset after testing.

Local screenshots (ignored media): `screenshots/map-320.png`, `screenshots/live-map-390.png`, `screenshots/section-join-390.png`.

This was web verification. No APK, physical Android device test, or new frame-rate measurement was performed. The existing virtualized static-image rendering path is retained; the three shipped backgrounds total about 899 KiB.
