# Knife-only courier: implementation plan

Status: PLAN ONLY. No gameplay, assets, backend, APK or published content changed for this request.
Source audit: current local checkout, 2026-10-01. Paths below are relative to seeker-game unless explicitly absolute.

## 1. Product decision

The courier has a knife, never a gun or thrown knife. Guards retain their guns. Drones remain unarmed scouts. Tap an enemy once to approach and automatically attack at contact distance; tap the floor to abandon the target and move away. Keep the existing four-arrow target marker, phone pickup, extraction, skins, health bars and mission progression.

This is a combat redesign, not a shorter bullet. Its appeal should be reading patrols, getting close, landing a quick takedown and relocating. Keeping existing gun damage and cooldown with a knife graphic would create slow damage trading beside armed enemies.

Defaults proposed here are starting values for playtesting, not verified balance results. No extra dash button, weapon shop, skill tree, ammo system or stat boosts for paid skins in this change.

## 2. Findings from the current code

- `src/game/combat.ts`: generic COMBAT.range=4; revision-14 targeting approaches to 2.6 units and can keep shooting to 3.1 after stopping. The new knife must replace both range checks and the approach endpoint.
- `stepCombat` directly spawns player projectiles with owner=-1, 25 damage or a 50-damage ambush, on a 12-tick cooldown. Simulation runs at 30 ticks/second.
- Player damage, armor, survivor alerting, hit counters and defeats currently live inside projectile collision handling. A knife must use a deterministic contact-hit resolver, not an invisible projectile.
- `c.shots` also drives guard hearing, gunshot sound and haptics. Changing only its presentation would leave false noise and event semantics.
- Heavy/Warden armor currently uses incoming projectile velocity. Melee must classify the direction from attacker position at impact.
- `guard-pressure.ts`: drone report windows are 24 down to 21 ticks (0.8 to 0.7 seconds); very short for a close approach. Guard firing windows are also short. These must be evaluated with melee access, not left unchanged blindly.
- `heist-guards.ts` stops a closing guard at approximately 1.15 units. That differs from a proposed knife contact radius and needs an explicit close-combat spacing rule.
- The basic mission demo still animates three bullets at a distant enemy. Drone, armor, flank and finale mechanic demos also contain scripted courier shots.
- Campaign currently uses revision 14. Weekly variety currently creates revision-13 contracts. Old contract definitions and replay verifiers are frozen. A global toggle would break fair scoring and old submissions.
- Score is currently escape time plus remaining health, not kills or shots. Keep that formula initially; rebalance time limits and star targets separately.
- There are six outfit atlases and seven Solana-character atlases. All thirteen appearances need a compatible knife grip and attack animation.

## 3. Exact control and combat contract

### Target and approach

1. One enemy tap selects its stable guard index; the four gold arrows appear immediately and follow it.
2. Route around solid walls and closed gates toward a reachable attack position. Start with 0.85 world units center-to-center; calibrate against physical body radii rather than portrait dimensions.
3. For large guards, increase center distance to account for their physical body size while keeping the same visible blade reach. Do not give giant portraits hidden extra reach.
4. Stop outside the enemy body and turn toward it. Never overlap or teleport through it.
5. Replan at a bounded cadence for moving targets, with displacement thresholds and a brief retry window. Repeated taps on the same guard do not restart the attack or spend another path search.
6. No automatic navigation behind the enemy: the player chooses the flank through floor taps. Enemy targeting chooses a reachable nearby contact point, not a secretly optimal backstab route.
7. Dead/inactive targets clear selection. Temporarily obstructed targets retry briefly; unreachable targets show “Can't reach from here” and cancel cleanly.
8. Floor tap cancels approach immediately. It also cancels an uncommitted wind-up. A hit already resolved cannot be undone; cooldown remains, preventing tap-spam exploits.

### Attack state machine

`approach -> wind-up -> impact -> recovery -> approach/next attack`

