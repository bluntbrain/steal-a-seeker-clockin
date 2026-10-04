# Hunter-style stealth upgrade: a long saga campaign, bosses, top-down courier, guard engine 17

Plan, revised 4 October 2026 after the first review. Branch `hunter-stealth`, draft PR #1. Decisions taken by the user on 4 October: the Solana characters leave the store and become recurring bosses; a boss appears every third level; the campaign grows from 12 fixed missions to a backend-published list that keeps growing (first target 100, capacity 200 or more); missions are shown on a vertically scrolling saga map players can share; the overall look gets an upgrade; guard engine 17 ships in the hackathon build only if the audit passes; top-down art lands for the default costume first.

Implemented so far on the branch (4 October): the top-down courier renderer with sheets for the default and five classic costumes, guard "?" and "!" markers, the red detection ring, the in-play kill counter, the store retirement of the seven Solana skins, the published campaign backend (migration 015, `GET /campaign/levels`, level claims on `POST /campaign/runs`, `campaign:N` progress keys, boot seeding of the bundled batch, the publish script with the pinned verifier), the shared recipe generator with the first 88 levels bundled in the app, the vertical level map with zone banners and boss nodes, the level share card, combat revision 17 (section 2, in `src/game/heist-guards-v17.ts`, rules hash `9da2c067`, engine `6037b867`, revision 16 preserved as `2dff16c1`), the boss role with per-boss traits, boss sprites for Toly, Mert, Chase and Lily, bodies that stay on the floor with a blood pool, and boss name tags. Still open: the remaining three boss sprites, the API deploy, the APK, the device check, and the decisions in section 7.

## 1. What we studied

Reference: Hunter Assassin (Ruby Games), 19 player screenshots and the 18 minute video at youtube.com/watch?v=aGFw2vREch8 sampled every 10 seconds plus two 20 second strips at one frame per second. Saga map reference: the Candy Crush Saga map image supplied on 4 October. Frames stay outside the repository.

| Reference behaviour | Ours today (code read 4 October) | Gap |
| --- | --- | --- |
| Strict top-down characters, close follow camera | Guards top-down, courier three-quarter with 20 frames | Done for the default costume on this branch |
| Guards walk corridors slowly, stop at corners, turn; long narrow flashlight cones | Random walk between anchors, 0.2 s pause, 95 degree cones, spot time under a quarter second | No readable rhythm, no "almost spotted" |
| Red "?" over suspicious guards, converging on noise or bodies | A single alert bar; no suspicion state; bodies fade and are ignored | Now shows "?" and "!" from existing fields; the simulation still lacks suspicion and body discovery |
| Red ring on the player while seen; screen edge tint | Full-screen wash and border | Ring added on this branch |
| One knife hit from behind kills; blood and body persist; kill counter | Rear kill exists; body fades; no counter | Counter added; persistent bodies pending |
| Saga progression: hundreds of numbered levels on a winding path, zone banners, special nodes for hard levels | 12 missions on three fixed district panels | Section 3 |

## 2. Guard behaviour: combat revision 17

`heist-guards.ts` runs revision 16 for every campaign level and is inside the weekly engine hash, so it stays byte-identical. Revision 17 lives in `src/game/heist-guards-v17.ts`, dispatched from `combat.ts` for `revision>=17`, and every change to a shared helper is gated on the revision.

| Behaviour | Rule |
| --- | --- |
| Patrol loop | Ordered waypoint loop, ping-pong at the ends. Pause 0.8 to 1.4 s at each waypoint with a two-step look-around (60 degrees each way). Facing follows the path. |
| Vision | Cone 70 degrees (heavy 60, drone 110), range 1.25 times the band profile, spot time 0.45 to 0.6 s, cone colour fills amber to red with exposure. |
| Suspicion | Exposure between 0.3 and 1, or a noise within range: stop, turn to it, "?" for 0.8 s, walk there at 1.3 times patrol speed, look around twice for 4 s, then return to the nearest waypoint. |
| Alert | Confirmed sight: "!", chase or shoot as today. Guards within 6 tiles hear the shout and enter suspicion toward the last seen position instead of chasing at once. |
| Body discovery | A guard whose cone covers a dead guard within 4 tiles for 0.5 s investigates, searches around the body for 5 s and alerts guards within 6 tiles. Bodies persist as corpses with a blood decal (presentation, capped list). |
| Hearing | Movement within 1.6 tiles behind a guard adds suspicion; the guard turns after 0.6 s. Standing still is silent. |
| Chase | Pursuit speed stays slightly above the courier only while in sight; 2.5 s without sight ends the chase and starts the existing search. |
| Knife | Unchanged. |
| Boss role | 150 HP, patrol speed 0.95, a per-boss trait (section 4), armour and melee rules gated on revision 17, a `costume` field on the patrol spec so the layout names the boss. |

