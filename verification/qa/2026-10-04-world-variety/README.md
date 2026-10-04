# Campaign artwork variety — 4 October 2026

- TypeScript check passed.
- Web export passed with all ten chapter images bundled.
- Full test suite: 392 passed, zero failures/skips.
- New regression verifies ten distinct backgrounds over 100 missions and 32 distinct illustration IDs. Existing geometry checks continue to cover road alignment, target separation at 296/366/540px map widths, partial blocks and continuous joins.
- Packer verifies matching top/bottom eight-row edge strips across every final image. All ten images inspected in `assets/campaign-world-v4/overview.png`.
- Browser at 390 × 844: inspected Meme Market, Portal Pursuit and Last Hideout, including chapter joins and level 100. Mission 61 in the local sample fixture reports the correct Staircase selection. New art does not cover mission numbers or targets.
- Static final imagery totals about 3.04 MiB. The existing FlatList remains; no new animation/update loop. No physical-device performance claim.

Local browser evidence is under `screenshots/`. This is map UI verification, not a new combat QA pass. No APK was created. Gameplay, backend and economy code were not changed.

## Crop correction after user feedback

The first atlas-based version had cut silhouettes and neighboring-cell fragments. Fourteen sprites were regenerated individually, including a standing Beeman replacement. The phone-bench Beeman is excluded from the final chapter configuration. Individual sprites now retain their complete bounds and receive a 24px margin; packing fails if a visible silhouette reaches an input edge. Final browser evidence is recorded separately from the initial screenshots.

Final correction check at 390 × 844: capsule near level 26 has no purple fragment; portal near level 86 has a complete top and base; fountain near level 43 shows the full courier; Beeman near level 95 stands on his boots with no phone seat. All four confirmed with browser screenshots (`fixed-capsule.png`, `fixed-portal.png`, `fixed-fountain.png`, `fixed-beeman.png`). Fourteen individual sprites passed visible-edge checks; matching seam-strip checks passed for all ten maps. Web export passed after regeneration; six layout tests and TypeScript passed after the Beeman replacement. No browser error logs; viewport override reset.
