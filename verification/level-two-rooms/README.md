# Level 2 reference layout — 2026-10-02

Rebuilt `cone-lesson` around the two supplied screenshots: a vertical left service lane, staggered small cover blocks, two large rooms on the right with separate entrances/exits, a small upper vault room, and cargo stacks in the upper yard. The courier starts at the bottom entrance and returns there after retrieving the Seeker from the upper vault. Existing warehouse materials and enemy balance are retained.

Door gaps are open walkable floor. The alternate right lane is wide enough for the actual collision radius and half-tile navigation grid. The covered route loops through the lower room and around the right side; the faster route runs up the exposed service lane.

Validation:
- 367 game tests passed, including navigation of all campaign targets/guard anchors and replay-verified winning input sequences for all 12 missions.
- New dedicated doorway checks cover the upper vault and both doors of each right room.
- Level 2 solver completed using ordinary recorded taps: 446 ticks, 50 HP, two defeats, score 8787. This proves reachability, not human difficulty or enjoyment.
- TypeScript, rules-manifest check and web export passed.
- All other 11 authored campaign definitions compared equal to their previous definitions.
- New archived replay rule bundle generated; weekly engine fingerprint unchanged.
- Browser at 390 x 844: visually checked layout, tapped through lower room entrance and alternate exit. See screenshots.
- No APK built and no production backend deployment performed in this task. The new rule bundle must be included in the backend release before production clients use this map.
