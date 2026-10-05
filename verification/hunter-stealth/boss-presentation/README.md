# Boss presentation verification, 2026-10-05

## Shipped presentation

Seven boss-specific 900 x 1600 2D loading posters, seven 4 x 2 firearm sprite atlases, idle fallbacks, face-reveal entrance with Skip and actual reward stakes, portrait health band, per-boss visual cues, draw-boss-last ordering, gentle idle breath, and the two-second BOSS DOWN ribbon. The existing heavyKO sound handles boss defeat. Existing bossKill haptic classification was verified in GameScreen; no new haptic call site was added.

All seven bosses already shoot in heist-guards-v17.ts. Akshay fires a burst of three projectiles. His text and marks therefore describe shots, not knife slashes. Courier knife rules are unchanged. No slow motion was added because simulation/replay timing must stay unchanged.

## Automated checks

- TypeScript typecheck: pass.
- npm test: 404 passed, zero failed, zero skipped (46,536 ms on this host).
- npm run rules:check: pass without generating a manifest.
- Web export: pass.
- git diff --check: pass.
- No changes to src/game, shared/campaign-*.ts, shared/replay.ts or server/replay.ts.
- Changed source files remain below 500 lines. The only new presentation source file is BossHealthBand.tsx. Existing localhost-only lab screens were extended for repeatable review.

## Browser checks

Chrome, 390 x 844 CSS pixels. The existing localhost testLevel=15 route was used instead of writing campaign progress into localStorage. No rewards were claimed and no account progress was seeded.

- Actual level 15: poster loads, entrance plays, Skip starts gameplay, boss and portrait health band render. Manual floor taps move the courier; guards react and shoot. This manual run ended with the courier defeated, not a completed boss kill.
- Dedicated presentation fixture uses the production GuardLayer, BossEntrance, BossHealthBand and BossDownRibbon with explicitly controlled states. It does not run a scored mission or write progress. All seven boss tells were triggered; transient Mert flash is covered by the pure fade test, but its peak was not reliably captured in a still image.
- Low health fixture: bar turns red at 35 percent. Defeat fixture: health band hides and BOSS DOWN appears then expires. Reduced effects: radio rings and special auras disappear.
- No error-level browser console messages were returned during gameplay or fixture checks. Physical-device haptics and Android performance were not tested. Audio routing is verified by code/tests; browser tooling did not validate audible stinger quality.

## Screenshots

- entrance-game.png: actual level 15 entrance, captured during the incoming jump.
- boss-health-game.png: actual level 15 boss and health band.
- entrance-fixture.png: controlled entrance capture.
- toly-radio-fixture.png and *-tell-fixture.png: controlled signature states. They are not proof of winning a real mission.
- low-health-fixture.png: red health band.
- defeat-fixture.png: two-second ribbon and hidden health band.
- reduced-effects-fixture.png: pulses disabled.
- loader-toly.png: clean phone-sized loading poster with app-rendered progress.
- loader-*.png: other boss posters with visible lab controls.
- poster-contact.png and sprite-contact.png: visual inspection of all final exports. Alpha was also checked against an opaque dark background; a transparent-preview artifact was not present in composited output. Packing now finds transparent column gutters so Lily's barrel is not cut between cells.

## Performance measurements

The initial actual level 15 sample reported 28 FPS, p95 66.6 ms and 641 slow frames (performance-initial.png). The initial sample did not meet the requested p95 below 10 ms. A fresh 54-second level 15 sample then reported 120 FPS, p95 9.6 ms and zero slow frames (performance-final.png), meeting that threshold. This second sample stayed at spawn; it is not a sustained combat stress test. These metrics sample requestAnimationFrame intervals, not isolated render-work duration; a normal 60 Hz frame is approximately 16.7 ms. The host also had substantial unrelated CPU load, including an Android emulator around 480 percent CPU. No baseline comparison was taken, so these numbers do not establish a regression or prove the new effects are free. Do not treat this as a mobile performance sign-off.

No APK or backend deployment was performed. The rules hash is unchanged.