- Starting timing: 4 ticks wind-up, impact once at the contact tick, 7 ticks recovery. About 0.37 seconds per full attack.
- Stop physical movement during the committed swing. Use a small visual body lean and blade arc; do not displace collision geometry for a decorative lunge.
- Re-check target alive, distance, clear segment, attack arc and obstruction at impact. A target moving away or a closing gate can cause a real miss.
- Single selected target per swing. No through-wall damage, piercing or accidental area damage.
- Store attack id, target, angle, phase/ticks and resolved flag in simulation state. Replay the same impact tick on client and server. Animation callbacks never decide damage.
- Do not grant blanket invulnerability. A landed opening takedown can interrupt its victim; a miss cannot. Already-fired enemy bullets remain dangerous.

### Proposed role outcomes

| Enemy | Frontal/alerted encounter | Good flank or stealth approach |
| --- | --- | --- |
| Scout / normal guard | Two quick strikes, starting at 35 damage each against 50 HP | One clean rear takedown |
| Sentry | Three normal strikes against 75 HP; safer to use its recovery window | One clean rear takedown if unaware |
| Scout drone | One contact slash; a surviving report must not magically reset | Approach a low patrol hover and cut it down before broadcast |
| Heavy | Front plate clangs and blocks damage; small capped recoil without moving through cover | Rear hit around 75 damage: two rear strikes against 150 HP |
| Warden | Same readable directional armor; no long frontal chip-damage strategy | Rear hit around 75 damage: three against 200 HP |

A stealth takedown requires a rear approach and an unaware target at impact. A previously alerted target does not become eligible just because its gun is recovering. Rear armor damage and stealth eligibility are separate checks. Opening stagger is bounded and cannot be renewed indefinitely to stun-lock a Heavy.

## 4. AI and map fairness

Keep persistent pursuit and shared sightings. Silence is not invisibility: a guard who sees the courier attacks and reports normally. Do not grant every guard knowledge merely because a knife was swung.

Separate noise events from gunshot counters. A missed swing makes little/no AI noise; a normal contact/defeat makes a small local sound; a clang on armor has a larger local radius. Sound-event ids drive investigation. Provisional radii: 1.5 units for normal impact, 2.5 for metal clang; validate on actual maps. Nearby witnesses still see/react normally.

Drones must visually hover low enough to reach. No long-range invisible knife, no flying knife, no drone that kites forever. Let patrol pauses and committed report charging create an approach opportunity. Initial report proposal: 1.2 seconds in the first three missions, around 1 second later, with cover near the scan area. Tune after measuring approach time. A melee hit can cancel only an unsent report; killing a drone cannot erase a broadcast that already occurred.

Guard aim must remain readable. Preserve aim commitment rather than snapping the muzzle around instantly during a player's flank. Review close-range separation so enemies cannot occupy the courier and cannot be pushed through walls. Incoming bullets still collide with cover and the courier.

Every required encounter needs at least one feasible covered approach, patrol separation window or avoidable route. The player is stealing a phone, not required to kill every guard. Difficulty should come from choosing a route and timing it, not unavoidable damage on spawn.

### Twelve-mission review

| Mission | Knife-focused encounter / acceptance check |
| --- | --- |
| 1 | Keep the new central-spine layout. Teach move, get close, slash, then steal/escape. Isolate the first attack from overlapping firing lanes; retain harder optional encounters beyond it. |
| 2 | Low-hover drone near cover. Clearly demonstrate scan -> charge -> interrupted report. |
| 3 | Two guards around cover; a real separation window permits a rear attack. Frontal rushing remains dangerous. |
| 4 | Pickup reinforcement uses a visible warning and gives the player an exit route; no spawn directly on their knife target. |
| 5 | Cross guarded lanes between safe pockets, attack during recovery or avoid contact. |
| 6 | First explicit Heavy lesson: front clang, circle cover, rear strikes. Space to flank without clipping. |
| 7 | Short watched route versus longer covered route; neither is a mandatory bullet sponge. |
| 8 | Two phones with persistent alarm. Validate second-trip health budget and armor count for melee. |
| 9 | Switch, grate and gate; knife cannot pass through a closed gate. Quiet path remains useful. |
| 10 | Timed extraction with a safe waiting pocket that cannot trap the courier in unavoidable close-range fire. |
| 11 | Persistent pursuit through rooms; reposition and isolate enemies instead of kiting while shooting. |
| 12 | Warden rear weakness, reachable scout drone and two security entrances; combine learned skills. |

