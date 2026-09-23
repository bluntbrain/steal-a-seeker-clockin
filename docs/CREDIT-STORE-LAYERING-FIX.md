# Credits button layering fix — 23 September 2026

## Reproduced failure

In the user's browser, pressing the top-right credits badge had already set `creditsOpen=true`: Add Credits and its back button were present in the accessibility tree, but a screenshot still showed Hideout. The screen was opening underneath Hideout, not ignoring the tap.

EconomyProvider kept CreditStore's Modal mounted even while hidden. React Native Web's ModalPortal retains its position in the document. After skipping the optional opening offer, Game/Hideout mount after that portal; the later portal visually covers the older one. PhoneInspector can also mount later. Modal focus/active state alone does not reorder the visual layers. Repeated presses only set the already-true state again.

## Fix

Mount CreditStore only while open. Every open creates its portal above screens already present. Closing unmounts it, so later opens also get the correct position and a fresh pack-selection screen. Existing pending native orders remain in secure storage and are handled by the unchanged checkout reconciliation flow. No pricing, balance or transaction code changed.

## Verification

- Reproduced before the change using the actual browser page; Add Credits existed but Hideout was visibly on top.
- At 390 x 844, opened Add Credits after skipping the pass screen, from Missions, Hideout, the 3D phone viewer, Leaderboard, mission briefing and active gameplay.
- Checked actual hit-test ownership at screen center: the credits screen is on top (not merely present in the DOM).
- Three additional close/reopen cycles passed on Leaderboard.
- Back returns to the preceding screen. Gameplay pauses when its badge is pressed.
- TypeScript and all 240 game tests passed. Signed APK v0.3.16 (19), package com.bluntbrain.stealaseeker; existing distribution signature verified.
- No physical-device verification, wallet payment, production deployment or store upload was performed.
