# Dense campaign maps

Updated 17 September 2026. The request is **more walls, with the existing colors**. The lighter reference-inspired renderer was discarded. `GameCanvas`, `GuardLayer`, the floor images and the original materials are unchanged.

## Layout changes

Campaign missions 2–12 use authored tile layouts in `src/game/combat-levels.ts`. Adjacent solid tiles merge into rectangular colliders. Art, navigation, vision and shooting use the same footprints. The first mission retains its guided route, with additional perimeter cover.

| Mission | Route design |
| --- | --- |
| 1 · First Pickup | Guided entry, framed by larger cover blocks |
| 2 · Blind Corner | Long central wall, two crossings, protected entry |
| 3 · Crossfire | Interlocking cargo aisles and offset crossings |
| 4 · Loading Lockdown | Serpentine lanes with side pockets |
| 5 · Skybridge | Three roof lanes with crossings on alternating sides |
| 6 · Heavy Watch | Machinery court with two outer flanks |
| 7 · Split Route | Divided spine and side rooms |
| 8 · Twin Relay | Two phone bays linked by a transfer corridor |
| 9 · Dark Circuit | Reachable switch room and a sealed phone vault |
| 10 · Vault Window | Two loops leading to timed extraction |
| 11 · Security Grid | Offset checkpoints that break straight edge routes |
| 12 · Last Seeker | Four chambers, a Warden lane and return flanks |

The visual reference informed wall density, broken sight lines and corner routes. These are authored layouts, not traced frames. The supplied video was sampled at approximately 1:14, 4:29 and 7:34; this was a geometry review, not a complete video or sound audit.

Existing district colors, combat health/damage, tap controls and alarms remain. Patrol positions and routes are fitted to the new walls. Combat revision 4 uses the existing revision 3 combat behavior. Historical weekly maps and their replay bundles stay frozen; this change affects the 12 campaign missions.

## Verification

- `npm run typecheck`: passed.
- `npm test`: 150 passed.
- `npm run server:test`: 65 passed.
- `npx tsx scripts/qa-corridors.ts`: all 12 layouts have unique geometry, reachable objectives and clear patrol segments. Mission 9's switch is accessible with the gate closed, and the gate actually seals the phone.
- The tactical input solver completed all 12 campaign missions and all three existing weekly missions. Those winning inputs passed server replay verification. No health or victory overrides were used.
- Blind-rush simulation loses on every campaign mission after the tutorial. This checks that cover matters; it does not establish human difficulty or retention.
- Browser checks at a 390 × 844 responsive viewport: original warehouse/rooftop/powerworks palettes, tap navigation around cover, damage and retry.
- Signed arm64 Android build succeeded. Physical-device playtesting is still separate.

Evidence: `verification/corridors/geometry.json`, `verification/combat/solvability.json`, `verification/difficulty/level-audit.json` and the screenshots in `verification/corridors/`.

Open the layout gallery at `/design/visual-v2/combat/corridors/`. Its drawings are geometry diagrams; the screenshots show the actual game. Localhost-only `testMission` links allow direct campaign testing without a purchase or ranked entry.