Do not replace all wall art or maps unnecessarily. Adjust specific cover gaps, patrol anchors, overlap and timings found by the melee audit. Preserve district courier speed bonuses of 0/8/16 percent unless evidence justifies retuning them.

## 5. Visuals, audio and haptics

- Generate one coherent steel-and-mint knife asset set with transparent background, four directional views and an atlas manifest. No weapon advantage by skin.
- Add a shared knife rendering layer and per-appearance hand/anchor metadata. Prototype against default courier, Toly and Beeman first, then verify all thirteen atlases. If an existing hand pose cannot read correctly, generate attack frames for that appearance rather than attach a floating blade.
- The knife is visible in hand during gameplay. A brief wind-up, body lean, slash arc and contact spark make the attack legible at real phone scale. Change draw order for north-facing attacks so the knife does not float across the face.
- Keep the four target arrows during approach/attack, and current numeric health bars. Use a small impact flash and existing role-specific defeat animations. No blood needed for the game's tone.
- Add 2–3 short swing variants, light impact, armor clang and heavy rear impact. Retain guard gunshot assets and drone/guard defeat sounds.
- Trigger contact haptic on a successful knife hit, a distinct blocked-armor cue, and existing stronger defeat/damage cues. Do not vibrate on every approach tap or every tick. Damage keeps priority. Muting sound must not disable enabled haptics.
- Keep music. Avoid adding large 3D models or a new game engine; current Skia/Reanimated rendering is suitable.
- Keep the current corrected Seeker splash: it does not show the courier firing. A new knife splash can be a later art choice, not required for functional consistency.

## 6. Teaching and text inventory

The new basic demo is **MOVE -> GET CLOSE -> SLASH -> ESCAPE**. Show the approach and actual contact, not a stationary courier causing distant damage. Keep replayable demo stages and safe-area-aware fixed start button.

Update all 12 lesson bodies, cues and briefings for their actual mechanics. Specifically redesign drone, flank, armor and finale animations. Cover demos keep enemy bullets because guards still shoot. Guard aim/fire language stays where it describes enemies.

Recommended copy:

| Surface | New copy |
| --- | --- |
| Core controls | “Tap the floor to move. Tap an enemy to approach and attack with your knife.” |
| Cancel hint | “Tap elsewhere to stop attacking and move away.” |
| First attack | “Tap the guard. Get close, then slash.” |
| Stealth | “Approach from behind for a quiet takedown.” |
| Drone | “Drones report your location. Cut them down up close, or break sight before the amber ring fills.” |
| Heavy | “Its front is armored. Get behind it and strike the mint weak point.” |
| Loss | “Use cover to get close. Move when a guard commits its aim.” |
| Audio settings | “Knife swings, guard gunfire, impacts and alarms.” |
| Haptics settings | “Feedback for knife hits, damage, takedowns, pickups and controls.” |

Version tutorial persistence so returning players who completed shooting lessons receive the new melee lesson once. Old saved tutorial checkpoints must not restore a gun-era state into a knife map. Let users skip and replay it.

No global text replacement of “shoot”/“bullet”: guards still fire, archived contracts still have their original rules, and historical QA evidence must remain accurate. Display help based on the run's combat revision. New screens/bottom sheets, if genuinely needed, require an image mockup before implementation per the user's design workflow; prefer adapting existing surfaces here.

## 7. Concrete file change inventory

### Gameplay: edit

| File | Planned change |
| --- | --- |
| `src/game/combat.ts` | Revision-15 dispatch, contact approach, phase advancement, player projectile prohibition, hit integration, serialization-safe counters; preserve <=14 paths. |
| `src/game/level.ts` | Add combat revision 15 to definitions. |
| `src/game/heist-layouts.ts` | New campaign revision, encounter tuning, mission tips, target/hard times where justified. |
| `src/game/heist-guards.ts` | Explicit melee noise events, survivor reactions, close spacing, melee armor direction, drone contact behaviour; retain old revisions. |
| `src/game/guard-pressure.ts` | Melee-specific telegraph/report timing profile without silently changing old runs. |
| `src/game/guards.ts` | Any additional per-guard melee reaction/stagger state, with deterministic initialization. |
| `src/game/simulation.ts` | Initialize/reset melee state for new runs and transitions; preserve historical initialization. |
| `src/controls/tapDestination.ts` | Contact approach intent and cancel behaviour; keep one authoritative path solve. |