Gate before it ships: all published levels solvable by `scripts/qa-combat.ts` and the deployed worker verifies a revision 17 win.

## 3. A campaign that keeps growing

### Principles, from the code map taken on 4 October 2026

1. The twelve authored missions keep their ids (`practice` ... `last-vault`) and become levels 1 to 12. Renaming them would pay campaign credits a second time and break installed builds. New levels use the key `campaign:N` for N of 13 or more; every mission column is already `text`.
2. The pinned replay verifier already accepts a full level definition (`verifyReplay(mission, replay, definition)`), which is how weekly runs are checked. Campaign claims for level N verify against a definition stored on the server, never one sent by the client and never one regenerated at claim time.
3. `LevelDefinition.number` is the difficulty band (1 to 12) read by the pressure and guard code. The display number "Level N" lives outside the definition, so publishing levels changes no rule file and no rules hash.
4. The server schema must accept `campaign:N` progress keys before any client writes one. Today the server discards all saved progress if it sees an unknown key (`server/progress.ts`). Deploy order: server first, client second.

### Backend

- Migration `server/015-campaign-levels.sql`: `campaign_levels(number integer primary key check(number>=13), batch integer, recipe jsonb, definition jsonb, rules_hash text, engine_hash text, boss boolean, published_at timestamptz)`. Rows are immutable, inserted with `ON CONFLICT DO NOTHING`, like `league_weeks`.
- `GET /campaign/levels?from&to`: returns number, definition, boss flag, display title, zone, engine and rules hashes. The client hides levels whose engine hash it cannot run, mirroring `isWeeklyCompatible`.
- `POST /campaign/runs` accepts `{level:N, rulesHash, replay}` beside the existing `{mission}` form. The server loads the row, verifies with the row's definition and the row's rules hash, awards stars from the row's `targetSeconds`, and keys credits by `campaign:N`.
- `PUT /me/progress` and `GET /me` accept and preserve `campaign:N` keys.
- Publishing is a script, `scripts/publish-campaign-levels.ts`: generates a batch of recipes, builds each definition with the shared generator, proves it winnable with `solveCombat` and `verifyReplay`, inserts the rows, and writes a receipt under `verification/`. Batches of 50. The same script can run against the local database for testing.
- Credits: today 50 per first clear plus 5 per extra star. At 200 levels that is 12,000 credits per wallet against packs starting at 500 credits. Proposal: keep 50 plus 5 for levels 1 to 12 and 20 plus 5 from level 13 onward, with boss levels at 40 plus 5. This is an economy decision for the user to confirm before the batch is published.

### Level recipe and generator

A recipe regenerates a level bit for bit: generator version, combat revision, stable id, room reference (`heist:1..12` or one of the 18 weekly rooms), mirror and flip flags, seed key, modifier (none, blackout, double haul, exit window, switch gate), phone and exit choice, guard roster (drones, scouts, sentries, heavies, warden, boss, reinforcements), pressure band written to `number`, target and hard limit seconds, placeholder mission for the verifier gate and phone edition, zone and floor colour, title and briefing, boss flag.

The generator is the per-slot body of `makeVariedContracts` in `shared/weekly-variety.ts` extracted into `shared/level-recipes.ts`, with the weekly output kept byte-identical (`tests/weekly-variety.test.ts` guards this). Room bank: 18 weekly rooms times mirror and flip gives 72 geometric variants, plus the 12 heist layouts exported from `heist-layouts.ts`. A difficulty curve raises the band every few levels and cycles zones every 10 levels (warehouse, rooftops, powerworks, then back with new palettes later). Every third level from 13 is a boss level: the roster adds the boss for that slot in rotation (Toly, Mert, Chase, Lily, Vibhu, Akshay, Beeman) with two escorts.

