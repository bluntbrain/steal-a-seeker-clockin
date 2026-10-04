# Minimal mission intro and defeat effects

Implemented on main after pulling Claude's account-response fix (6eac6ec) and code-47 receipt (2bce516).

## Mission introduction

Keep the mission map/detail selection. Replace the following information screen with one full-height illustrated demonstration, a fixed Play action and a small back control. Remove visible headings, paragraphs, step chips, captions, Watch Demo and pause controls. Screen-reader descriptions retain the lesson. The animation stops while backgrounded or starting, and reduced motion uses a static illustration. Artwork scales uniformly; surrounding floor fills the portrait frame without stretching characters.

## Defeat feedback

Four generated poses for each of three robot roles and seven bosses. Rendering changes only: impact/recoil, broken machinery or articulated fall, then a neutral readable wreck/body. Keep body evidence for unchanged guard AI. No blood and no axis compression. The basic-controls demonstration uses the same robot defeat sheet.

Ten coins per defeat, maximum eight bursts / 80 coins. Scatter reaches 1.55–2.30 world units in 140ms. Flights begin at 180ms, staggered by 12ms, and curve into the courier's live position. Six spin frames, six previous positions per coin, two batched gold trail paths and small arrival-driven mint rings. The last arrival is at 648ms and the effect expires before 800ms. Reduced effects use two small coins without trails or flashes.

Previously generated ElevenLabs scatter, magnet and absorb sounds are now integrated. Four preloaded voices. Phase events cross from UI to JS only at scatter, magnet and three collection groups, with overlapping cues merged. Pause/reset invalidates late audio callbacks. The old all-in-one loot track is removed to prevent duplicate sounds.

## Scope and verification

No simulation, combat balance, replay hash, scoring, credit accounting, API or database changes. Shared renderer applies to all campaign maps, including published levels. No APK or backend deployment is required to review the browser changes.

Evidence and exact test outcomes: `verification/qa/2026-10-04-defeat-fx/README.md`.
