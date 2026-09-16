# Mission screen redesign

Reference: `../assets/seeker/12-missions.jpg` in the Clock In workspace. Implemented September 17, 2026.

## Layout

- Three floating district scenes replace the boxed mission grid: Warehouse, Rooftops, Powerworks.
- All 12 numbered mission buttons sit over the artwork. Routes, stars, locks and the next mission use live campaign progress.
- The art uses uniform contain sizing. Buildings are not stretched or clipped to fill a card.
- A compact header shows stars and campaign completion. A single footer continues the next mission.
- Missions, Leaderboard and Hideout remain reachable from the bottom navigation. Short screens use a smaller header and tab bar.
- The mission briefing shows the actual playable map, patrol count, alarm reinforcements, target time, phone and one Play button. Its hint comes from that mission's current combat briefing.

## Assets

`assets/district-map/` derives from the existing generated district scenes. The preparation script removes the connected dark outer background and unused margins. It keeps the interior art and records source crops in `frames.json`. Source images remain unchanged.

## Verification

- TypeScript check and web export passed.
- Firefox Responsive Design Mode: final map inspected at 320 × 568 and 390 × 844. All 12 buttons and bottom navigation fit without scrolling. Artwork stays contained.
- The final briefing was inspected at 390 × 844; a small-screen briefing was also checked during layout work.
- Mission 1 opens its briefing and starts the playable tutorial. Returning to missions and the district map works.
- Mission 12 opens a locked briefing; Play is disabled.
- Browser testing used the local preview and demo credits. No real payment was made.
- Screenshots are in `verification/district-map/`.

Android: the first release build timed out in AAPT2 while crunching an existing district image. Retried with optional PNG crunching disabled and two workers for this build only. See the build receipt for the resulting artifact. No physical device was connected, so installation and on-device visual verification remain pending.

This change does not modify combat rules, payment flows or backend storage.