### Client

- A `CampaignLevel` type `{number, key, title, zone, boss, definition, engineHash}`. Levels 1 to 12 are built locally from `combatLevel`; 13 onward come from the API and are cached in SQLite; a bundled JSON of the first published batch keeps the map usable offline.
- `GameScreen` holds the current campaign entry and keys progress and claims by the level key, not by `state.mission`, because published levels use placeholder missions.
- Progress unlocks linearly by number; the finale screen fires on the last published level.
- Phone edition, music and environment come from the zone and `(N-1) mod 12`.
- Lessons: the twelve authored lessons stay for 1 to 12; later levels get a generic one-line briefing from the modifier and the boss, like the weekly lesson.

### Saga map

- A vertical `FlatList` with a fixed row height per level, `initialScrollIndex` at the current level, bottom to top. Nodes alternate left and right along a drawn path; every tenth level a zone banner names the area; every third level from 13 is a larger boss node with the boss portrait; the current node shows PLAY and the courier; cleared nodes show stars; locked nodes show a lock glyph (no per-node Skia canvas).
- Reuses the existing node styles, star text, Continue button and district art as zone backgrounds. New zone backgrounds and banners are generated (section 6).
- Header shows "Level N" and total stars; a share button on the map and after any campaign win renders a card "I am on level N of Steal a Seeker" through the existing card and share-sheet code, with an X intent on web.

## 4. Solana bosses

The seven skins stop being sold and the characters appear as bosses.

| Boss | Trait |
| --- | --- |
| Toly | Fastest reaction: spot time 0.3 s, calls guards within 8 tiles |
| Mert | Loud: his alert reaches every guard on the map once |
| Chase | Knife rusher, no gun, 1.6 times patrol speed when alerted |
| Lily | 110 degree cone, slow turn |
| Vibhu | Heavy armour: front hits blocked, rear hits 50 |
| Akshay | Three-shot burst, long recovery |
| Beeman | Two drone escorts share his sight |

- Store: add the seven `solana-*` ids to `RETIRED_ITEMS`, drop the Solana tab, show owned Solana skins under Outfits only. The catalog, orders and credit redemption then refuse them automatically; owners keep and equip them. Before deploying, production variables must not name these skus in `STORE_CREDIT_PRICES_JSON` or in `PROMOTIONS_JSON` bonus skus, or the API refuses to start.
- Presentation: a named health bar, top-down boss sprites at 512 pixels facing +X like the guard sprites, generated from each skin portrait into `assets/bosses-v1/`, a corpse decal on defeat, boss portraits on the saga nodes.
- Open question for counsel: using the names and likenesses of real people as enemies the player knifes, and any notice owed to people who bought a skin that is no longer sold.

## 5. Look and feel

Generated with Codex's image tool (gpt-image-2), which is available in this environment; the Higgsfield connector is not authorised in this session. Targets: zone backgrounds and banners for the saga map, boss portraits, a top-down sheet per classic costume (five are generating now), the kill counter and marker glyphs already drawn as vectors, persistent blood and corpse decals, and refreshed mission intro art for boss levels. Every generated file goes through the existing packers with a manifest and hashes.

## 6. Order of work and the deadline

The hackathon closes on 8 October 2026. Each step leaves `main` shippable.

| Day | Scope | Hash |
| --- | --- | --- |
| 1, done | Plan, top-down default courier, markers, ring, counter | Unchanged |
| 2, done | Store retirement; campaign level model, API, migration, progress keys, publish script; generator; saga map with levels 1 to 12 plus the first published batch; share card | Unchanged |
| 3, mostly done | Guard engine 17 and the boss role, tests, solver audit, rules bundle `9da2c067`; boss sprites (four of seven); top-down sheets for five classic costumes; corpses. API deploy pending | New |
| 4 | Balance pass, publish the first 100, APK, device check if a phone is available, PR ready | None |

Risks: four days; the credit economy decision; the likeness question; difficulty regressions from longer cones (mitigated by the slower spot time and the solver gate); production variables that still name Solana skus.

## 7. Decisions still open

