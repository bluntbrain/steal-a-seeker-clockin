# Steal a Seeker: tap movement and combat

Research and design · 16 September 2026. The core redesign is now implemented. See [COMBAT-V2-TESTING.md](COMBAT-V2-TESTING.md) for the shipped scope, checks, and remaining human playtesting. The original design targets below are not claims of measured retention or performance.

## Decision

Build a one-finger, 2D heist game: **tap to move, tap a guard to shoot, take the phone, escape the lockdown.** Remove Distract. Remove the joystick and dedicated Take/ACT controls in this version. Remove manual Dash initially; movement must feel good without another unexplained ability. Keep our courier, collectible phones, three districts, cosmetics and weekly competition.

This is a combat redesign, not a small control change. Prove one mission before rebuilding twelve. Difficulty is useful when players understand their mistake and want another try. A high loss rate alone is not proof of fun.

## Research: what is verified, and what is not

Checked public store listings, developer descriptions, published play reports and the current repository. I did not install or personally play the competitor, measure its timings, or inspect its source. Older play reports describe their version, not necessarily the September 2026 build. All numerical combat values below are our proposed tuning, not reverse-engineered competitor values.

| Source | Evidence | Design implication |
| --- | --- | --- |
| [Hunter Assassin on Google Play](https://play.google.com/store/apps/details?id=com.rubygames.assassin&hl=en) | Ruby Games AS; 500M+ download band; 4.2 rating; approximately 4.38M reviews in the headline at retrieval. Describes a knife-led stealth game, unlockable characters, traps and changing environments. | Large historical reach supports studying it. It does not prove our audience will pay, or establish its current retention. |
| [Hunter Strike on Google Play](https://play.google.com/store/apps/details?id=com.rubygames.hunterassassin2&hl=en) | The Hunter Assassin 2 package is now titled Hunter Strike. 10M+ download band, 4.1 rating, approximately 116K headline reviews. Developer calls it a 2D tactical shooter, with heroes, weapons and bosses. | Our shooting proposal is closer to this sequel than the original knife game. Download bands are cumulative and not comparable retention measurements. |
| [Touch, Tap, Play: hands-on control guide](https://www.touchtapplay.com/hunter-assassin-cheats-guide-tips-to-complete-all-levels/) | Describes tapping destinations, tapping guards, automatic routing, visible patrol cones and changing destinations behind cover. | The interesting input is choosing a position and moment, not holding a stick. Navigation mistakes can undermine the entire experience. |
| [UnGeek: hands-on review, August 2020](https://www.ungeek.ph/2020/08/we-play-games-from-ads-so-you-dont-have-to/) | Describes beginning inside level 1 with a tutorial, eliminating guards, nearby enemies reacting, and character progression. | Teach with one real action at a time instead of an instruction screen. This is historical evidence, not a verified current tutorial specification. |
| [Rovio: 2021 financial statement](https://www.rovio.com/articles/rovios-financial-statement-bulletin-2021-published/) | Identifies Hunter Assassin 2 as Ruby's hybrid-casual soft launch. | Do not treat two different products and eras as one identical design. |
| [Gameplay reference, levels 1–15](https://www.youtube.com/watch?v=sR2HJaV2-3U) | Public gameplay video reference published August 2025. | Provided for comparison; footage was located, not watched or timed in this research. |

### Feedback worth testing against

On the Hunter Strike listing, a May 2022 reviewer disliked replacing destination taps with a joystick; a September 2023 reviewer preferred the added control but mentioned tight corridors. A March 2022 reviewer described accidentally activating weapons while moving. These are three anecdotes, not a representative user study. They support testing clear tap targets and separating UI from the board.

Visible Hunter Assassin reviews criticise frequent ads and paid progression. They do not establish a conversion rate. Our paid pass should provide uninterrupted retries; paid cosmetics should not alter ranked strength.

### The transferable loop

Observe patrol → choose cover → approach or attack → react to alerted enemies → clear the objective → retry or play the next layout. My inference: its strongest transferable feature is a small input vocabulary that produces readable consequences. Steal a Seeker keeps a distinct objective: getting the phone out, not just clearing an enemy counter. Use original maps, characters, UI and audio; no competitor asset extraction is needed.

## Exact controls

| Tap | Result | Feedback |
| --- | --- | --- |
| Open floor | Move along a valid path; cancel attack/pickup order | Mint destination ring and a short fading path |
| Another floor position while moving | Replace the previous destination immediately | Ring moves; courier smoothly changes course |
| Courier | Stop; cancel current command | Small stop ripple, no extra button |
| Visible guard | Select that guard, reach a firing position if necessary, then fire automatically while stationary | Target ring and health pips; short route shown when approach is needed |
| Phone | Walk to the pedestal and pick it up after a 0.4s stationary interaction | Filling pickup ring; then alarm |
| Exit while carrying | Walk there and extract after 0.8s in the zone | Exit chevrons and progress ring |
| Switch in later missions | Walk to its interaction point and activate once | Visible connection to the gate |
| Wall or unreachable point | Do not replace a valid order with an impossible one | Brief crossed ring; no repeated toast |

No unattended auto-attack: the courier must not break stealth just because a guard entered range. An attack continues only against the selected guard; after a knockout it stops. Moving cancels firing immediately. A guard disappearing behind cover stops firing and clears the target with a brief “Behind cover” cue. No chasing unseen guards around the map. An off-screen or fully occluded guard cannot be selected.

A target outside firing range gets one bounded approach to the nearest reachable firing position with line of sight. This route is geometrically valid, not guaranteed safe. The game must not secretly solve patrol avoidance. If none exists, reject the command. Display a minimum 44dp selection area where practical; resolve overlapping targets by nearest visible centre, deterministic tie-break by entity ID. Do not put the HUD over selectable lanes.

Double taps must not produce two shots or two pickups. Commands use monotonic sequence numbers. Tapping the HUD must never issue a world command. Use actual board bounds, safe areas and letterboxing when converting screen to world coordinates.

## Combat that is easy to read

Courier: **100 HP**, one pulse pistol, same base stats for everyone. Shots do **25 damage**, one every **0.4s**, range **4 tiles**. Infinite shots, no manual reload or ammo economy in v1. Shooting requires stopping. One quiet opening shot is possible; shots alert nearby guards toward the sound, so firing into a group is risky. No random misses, critical hits, headshots or paid damage boosts in v1.

Friendly pulses are mint/white; enemy shots orange; targeting warnings amber; damage red. Use visible projectiles rather than instant invisible damage. Ray/segment collision checks between successive projectile positions prevent shots passing through cover. Walls block both vision and bullets. Initial assumption: all substantial cover blocks both; avoid low-cover exceptions until the core is understood.

Only selected, recently damaged or actively aiming enemies show health pips. Show the courier's compact health bar near the top. A hit briefly flashes the damaged sprite, not the entire board. Knocked-out robots spark and power down; they stop seeing, shooting, colliding and blocking exits. Their bodies are visual only.

### Enemy roster — starting balance to test

| Guard | HP / shots | Distinct behaviour | Readable warning / counter |
| --- | --- | --- | --- |
| Scout | 50 / 2 | Fast patrol; single 20-damage shot | Narrow silhouette; 0.9s aim cue. Break sight behind a crate. |
| Sentry | 75 / 3 | Holds an angle; two 15-damage shots, 0.2s apart | Square shoulder shape; 0.8s cue, then fixed-direction burst and 1.1s recovery. Move during recovery. |
| Heavy | 150 / 6 | Slow; three 10-damage shots in a fixed spread | Large plated silhouette; 1.2s aim cue and 1.4s recovery. Flank instead of standing in the lane. |
| Warden | 200 / 8 | Final-mission elite combining two authored firing patterns | Distinct antenna and large silhouette; 1.4s cue. No new mystery button or invulnerable phase. |

Tutorial drone: 25 HP, does not fire. It exists to demonstrate one tap and a knockout. Teach a real shooting Scout immediately afterwards. HP alone is not variety; each guard needs a different exposure window and movement problem. Start prototype with Scout and Sentry. Heavy follows after those feel good; Warden is last.

### Guard state machine

Patrol → suspicious → investigate sound/last seen position → acquire target → aim → fire burst → recover → search or reacquire. Knockout can interrupt any living state.

Before firing, a guard needs unobstructed sight and a visible aim cue. Target direction locks shortly before release; bullets never turn after firing. Breaking line of sight cancels an unfinished aim, while bullets already fired continue and collide normally. No shooting through a wall just because a radio report gave a location.

Several guards must not erase all health on the same tick. Start with 0.2s global damage grace, identical for every player and encoded in the rules. Test this against burst rates rather than hiding it as an undocumented exception.

## Phone theft and escape

Before pickup, movement and sound drive local suspicion. At pickup: distinct theft sound, one clear red edge pulse, “PHONE TAKEN · GET OUT”, then a small persistent alarm indicator. Avoid a continuous opaque red wash.

The old alarm multiplies guard speed by 2.2–2.8. **Do not stack that unchanged with new ranged attacks.** Start combat lockdown at 1.35× patrol speed, ramping to 1.5× after 10s. Scouts may approach the courier's carrying speed, but Heavy remains slower. Move toward last seen/sounded position; phone radio snapshots every 4s remain an explicit mechanic with a visible ping. No continuous invisible tracking through walls.

Retain the existing objective: escape with the required phone(s). Side guards may be bypassed. Do not require killing everyone just to allow extraction. Otherwise stealing the phone becomes a formality after all threats are gone.

For later levels, finite reserve guards enter through marked doors after theft. Announce door lights and a countdown for 2s; never spawn on the player or in an unmarked lane. Reserve count, timing and entry locations are pinned to the mission. No endless respawns. Tutorial uses one slow reserve solely to teach the alarm and escape.

## First mission: teach by completing a heist

Target first guided escape: 60–90s. This is a design target, not a measured result. Use a small 8×12-tile room with generous lanes, one corner of cover, a drone, a Scout, a phone and a visible exit. Skip complicated circuits. The HTML storyboard shows the sequence, not production gameplay.

| Step | On-screen words | Player action / advance condition |
| --- | --- | --- |
| 1 | “Tap here to move” | Pulsing floor ring. Advance when the courier reaches it, not when the tap occurs. |
| 2 | “Stay behind cover” | Highlight the next safe corner and briefly show the Scout's sight cone. Advance on arrival. |
| 3 | “Tap the robot to shoot” | Highlight tutorial drone. Route, aim and automatic shots run through real combat code. Advance on knockout. |
| 4 | “Red line? Move!” | Real Scout begins a slow 1.4s aim. Highlight a safe floor point. Advance after dodge/broken sight. |
| 5 | “Tap the guard” | Two shots disable the Scout. Advance on confirmed knockout. |
| 6 | “Take the Seeker” | Highlight phone. Automatic approach and pickup; no Take button. |
| 7 | “Alarm! Tap the exit” | One marked reserve enters after 2s; help the player complete extraction. |
| 8 | “Seeker recovered” | Show recovered phone, then Next heist. No tutorial points on the leaderboard. |

Pause the simulation while introducing a new instruction; resume when the player gives the instructed command. Do not run a timer against unread guidance. Tutorial uses protected checkpoints: on failure show “Try that move again” and reset just that step, instead of pretending they won or charging for a retry. After ~5s idle, pulse the correct target. After two failed attempts, preview the route once. Keep pause, sound and Skip tutorial accessible. Skipping grants no completion, currency or ranked advantage.

Persist `tutorialVersion`, completed step and completion status; resume without repeating solved steps. Tutorial replay is available in Settings. Show only one sentence and one highlighted target at a time; do not dim the target itself. Position the callout away from the user's finger. Support text enlargement and reduced flashes.

**Recommendation to approve when implementing onboarding:** let everyone play this one training heist before wallet/payment, then present the pass for campaign and weekly access. This is a proposal to replace the current paywall-first entry, not an already-applied price change. A player who does not understand movement is not ready for a payment prompt.

## Twelve missions with different problems

Counts include initial + finite reserve enemies. Exact counts and timings are provisional.

| # / district | Enemies | New problem | Winning lesson |
| --- | --- | --- | --- |
| 1 Warehouse / First Pickup | Drone + Scout; 1 reserve | Guided taps, shots, cover, theft | Complete the guided heist |
| 2 Warehouse / Blind Corner | 3 Scouts; 0 reserve | Turn a corner and choose the first target | Attack one guard without exposing yourself to two |
| 3 Warehouse / Crossfire | 2 Scouts + Sentry; 1 reserve | Two firing lanes cover the phone | Break one lane before crossing |
| 4 Warehouse / Loading Lockdown | 2 Sentries + Scout; 2 reserve | Phone unlocks the short return gate | Plan the escape before pickup |
| 5 Rooftops / Skybridge | 2 Scouts + Sentry; 1 reserve | Long lane between roof cover | Move during a firing recovery window |
| 6 Rooftops / Heavy Watch | Heavy + 2 Scouts; 1 reserve | Durable guard holds the direct route | Use the longer flank, not damage trading |
| 7 Rooftops / Split Route | 2 Sentries + 2 Scouts; 1 reserve | Two valid approach routes | Choose safe-long versus exposed-short |
| 8 Rooftops / Twin Relay | Heavy + 2 Sentries; 1 reserve | Two phones and two trips | Manage health across both pickups |
| 9 Powerworks / Dark Circuit | 2 Scouts + 2 Sentries; 1 reserve | Switch changes one patrol route and opens a gate | Read the shown switch-to-gate connection |
| 10 Powerworks / Vault Window | Heavy + 2 Sentries + Scout; 1 reserve | Exit opens on a visible countdown | Time the theft to meet extraction |
| 11 Powerworks / Security Grid | Heavy + 2 Sentries + 2 Scouts; 2 reserve | Alternating cover lanes | Sequence kills, movement and the return route |
| 12 Vault / Last Seeker | Warden + Heavy + 2 Sentries; 2 reserve | Compact elite fight, then extraction | Apply existing mechanics; no unexplained surprise |

Use warehouse warm concrete and racks, blue rooftop surfaces/vents, and green industrial conduits/vault doors. Art and collisions must agree; decoration outside walkable lanes can be rich, fighting space must be readable. Keep 2D. Larger actors and wider lanes matter more than another 3D render. Target 45–120s for normal runs; shorter early missions are fine.

## Minimal UI and sound

Keep the existing three home tabs. In a run, use a 44–48dp top row: pause, short mission label, phone count and player HP; timer only for ranked/time challenges. The rest is the board. Remove bottom joystick, Distract, Take and Dash rows. Back/restart/help live inside Pause. No chat bubbles, health numbers or repeated objective text covering lanes.

Nine sound families: accepted tap, rejected tap, courier shot, guard aim warning, enemy shot, shield/health hit, knockout, phone theft/lockdown, extraction. Use three short variations for repeated shots, deterministic gameplay unaffected by random audio selection. Cap concurrent effects, duck ambience under warnings, and give phone theft a recognisable two-note cue. Render muzzle flashes and impact sparks from pooled effects. Backgrounding stops simulation and audio according to ranked rules; returning never grants free health or wipes incoming bullets. Sound is optional: every meaningful cue has a visual equivalent.

## Weekly competition and monetisation

Keep three same-condition weekly missions, unlimited practice and five ranked starts per mission. No paid retries, weapons, damage, range, HP or speed advantages. Sell courier outfits and visual trails only. Tutorial and practice never enter standings.

Proposed combat score for a completed run: 5,000 extraction + up to 3,000 time + up to 2,000 remaining HP = 10,000 maximum per mission. Formula uses integer simulation ticks and integer HP. Time bonus is `floor(3000 * max(0, budgetTicks - ticks) / budgetTicks)`, HP bonus `floor(2000 * hp / 100)`. No kill points or infinite kill farming. Best score per mission counts, then total ticks for tiebreaks; identical performances share rank. Freeze rules for a week and compare only the same rules version. We must replace the current battery-based bonus deliberately.

Clearing maps provides progression and phones; weekly route mastery supplies return visits. This still needs playtesting, not an assumption that tokens create retention. Multiple wallets can currently receive separate attempts: removing the tester restriction does not create a one-person identity system. Before funding leaderboard prizes, settle how duplicate-wallet participation is handled and state it plainly. Token payouts remain inactive; no reward multiplier promise is added by this design.

## Repository work and compatibility

Existing strengths to reuse: Skia 2D renderer, 30Hz fixed-step simulation, collision helpers, guard pathfinding and sight occlusion, versioned rule bundles, replay validation, paid ownership and weekly database records.

| Area | Current state | Required work |
| --- | --- | --- |
| `src/GameScreen.tsx` | Joystick plus tool/interact/dash gestures | Board tap hit testing, target/route feedback, clean HUD; no old control handlers leaking into taps |
| `src/game/navigation.ts` | Bounded deterministic half-tile BFS, used by guards | Reuse it first. Add reachable destination projection, attack approach and dynamic-gate replanning. Do not replace it with a more complex algorithm before profiling. |
| `src/game/simulation.ts` | Exposure becomes caught; no combat HP | Command state, HP, projectiles, damage, cooldowns, knockout, automatic interaction and objective events |
| `src/game/guards.ts` | Patrol/investigate/search/return; no gun health state | Typed enemy stats, aim/fire/recover, sound investigation, last-known position and finite reinforcements |
| `src/game/level.ts` | Twelve stealth layouts and decoy fields | New authored combat layouts, wider lanes and explicit reserve entries; keep old versioned definitions |
| `shared/replay.ts`, `server/replay.ts` | v1: axes + interact/dash/decoy flags | v2 typed commands at simulation ticks: move point, target entity, interact object, stop. Bounded coordinates, IDs, command count and tick count. |
| `src/game/recording.ts`, replay workers | Records v1 controls | Record commands, reconstruct damage/HP on server; never accept client kill totals or final score as proof |
| `server/rules-version.ts`, rule bundles | Hashes a fixed file list | Include every new navigation/combat/tuning dependency in rule hashing and bundle closure. Preserve v1 replay parsing and historical bundles. |
| League manifests / SQL | Existing active weeks and old result records | Add rules/combat version; health/damage/shots results and tutorial state where needed. Keep paid entitlements and historical results. |

New commands are executed once at their recorded tick on both platforms. Use stable entity IDs, stable update/target order, fixed timestep and seeded/pinned layouts. Do not assume JavaScript floating-point/trig paths will match Hermes and V8 perfectly: compare authoritative replay results on both and use quantised/integer combat state where practical.

Handle queued target death, unreachable destinations, gate closing mid-route, simultaneous hits, shots after death, tapping during a sheet transition, pause/background, restore and stale weekly tickets. Abort invalid commands predictably without consuming another ranked start. A native crash cannot be solved by a React boundary alone; test the device renderer and memory separately.

Do not replace the running week's rules underneath players. Ship combat to local/unranked testing first. Publish the new weekly rule set at a clean week boundary; preserve or drain existing verification jobs. Older clients need a clear update-required response for new combat manifests, not a generic failure or lost paid entitlement.

## Delivery order and acceptance gates

1. **One combat slice (roughly 1–2 focused days):** one room, tap path, Scout, HP, shots, cover, pickup and extraction. No production deployment. Acceptance: rapid retaps work, bullets do not cross cover, path never cuts corners, a normal user can explain how to move/attack.
2. **Tutorial + Sentry (1–2 days):** guided first heist, checkpoints, compact HUD, responsive audio. Five fresh testers: at least four finish without verbal help; four can explain why they were hit; three voluntarily retry an unassisted mission. These are proposed go/no-go criteria, not measured outcomes.
3. **Twelve maps and presentation (2–4 days):** adapt layouts, add Heavy/Warden and finite reserves; generate missing sprite frames and balance each mission. Do not approve solely because a bot can finish.
4. **Ranked compatibility (2–3 days):** v2 replay, authoritative combat verification, fixed weekly manifests, scoring, attempts, schema migrations and old-client behaviour. Test forged HP/kill claims, malformed commands, retries, concurrent starts and history retention.
5. **Device and release QA (1–2 days):** Nothing and Realme where available; build/install, long sessions, pause/resume, payment restoration, full campaign and weekly runs. Record actual devices and failures.

Budget: approximately **7–13 focused working days**, not a weekend patch. AI can accelerate code and art; it cannot replace balancing with actual players. Keep the current installed version available while evaluating the slice.

Performance targets: 60fps rendering where hardware supports it, 30Hz authoritative simulation, tap feedback within 100ms, no path search on every frame, no network in the combat loop, bounded projectiles/effects, no React state update for each bullet. Test the worst authored encounter plus 2× stress separately. Record p95 frame times, startup/memory and crash-free session evidence on real phones.

Track tutorial step reached/completed/retried, first unassisted success, death source, damage taken, path failures, time behind cover, shots fired, phone pickup-to-exit time, voluntary replay and later return. Report small samples honestly. No automatic prize activation, wallet spending or public launch is part of this plan.
