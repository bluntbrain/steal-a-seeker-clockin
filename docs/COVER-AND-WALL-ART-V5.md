# Cover and wall art plan

Keep the existing district colors and the clean courier/guard silhouettes. Replace the flat wall interiors with generated raster textures. Use bounded panels instead of stretching a single image across an entire wall. The visible wall edge must match its collision edge.

## Art

- Warehouse: bolted gunmetal panels, sage trim and inset ribs.
- Rooftops: graphite service housings, vent slats and muted teal trim.
- Powerworks/vault: reinforced slate plates, cable channels and restrained lavender details.
- Generate three square caps through the approved OpenAI image API. Pack local optimized versions in `assets/walls-v5/`; keep source prompts and originals in `output/imagegen/walls-v5/`.
- Render cap edges without stretching them. Repeat interior panels for long walls. Cache the environment picture once per level, with the existing renderer as a loading fallback.

## Campaign layout plan

| Mission | Added cover and route choice |
| --- | --- |
| 1 · First Pickup | Additional side cover around the tutorial; preserve every tutorial target and timing |
| 2 · Blind Corner | Break the long spine with a crossing; add cover to the empty middle lane |
| 3 · Crossfire | Alternate aisle openings and small cover blocks before each exposed crossing |
| 4 · Loading Lockdown | Add a bypass through the long loading barriers and shelter at both ends |
| 5 · Skybridge | Shorter roof barriers, protected crossing points and multiple ways between lanes |
| 6 · Heavy Watch | Shelter around the heavy guard's court; separate approach and retreat openings |
| 7 · Split Route | More side pockets and another crossing through the divided spine |
| 8 · Twin Relay | Cover between phone bays and a lower bypass for the return trip |
| 9 · Dark Circuit | Cover on the switch approach; keep the phone vault sealed until activated |
| 10 · Vault Window | Shelter near extraction and alternative paths around the relay blocks |
| 11 · Security Grid | Staggered cover at checkpoints, with bypasses between patrol lanes |
| 12 · Last Seeker | Cover islands around the Warden and multiple approaches to the phone chamber |

## Acceptance checks

The target is more usable cover, not maximum blocked floor area. Compare cover density with the previous maps. Check all objective and patrol positions, gate behavior, alternate routes and full legal input replays. Preserve the guided tutorial. Keep existing weekly competition definitions frozen. Run client/server tests, inspect the real rendered game, rebuild the signed Android APK and ship matching replay rules to the existing API.

## Implemented layout structure

The campaign now uses staggered barrier groups linked by cross-corridors. Short dividers interrupt exposed crossings. Mission 9 retains its separately sealed vault; mission 8 has two phone bays; mission 10 keeps timed extraction. Mission 7 has an extra shield before extraction so an escape need not remain exposed to the last patrol.

The route audit temporarily blocks sections of each shortest route and checks that another navigable route exists. It also checks every walkable tile for isolated floor pockets. This is stronger than only checking that the phone can be reached once. Test bots establish solvability, not how enjoyable the game is for people.

## Verification and implementation notes

- Cover occupies 36–40% of the campaign floor after the tutorial. Most rooms now contain 15–19 separate cover pieces, compared with 7–10 before.
- The tutorial keeps its guided targets and has eight cover pieces instead of five.
- The final mission's nearest patrol starts farther up the map, so the courier retains full health during an eight-second idle check at spawn. Active guards still react normally once the player enters their sight line.
- The generated wall asset pack is three runtime images, 307,760 bytes combined. No new weapon blocks were added to the courier or guards.
- UI inspection uses a 390 × 844 responsive browser viewport. Physical Android testing is separate from building the APK.

## Validation results

TypeScript, all 150 client tests and all 65 backend tests pass. All 12 campaign maps and the three existing weekly maps have successful legal-input replays verified by the server simulation. The tutorial completes with its real guided taps. Geometry checks find no isolated walkable pockets; every campaign phone has a tested alternative around at least one blocked crossing. Blind-rush simulation fails in missions 3–12; missions 1–2 remain introductory. These are automated checks, not a claim about human win rates.

Exact OpenAI prompts, original generated images and the runtime asset manifest are retained locally and in this private project. No credentials are part of the project.