1. Credits per level from 13 onward: implemented as 20 plus 5 per extra star, bosses 40 plus 5, pending the user's confirmation before the API deploy.
2. Boss cadence: implemented as every third level from 13 (15, 18, 21, ...), rotating Toly, Mert, Chase, Lily, Vibhu, Akshay, Beeman. Mission 12 keeps its finale.
3. Whether owners of retired skins get a notice in the store.

## 8. Weekly missions removed, leaderboard by total points (4 October, evening)

The user asked to remove weekly missions completely and rank players by the points they hold in total, so a player at level 12 outranks one at level 2, and a full-health clear outranks a damaged one. Decisions: keep the Game Pass and repurpose it as a one-time bundle (3,500 credits and the Ghost Signal outfit; the 25 percent completion rebate stays when the live offer carries one); rank by total points (sum of each wallet's best verified score per level, speed and remaining health are already in the score); list only wallet players with server-verified runs, browser guests see the board and their own device total.

Removed: the league, daily and paid routes, services and workers; the weekly board, daily and paid panels and submissions; the weekly contract generator and compatibility list; the related tests and scripts. Kept: the return service for the campaign rebate, the 18 generated rooms (`shared/weekly-layouts.ts`) that feed the level generator, the frozen weekly fixtures as archived-engine regression data (`tests/engine-compatibility.test.ts`).

Added: `GET /campaign/leaderboard` returns the top fifty by total points plus the caller's own row; the pass grants its bundle once on payment and on a free promotion, and existing pass owners receive it at boot; the Ghost Signal outfit is owned through the pass and equippable like any outfit; a campaign board on the Leaderboard tab with a share button to the level card.

## 9. Smoothness pass after Codex's art and leaderboard work (4 October, late)

Pulled Codex's commits (illustrated level map, courier sheet v2 with walking while carrying, footstep onset, .skr names on the board, code 39). Typecheck, rules check and 384 tests passed on the pulled tree. The web build measured 120 fps with a p95 interval of 8.6 ms on the boss level, so the device is the real question; without a Seeker the changes below are structural.

Changes: the level map scenes are plain images with the zone crossfade baked into the art (no Skia surface inside the scroll view, which is where Android scroll stutter comes from); the UI thread's HUD snapshot no longer carries the level definition or the guards' routes and planner memory (the JS side reattaches the level it holds); frame samples use a fixed ring; the relay comparison copies nothing per step; the follow camera allocates nothing while the courier stands still. Verified in the browser: the HUD still names the level (`campaign:15`), guard routes are empty in the snapshot, metrics still report.

Codex review of the pass found two regressions, both fixed: the tutorial stores HUD snapshots as checkpoints and restores them into the simulation, so snapshots stay complete while the tutorial is active and a saved checkpoint with stripped guards is rejected; the topmost map scene draws an opaque copy of its world image instead of fading into the background. The API now runs Codex's `.skr` name resolver (deployment 14e73003); five of the six ranked wallets resolved. Code 41 carries the fixes. Emulator frame statistics for the map scroll are software-rendered and not meaningful; a device run is still needed.

Still open: a physical device run with Perfetto or gfxinfo, Codex's P1 items (first-tap acknowledgement on the next frame, cached walkable grids in navigation, which needs a rules revision), and the AI livestream proposal, which is not implemented.

## 10. Look pass: walls, route start, blood, loader (4 October, night)

On the user's request after Codex's loader and marker commits (ccbe191, d78b377, 78aba39): the mission loader now stays up at least 2 seconds (`LOADER_MIN_MS` in `src/GameScreen.tsx`; measured 2,081 ms in the browser from the Play tap), the route line starts under the courier again (Codex's inverted courier clip in `CombatLayer.tsx` is removed, the destination dot still fades before arrival), and the blood pool under a fallen guard is gone (the body stays so patrols can still find it).

Walls: the three district caps were regenerated with gpt-image-2 through the Codex CLI (`output/imagegen/walls-v6/`, prompts beside the PNGs) as a bolted frame around a uniform tileable interior with no centrepiece, and `src/art/walls.ts` now nine-slices once per wall (fixed corners, tiled edges and interior at the corner scale) instead of once per two-unit module. Long walls read as one slab instead of a row of framed boxes. Runtime JPEGs stay at `assets/walls-v5/` (manifest and README updated), 135 KB for the three. Evidence: `verification/hunter-stealth/look/`.

Not done: floors are unchanged; a physical device look at the new caps at Seeker density.
