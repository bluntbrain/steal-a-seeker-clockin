# Hunter-style stealth upgrade: guards, top-down courier, Solana bosses

Plan for review, 4 October 2026. Branch `hunter-stealth`. Nothing in this plan is implemented yet except the art pipeline test noted in section 4.

## 1. What we studied

Reference: Hunter Assassin (Ruby Games). Evidence: 19 player screenshots supplied on 4 October 2026 and the 18 minute gameplay video at youtube.com/watch?v=aGFw2vREch8, sampled at one frame every 10 seconds plus two 20 second strips at one frame per second. Frames stay outside the repository; they are third-party content. Observations are from viewing, not from measured timings or the competitor's source.

### What the reference does

| Area | Observed behaviour |
| --- | --- |
| View | Strict top-down. The player and every enemy are drawn from directly overhead: top of the head, shoulders, weapon. The camera follows the player closely; roughly six to seven tiles are visible across the phone. |
| Guards | Walk slowly along corridors between wall blocks, stop at corners and turn. Each carries a long bright flashlight cone, roughly 60 degrees wide and five to seven tiles long. Facing follows movement. |
| Suspicion | A red question mark appears above guards that heard something or noticed a body. They turn toward the stimulus, walk to it, look around, then resume. Several guards converge on a kill site. |
| Alert | When the player stands in a cone a red ring appears around the player and the screen edge tints red. Guards rush or shoot. Breaking line of sight ends the chase after a short search. |
| Kills | One knife hit from behind kills instantly with a cyan slash. Blood decals and the body stay for the rest of the level. "Double Kill" text and a gem reward pop on multi-kills. |
| Enemy types | Knife rushers, shotgun guards, a grenadier, laser tripwires, and a robot boss with its own health bar. |
| HUD | Kill counter top left ("2/7" with a crosshair icon), player health bottom left ("16/16"), an orange path with an arrow to the tapped point, orange corner brackets on a selected target, a grenade item with a count. |
| Pace | The player moves clearly faster than patrolling guards. Levels hold 7 to 13 enemies, occasionally 30. A kill lands every few seconds when played well. |

### What ours does today

From `src/game/heist-guards.ts` (combat revision 16), `src/game/guards.ts`, `src/game/heist-layouts.ts` and `src/components/GameCanvas.tsx`, read on 4 October 2026:

| Area | Current behaviour | Gap |
| --- | --- | --- |
| Patrol | Random walk between two to four anchors, 0.2 s pause, a small sway, no turn-in-place | Feels robotic; no readable rhythm to time an approach |
| Vision | 95 degree cones (120 for drones), 4 to 5 tiles, spot time 0.18 to 0.24 s | Too wide and too instant; the player cannot see "almost spotted" |
| Suspicion | None. A guard turns toward the courier while exposure fills, nothing else | No question mark, no investigate-from-sound step |
| Bodies | Dead guards are skipped by the loop and fade out in under a second | No body discovery, no persistent consequence of a kill |
| Hearing | Knife impact, grates, pickup and tripwires only | Footsteps are silent; rear approaches have no timing risk |
| Radio | Guards within 5 tiles join a confirmed chase at once | Reference guards first become suspicious, then converge |
| Courier art | Three-quarter chibi, 20 directional frames per skin | Reference and our own guards are top-down |
| Kill feedback | Combo toast, coin burst | No kill counter, no persistent blood or body |

Already right and kept: tap to move, tap a guard to approach and slash, one-hit rear kill when the guard is unaware, partial damage otherwise, deterministic 30 Hz simulation with server replay verification, flashlight cones drawn from the same data the simulation uses.

## 2. Guard behaviour: combat revision 17

Every campaign level runs revision 16 through `applyPressure` in `src/game/heist-layouts.ts`. `heist-guards.ts` is in the weekly engine hash, so it stays byte-identical and revision 17 lives in a new `src/game/heist-guards-v17.ts`, dispatched from `combat.ts` for `revision>=17`. Any change to shared helpers (`sees`, `melee`, `guard-pressure`, `navigation`) is gated on `revision>=17`.