### Gameplay: new modules

- `src/game/melee.ts`: reach checks, state machine, impact timing and directional strike rules.
- `src/game/combat-damage.ts`: shared hit/defeat bookkeeping for the new revision; do not accidentally change the old projectile resolver while extracting it.
- `src/game/combat-rules.ts`: revision-aware capability/help selection to avoid broad UI conditionals and mismatched old weekly instructions.

### Presentation and feedback: edit

| File | Planned change |
| --- | --- |
| `src/components/GameCanvas.tsx` | Knife layer, courier attack pose, consistent layering with carried phone. |
| `src/components/CombatLayer.tsx` | Keep reticle/path; no friendly tracer for melee; add contact-only effect integration. |
| `src/components/GuardLayer.tsx` | Melee impact/armor response and clear drone hover presentation; retain enemy aim lines. |
| `src/components/costumeAssets.ts` | Optional per-skin attack asset mappings; keep every existing skin. |
| `src/components/guard-defeat.ts` | Contact direction/impulse for takedowns, if needed by current defeat animation. |
| `src/audio/combat-events.ts` | Separate swing, contact and armor events from player/enemy shots. |
| `src/audio/useCombatAudio.ts` | New samples, event-based variations, pause/resume/reset safety, revision-aware legacy shots. |
| `src/feedback/haptic-policy.ts` | Add melee hit and armor block cues with rate limits/priorities. |
| `src/feedback/useHaptics.ts` | Native cue mapping and fallback; sound-independent haptics. |
| `src/GameScreen.tsx` | Shared rules/help selection, pause/loss copy, wiring, tutorial migration and transition reset. |

New: `src/components/KnifeLayer.tsx`, `src/components/melee-presentation.ts`, `assets/weapons/knife-v1/*`, `assets/audio-melee-v1/*`. Add per-skin attack assets only if pose validation requires them. Record prompts, sources and final asset paths. No Higgsfield needed for image assets.

### Onboarding and information: edit

- `src/onboarding/combat-guide.ts`: melee waypoints and completion assertions.
- `src/onboarding/useCombatGuide.ts`: new lesson storage version and invalid checkpoint handling.
- `src/onboarding/mission-demo.ts`: close approach and slash choreography, replacing player bullets.
- `src/onboarding/mechanic-demo.ts`: drone, armor, flank, finale contact attacks; retain hostile fire in cover lessons.
- `src/onboarding/mission-lessons.ts`: all twelve lessons plus revision-aware weekly guidance.
- `src/components/MissionDemo.tsx`: knife and swing rendering, new step labels and captions.
- `src/components/MechanicDemo.tsx`: shared knife effects and matching role demonstrations.
- `src/components/MissionIntro.tsx`: accurate controls subtitle; layout check for revised copy.
- `src/settings/SettingsPanel.tsx`: controls, sound and vibration descriptions.
- `server/site.ts`: live support/how-to-play text, coordinated with release availability.
- `README.md`, `submission/JUDGE-GUIDE.md`: current gameplay description.
- `publishing/listing-refresh-2026-09-27.md`: retain as dated draft; create new `publishing/listing-refresh-knife.md` for current copy/screenshots rather than pretending a historical draft was always melee.

### Rules, weekly and backend: edit or generate

