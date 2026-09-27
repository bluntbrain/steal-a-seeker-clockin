# Enemy sight and selected soundtrack — 25 September 2026

## Plan and implementation

Give each enemy class a distinct field of view while keeping detection and the rendered cone in agreement. Author the values in campaign definitions so published weekly definitions keep their original sight settings. Keep pursuit, radio reports, damage and movement unchanged.

| Enemy | Sight distance | Full cone angle |
| --- | --- | --- |
| Drone | Existing 5.2–6.2 tiles | Existing 120° |
| Normal scout / sentry | 80% of district baseline, 4.16–4.96 tiles | 95° |
| Heavy / Warden | 60% of district baseline, 3.48 / 3.72 tiles in their current missions | 75° |

`heist-layouts.ts` applies the profiles to every authored patrol and pickup reinforcement. `GuardLayer` and `sees` already read the same range, half-angle and wall occlusion. Alerted enemies retain their existing contact tracking and team pursuit; this change makes initial detection and flanking more readable.

Only music tracks 2, 3, 4, 10 and 12 are imported by the game. The mission sequence is 2, 3, 4, 10, 12, 2, 3, 4, 10, 12, 3, 12. Weekly maps use the same selection by level number. The listening page now lists only these five tracks and shows their mission assignments. Earlier source recordings are retained in the repository, but excluded from the gameplay bundle and listening-page export.

Selection data: `assets/music-v1/selection.json`.

## Compatibility and verification

- A new immutable rules bundle was generated. The weekly engine fingerprint did not change because this is authored campaign data, not an engine change.
- Codes 29–32 keep their original campaign credit thresholds and archived verifier.
- 65 checks passed for vision edges, walls, pursuit, drone reporting, old replay compatibility, audio selection/lifecycle and worklet compilation.
- All 12 campaigns were completed by an ordinary-input solver and their replays matched the new pinned verifier. This checks solvability, not human difficulty.
- TypeScript, web export and `git diff --check` passed.
- Exported audio content hashes confirmed that precisely the five selected tracks are bundled.
- The updated listening page and Heavy Watch were checked in the browser. No gameplay console errors were captured.
- Evidence: `verification/qa/2026-09-25-role-vision-music/`.

Local web preview updated. No APK build, production backend deployment or store upload was performed. Deploy the matching rules bundle before releasing an APK with these campaign changes.