| Behaviour | Revision 17 rule | Why |
| --- | --- | --- |
| Patrol loop | Ordered waypoint loop, ping-pong at the ends. At each waypoint pause 0.8 to 1.4 s with a two-step look-around (turn 60 degrees each way), then continue. Facing follows the path. | Gives the player a rhythm to read and a safe window to cross |
| Vision | Full cone 70 degrees (heavy 60, drone 110). Range 1.25 times today's profile. Spot time 0.45 to 0.6 s, with cone colour filling from amber to red as exposure rises. | Long narrow beams like the reference; "almost spotted" becomes visible |
| Suspicion | Exposure between 0.3 and 1, or a noise within range, puts the guard in `suspect`: stop, turn to the stimulus, show "?" for 0.8 s, then walk there at 1.3 times patrol speed. After 4 s without a sighting, two look-arounds, then return to the nearest waypoint. | The question-mark beat from the reference |
| Alert | Confirmed sight: "!" marker, red ring on the courier, chase or shoot as today. Guards within 6 tiles hear the shout and enter `suspect` toward the last seen position instead of chasing instantly. | Converging guards without teleporting knowledge |
| Body discovery | A guard whose cone covers a dead guard within 4 tiles with line of sight for 0.5 s enters `suspect` toward the body, searches around it for 5 s, and alerts guards within 6 tiles to the body. Bodies persist as top-down corpses with a blood decal. | Kills have consequences; players learn to drag the fight away from patrol routes |
| Hearing | Courier movement within 1.6 tiles behind a guard (outside the cone) adds suspicion; the guard turns after 0.6 s. Standing still is silent. | Rear approaches become a timing game instead of a free kill |
| Chase | Pursuit speed stays slightly above courier speed only while in sight. 2.5 s without sight ends the chase and starts the existing search at the last seen position, then return. | Escapes stay possible, as the reference shows |
| Knife | Unchanged: one-hit kill from the rear on an unaware guard, 35 damage otherwise, armour rules for heavy and warden | Already matches the reference |

The level-band pressure profile in `src/game/guard-pressure.ts` remains the difficulty dial. New values go in `applyPressure` under revision 17 only. All twelve missions must stay solvable by the existing solver scripts (`scripts/qa-combat.ts`, `scripts/audit-campaign-v5.ts`) before the revision ships.

## 3. Top-down courier

Rendering is outside the rules hash, so this ships without a new revision.

- Art: one 1024 by 1024 sheet per costume with eight top-down frames: idle, walk A, walk B, walk C, knife wind-up, slash, follow-through, carrying the phone. Generated with Codex's built-in image tool (gpt-image-2) from each skin's existing portrait plus the guard sprite as the camera reference. The default costume test sheet produced on 4 October matched the brief on the first pass (hood from above, mint backpack, knife, eight clean poses).
- Packing: a new `scripts/pack-topdown-courier.mjs` (sharp) crops the magenta sheet into `assets/courier-topdown-v1/<id>.webp` at 256 pixel cells with `frames.json` and a manifest carrying sha256 hashes, following `assets/solana-skins/manifest.json`.
- Rendering: `GameCanvas.tsx` draws the courier like a guard: one Atlas sprite centred on the actor and rotated by a presentation-only angle derived from velocity, or from the melee angle during an attack. Walk frames cycle with `walked`; the carry frame shows while carrying; attack frames follow the existing 4, 7 and 11 tick pose timing in `melee-presentation.ts`. The shadow becomes a centred oval, the health bar lift drops, the carried phone draws on the left hand.
- Elsewhere: store portraits, hideout, courier cards and share images keep the three-quarter art. The mission intro demos switch to the new atlas with rotation.
- Tests: frame count, non-empty alpha per frame and atlas dimensions for every costume, mirroring `tests/melee-presentation.test.ts`.

## 4. Solana bosses

Skins stay purchasable and unchanged. The same seven characters also appear as boss enemies.

| Boss | Trait | Suggested placement |
| --- | --- | --- |
| Toly | Fastest reaction: spot time 0.3 s, calls guards within 8 tiles | Mission 4, warehouse finale |
| Mert | Loud: his alert reaches every guard on the map once | Mission 8, rooftops finale |
| Chase | Knife rusher, no gun, 1.6 times patrol speed when alerted | Weekly rotation |
| Lily | Wide 110 degree cone, slow turn | Weekly rotation |
| Vibhu | Heavy armour: front hits blocked, rear hits 50 | Mission 12 beside the Warden |
| Akshay | Three-shot burst, long recovery | Weekly rotation |
| Beeman | Two drone escorts share his sight | Weekly rotation |

