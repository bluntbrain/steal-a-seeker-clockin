# Guard sprites and music picker verification

Verified 2026-09-25 in the local exported web build.

## Music picker

URL: http://127.0.0.1:8787/design/soundtrack/index.html

Source: `design/visual-v2/soundtrack/index.html`. Exported by `scripts/build-music-preview.cjs`.

- All 12 current mission tracks and 3 earlier loops played: media ready, playback time advancing, no media errors. See `music-playback.json`.
- Playing another track pauses the previous player. Stop music pauses all players.
- Loop playback applies to all players.
- Shortlisting Crossfire persisted after reload. The test selection was removed afterward.
- The shortlist changes preview preferences only, not the game's soundtrack. Download-picks control is present; its downloaded output was not separately verified.

## Guard sprites

- Generated transparent patrol and Heavy PNGs; 512×512 production assets in `assets/guards-v2`.
- Same images loaded in gameplay, basic controls and mechanic lessons.
- Visually checked Heavy Watch at a 390×844 viewport, with patrol guards, drone and Heavy visible together. The existing smaller patrol/drone and larger Heavy sizes are retained.
- Gold shield faces forward; mint cell sits at the rear. Heavy tutorial faces left consistently with the demonstration.
- Screenshots: `heavy-lesson.png`, `gameplay.png`.
- No console errors captured during the gameplay check.
- TypeScript check and web export passed.
- 27 existing tests passed across guard defeat, worklet compilation, mission demo, mechanic demo and audio lifecycle suites.
- `git diff --check` passed.

No game physics, combat balance or soundtrack assignments were changed by this update. No Android APK was rebuilt or tested for this update.