- `shared/weekly-variety.ts` and `shared/contracts.ts`: new generator/version activation for future knife weeks, preserving version-3 historical generation. Keep the old generator implementation; dispatch by frozen version/cutover week.
- `shared/weekly-layouts.ts`: melee-feasible templates/questions in the new version only; do not mutate the source of reproducible old contracts without retaining it.
- `shared/weekly-compatibility.ts`: pin current revision-14 engine as legacy and add revision-15 support with strict engine/revision bounds.
- `server/rules-version.ts`: add ALL new gameplay modules to RULE_FILES and weekly engine hashing. Missing a melee module here would allow changed logic under an unchanged fingerprint.
- `server/replay.ts`: validate/replay new combat; expose explicit melee counters if required, not renamed “shots” with different semantics.
- `server/campaign-credit-versions.ts`: preserve old reward thresholds/rules; new version still deduplicates mission rewards.
- `shared/rules-manifest.json`, `shared/weekly-engine.json`, `server/rule-bundles/registry.json`, new `server/rule-bundles/<new-hash>.mjs`: generated artifacts. Never hand-edit/overwrite old bundle files.
- `server/paid-service.ts` and `server/ranked-service.ts`: change only if their freeze/version-selection logic needs explicit new-generator support; verify claims and starts use pinned definitions.

### Inspect and regression-test; do not edit by default

`src/game/navigation.ts`, `src/game/geometry.ts` (contact route correctness); `src/game/recording.ts`, `shared/replay.ts` (existing attack command format may remain replay version 2); `src/paid/store-core.ts`, `src/paid/recovery.ts`, `src/ranked/pending.ts`, `src/paid/PaidSubmission.tsx`, `src/paid/PaidSubmission.web.tsx`, `src/ranked/RunSubmission.tsx`, `src/ranked/RunSubmission.web.tsx` (old run resume/submission); `server/replay-runner.ts`, `server/replay-worker.mjs`, `server/rule-bundle.ts` (old bundle execution); `shared/contracts.ts` scoring function; `src/game/courier-speed.ts`; `src/components/ActorHealthBars.tsx`, `src/components/CameraSignals.tsx`, `src/components/CleanCombo.tsx`, `src/feedback/clean-combo.ts`; `src/components/MissionBriefing.tsx`, `src/components/MissionFocus.tsx`, `src/components/MissionPreview.tsx` (derived data/copy/layout); `src/components/LaunchSplash.tsx`, `src/components/CourierArt.tsx`, `src/components/SkinVisuals.tsx`, `shared/costumes.ts` (appearance/preloading if new assets require it); `src/feedback/useHaptics.web.ts` (stays silent).

Preserve legacy `src/game/combat-levels.ts`, `src/game/campaign-layouts.ts`, `src/game/encounters.ts` behaviour. They must remain able to reproduce old levels/replays. Retain shooting assets used by guards and legacy runs. No payment/MWA, coupon, wallet or commerce schema change is expected. Do not change archived APK metadata, historical QA or old promotional videos in place.

### Test and tooling changes

Update: `tests/target-follow.test.ts`, `tests/combat.test.ts`, `tests/guard-pressure.test.ts`, `tests/heist-encounters.test.ts`, `tests/guard-defeat.test.ts`, `tests/combat-audio.test.ts`, `tests/haptic-policy.test.ts`, `tests/haptic-delivery.test.ts`, `tests/mission-demo.test.ts`, `tests/mechanic-demo.test.ts`, `tests/tutorial.test.ts`, `tests/weekly-variety.test.ts`, `tests/weekly-compatibility.test.ts`, `server/replay.test.ts`, `server/replay-runner.test.ts`.

Add focused `tests/melee.test.ts`, `tests/melee-presentation.test.ts`, frozen revision-14 fixtures and revision-15 melee replay fixtures. Extend `scripts/qa-combat.ts`, `scripts/audit-campaign-v5.ts` and `scripts/qa-weekly-variety.ts` or add versioned melee successors so solvers physically approach targets. Review `scripts/native-replay-fixtures.ts` and `scripts/verify-browser-replay.ts` for the new state/results. Do not “fix” old replay fixtures to make them pass new mechanics.

Current marketing/deck reference audit found dated gameplay clips in `submission/2026-09-27/` and `submission/2026-09-29/`. Preserve those dated packages. Once knife gameplay is accepted, recapture real gameplay and generate a new deck/store package; refresh active links instead of merely relabeling shooting footage as knife combat. Apply the same rule to standalone design/demo HTML pages and their recorded GIFs under `design/`.