- Simulation (revision 17): a `boss` role with 150 HP, patrol speed 0.95, named trait table, armour and melee rules in `melee.ts` gated on revision 17, cast entries in `heist-layouts.ts` with a `costume` field so the layout names the boss.
- Presentation: a named health bar ("TOLY 150"), top-down boss sprites at 512 pixels generated from each skin's portrait and the guard camera reference into `assets/bosses-v1/`, drawn by `GuardLayer` through a boss sprite map, a corpse decal on defeat.
- Store tie-in: the Solana tab copy notes where each character appears as a boss.
- Open question for counsel, not resolved here: `docs/GAMEPLAY-SOLANA-SKINS-PLAN.md` already flags likeness permission for paid skins. Using real people's names and likenesses as enemies the player knifes is a further likeness and consent question.

## 5. HUD and feedback

- Kill counter top left: "guards down 3/7" with a crosshair icon, next to the existing timer. The objective stays the phone and the exit; the counter is secondary.
- Detection ring: a red ring around the courier while any guard sees them, replacing the full-screen alarm wash during combat; the alarm border stays for the theft lockdown.
- Guard markers: "?" during suspicion, "!" on confirmed sight, replacing the current binary bar.
- Corpses and blood: a capped list of decals in a Skia picture that persists for the level.
- Existing combo toast and coin burst stay.

## 6. Rules and compatibility plumbing

From the code map taken on 4 October 2026:

1. Snapshot revision 16: `tests/fixtures/campaign-revision16.json` with rules hash dccdef3f, engine hash 2dff16c1 and all twelve `combatLevel` definitions, in the shape of the revision 13 fixture.
2. Add 17 to the revision union in `src/game/level.ts`, route it in `combat.ts`, and add the new module to `RULE_FILES` in `server/rules-version.ts`.
3. `shared/weekly-compatibility.ts`: add `PRESERVED_REVISION_16_ENGINE`, map the dccdef3f rules hash to it, allow revision 17, bound the preserved engine at 16.
4. `server/campaign-credit-versions.ts`: an explicit dccdef3f branch with today's target seconds so code 35 and code 36 claims keep earning credits.
5. Weekly: a new Monday-boundary gate in `shared/weekly-melee.ts` with a new id suffix; the active week is never regenerated.
6. `npm run rules:generate`, then `rules:check`, `npm test`, `npm run server:test`, `npm run typecheck`. Commit source, bundle, registry and manifests together. Deploy the API before building the APK, verify one revision 17 win against the deployed worker, then build.

## 7. Order and deadline

The hackathon closes on 8 October 2026 (rules.md, 11 September; recheck the portal). Work is ordered so each day leaves `main` shippable.

| Day | Scope | Rules hash |
| --- | --- | --- |
| 1 | Plan (this document). Top-down default courier atlas, renderer, "?" and "!" markers, detection ring, kill counter. Browser QA. | Unchanged |
| 2 | Revision 17 guard engine: loops, pauses, cones, suspicion, body discovery, hearing, alert spread. Tests, solver audit of all twelve missions, rules bundle, local API verification, API deploy. | New |
| 3 | Boss role and three campaign placements, boss sprites, remaining twelve top-down skins, corpses. | Same bundle, layouts only |
| 4 | Bot balance pass, APK, device check if a phone is available, PR ready to merge. | None |

Risks: four days to the deadline; the likeness question above; difficulty regressions from longer cones (mitigated by the solver audit and the slower spot time); about 2 to 3 MB of new WebP sheets.

## 8. Decisions needed before day 2

1. Boss placement: three campaign finales plus weekly rotation (recommended), all seven in the campaign, or weekly only.
2. Ship revision 17 before the deadline (recommended, day 2 gate: all twelve missions solvable and the deployed worker verifies a win), or keep revision 16 for the submission and ship 17 after.
3. Top-down art scope: default costume first, then the other twelve on day 3 (recommended), or all thirteen before any renderer change.