## 8. Compatibility and rollout

1. Snapshot current rules, revision-14 campaign definitions, replay fixtures and bundle fingerprints before gameplay edits. Do not rely on revision number alone.
2. Add revision 15 behind the level definition. A local preview flag may select an unranked demo; it must not alter a paid/ranked run independently of its contract.
3. Preserve old simulation and help for existing runs, old APK claims and the currently frozen weekly competition. The new knife-only player experience therefore has a temporary legacy-week exception until cutover; communicate it clearly.
4. Validate new campaign locally. Generate backend rules/bundle, then deploy backend support BEFORE releasing an APK that submits the new rules hash. Do not deploy during this planning task.
5. Start knife-only weekly missions at the next chosen Monday 00:00 UTC after the client is available. If that future week was already frozen, choose a later unfrozen week; do not overwrite it.
6. Avoid mixing gun and knife attempts on one leaderboard. Existing saved entries finish under their pinned rules; new entries use the correct engine/generator. Block incompatible old clients with a clear update message before consuming an attempt/payment.
7. Existing campaign stars, collected phones, purchases and credits remain. Replaying a mission after the update cannot award already-claimed credits twice. Keep lifetime bests; if showing comparable per-rules best times, store them separately rather than comparing different combat modes silently.
8. Rollback selects the previous version for new unranked/campaign starts or a future competition, while backend keeps verifying already-issued revision-15 runs. Never remove its verifier once runs have been issued.

## 9. Acceptance gates

Automated:
- No owner=-1 projectile ever created in revision 15; no player gunshot counter/cue increments.
- Far tap approaches; moving target follows; no damage out of reach or across walls/gates.
- One impact per swing; no duplicate damage from frame stalls, rapid taps, pause/resume or reload.
- Floor cancel works before impact; target death and scene changes clear action safely.
- Front/side/rear armor checks use impact geometry; unaware requirement cannot be farmed by rapid retargeting.
- Drone charge interruption versus completed broadcast is correct; no chase-forever unreachable drones.
- Guard gunfire still works. Opening stagger cannot stun-lock armor. Shared sighting remains effective.
- New local and server replays match exactly, including mid-swing serialization and deterministic RNG. All prior frozen fixtures retain results.
- All twelve campaign objectives, contact positions, gates, switches and returns are reachable. Multi-week generated levels pass melee feasibility checks, including double haul and timed exits.
- Tutorials show contact damage, not ranged damage. Copy audit allows enemy shooting and historical references, rejects courier shooting in revision-15 active surfaces.

Interactive:
- Actually play all twelve campaign missions, not just run pathfinding. Record failed approaches and tune cover/telegraph timing.
- Test default plus every outfit/Solana skin in all four directions; hand alignment, knife occlusion, health bars, heavy reach, carried phone and defeat visuals.
- First-time and returning-player teaching, skip/replay, background/foreground, pause in wind-up, checkpoint resume, spam taps, compact screen/safe areas.
- Measure frame time/path solves on web and a physical Android phone where available. No broad claim of Android smoothness based on browser results.
- Confirm sound variants, armor cue, muted sound with haptics enabled, and reduced-effects mode.
- Verify campaign credit claim, old-version delayed claim, old paid run resume and new unranked/fixture weekly submission without spending funds.

Deliver a screenshot/video QA report with pass/fail/blocked status. Existing 349 passing tests describe the current shooting build, not proof that this proposed redesign works.

## 10. Implementation order after approval

A. Freeze compatibility, define revision-15 state and deterministic melee in a small test arena.
B. Prove close approach, cancel, hit timing and enemy fairness; test normal guard, drone and Heavy before map-wide tuning.
C. Generate knife assets, build directional attack presentation, add audio/haptics and verify all skins.
D. Rebalance twelve missions and future weekly generator, then rebuild all teaching demos and current copy.
E. Run full local/server suites, interactive web/mobile QA and new gameplay capture.
F. Deploy matching backend support, release tested client, then activate a new knife weekly competition on its scheduled boundary.

No implementation or generation is authorized by this plan-only request. Begin those steps only on the next instruction to execute.
