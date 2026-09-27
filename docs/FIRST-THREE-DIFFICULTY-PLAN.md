# First three missions: meaningful resistance

Date: 2026-09-24. Status: proposed; no gameplay changes made in this pass.

Follow-up: the user requested a stronger immediate increase. See `GUARD-PRESSURE-UPDATE.md` for the implemented tuning and measured results; the remainder below preserves the original proposal.

## Objective

Make the opening three missions demand observation, cover and a deliberate escape plan. A player should be able to explain the decision that earned their win. Repeated deaths alone do not establish depth, and judges are not guaranteed to play exactly three missions.

Keep the controls responsive, the existing palette, cosmetic-only skins, and current reward amounts. Difficulty must come from encounters and enemy competence rather than purchases, extra health bars or invisible threats.

## What the current code actually does

- `src/game/heist-layouts.ts` excludes mission 1 from the newer encounter system. Its guided combat still uses the older rules. `src/onboarding/combat-guide.ts` dictates eight actions, including enemy selection and extraction, rather than asking the player to solve the whole encounter.
- In missions 2–3, courier movement is 4.1 tiles/second, or 3.15 carrying the phone. Guard pursuit is 2.05: half the unloaded courier's speed and slower even during extraction.
- Courier attack range is 4 tiles; early scout vision is 3.5. Normal guards have 50 HP and the courier deals 25 every 12 simulation ticks (0.4 seconds). Early guards aim for 29 ticks (about 0.97 seconds) after detection/reaction and deal only 12 damage per hit.
- Guards stop moving throughout aiming and firing. Increasing their nominal pursuit speed alone will not fix how little ground they gain during combat.
- Missions 2–3 have no pickup reinforcement entries. Surviving enemies can react to the theft, but killing the initial group leaves an empty return journey.
- The latest guard system already shares confirmed sightings with all deployed enemies and keeps them hunting after contact is lost. That feature must be preserved, not presented as a new fix.
- The earlier encounter report recorded direct objective runs escaping missions 2–3 with 88–100 HP. Those are historical automated probes, not a fresh balance test of this proposal or human difficulty measurements.

Sources: `src/game/combat.ts`, `src/game/heist-guards.ts`, `src/game/heist-layouts.ts`, `src/onboarding/combat-guide.ts`, `docs/HEIST-ENCOUNTERS-TEST-REPORT.md`.

## First three encounter designs

### 1. First Pickup — separate the pair

Teach movement and one rear attack in a short opening pocket, then release control. Do not guide every subsequent tap. Move this mission onto the same current combat rules as the rest of the campaign; keep the existing guided tutorial available separately and migrate its completion state safely.

The real encounter has two guards on opposite approaches to one cover island. Their patrols briefly separate. One watches the short route to the phone while the other can see a player who stands still and shoots from the obvious corner.

The player can wait for separation and flank, or deliberately attract one guard and circle the island. The longer route provides observation and cover, but still contains a watched crossing: walking around the perimeter must not solve the whole mission automatically.

Taking the phone announces one guard arriving through a visible entrance. The courier must choose a covered return or a shorter exposed dash. The entrance cannot coincide with the player, and the response must arrive soon enough to matter.

Intended realization: “I waited until they split, then used the wall to escape.”

Initial budget: two active guards plus one pickup response. Target successful run, excluding the control lesson: 25–40 seconds.

### 2. Blind Corner — interrupt the alarm

A moving drone scans a crossing while a guard covers the easiest firing position. A second guard protects the phone approach. Position the drone so the player cannot safely remove every threat by standing outside its detection range.

Show the drone's scanning and reporting stages clearly. Give the player time to break sight or defeat it before its first broadcast completes. One route offers a fast crossing during a scan gap; the longer route lets the player isolate the covering guard before approaching the drone.

If the broadcast completes, all deployed enemies join the hunt. After the phone pickup, one announced reinforcement pressures the obvious return corridor, leaving a readable alternative around cover.

Intended realization: “The drone is the alarm. I broke its sight, dealt with its cover, and got through.”

Initial budget: two guards and one drone plus one pickup response. Target successful run: 35–55 seconds.

### 3. Crossfire — break mutual cover

Two encounters separated by a small observation pocket. The first pairs two scouts around cover. The second pairs a burst-firing sentry with a drone. Both routes should be visible enough to plan, without having a permanently unguarded outer lane.

Stagger patrol phases so there are usable openings rather than constant overlapping cones. A frontal attack while both enemies have sight must be dangerous; circling cover to isolate one should remain effective. Preserve fast, satisfying rear takedowns.

The pickup introduces one announced guard on the return route. Combine that response with surviving enemies; do not add an unlimited wave or spawn enemies behind the player. Extraction is the final decision, not a walk across an already cleared map.

Intended realization: “I broke the crossfire and saved the other corridor for my escape.”

Initial budget: three guards and one drone plus one pickup response. Target successful run: 45–70 seconds.

These are playtest targets, not required completion times or new hard timers. Beating the target time improves mastery; it should not be needed for an ordinary clear.

## Combat tuning to prototype

All values below are starting hypotheses. Change and measure one group at a time so we know what caused an improvement or a regression.

| Parameter | Current missions 2–3 | Mission 1 trial | Mission 2 trial | Mission 3 trial |
| --- | --- | --- | --- | --- |
| Scout pursuit, tiles/second | 2.05 | 3.1 | 3.35 | 3.5 |
| Scout vision, tiles | 3.5 | 4.5 | 4.6 | 4.8 |
| Initial detection time | 0.45 s | 0.40 s | 0.35 s | 0.30 s |
| Scout/sentry aim time | 29 ticks | 24 ticks | 21 ticks | 20 ticks |
| Damage per enemy bullet | 12 | 20 | 22 | 25 |

Keep courier speed at 4.1/3.15 and scout HP at 50 initially. Keep patrol movement slow and readable. Preserve a visible aim tell and the final six ticks of committed aim so the player can dodge deliberately. A sentry's second shot must be communicated through its distinct appearance and firing tell.

Changing numbers alone is insufficient:

1. Allow collision-safe closing movement during the tracking part of aim; plant briefly for the committed shot. Stop at a sensible engagement distance rather than running into the courier. Verify aim feedback moves with the attacker.
2. During recovery, a guard with a visible target closes distance or takes a reachable nearby firing angle. It must not return to a patrol waypoint or use an obsolete target position.
3. Alerted guards stay in the hunt. Use separate approach points and spacing so every pursuer does not form one easy single-file line. All act on shared sightings; none can see through walls or read the hidden courier's live position.
4. Keep search uncertainty after line of sight breaks. Pressure comes from checking plausible exits, not perfect hidden tracking.
5. Constrain patrol variation to authored useful anchors. Randomness must not accidentally leave every entrance empty or seal every route at once. Seed it for replay verification.
6. Coordinate pickup entry timing with actual escape length. Start with the existing warning system and reject placements where the player can extract before the response engages. Never spawn inside the player's safety radius.

Do not add reload controls, an AI service, or harder health sponges in this pass. The existing local state machine and pathfinding are sufficient for these changes.

## Build order

1. Capture a baseline on the current rules with three strategies: direct objectives, stationary frontal shooting, and deliberate cover/flanking. Record wins, HP, detection, kills and time across repeatable patrol seeds. Existing tests establish correctness and solvability, not fun.
2. Add per-mission combat profiles rather than more scattered `number <= 3` branches. Implement pursuit/aim movement and spacing independently of the new layouts. Keep the current rules bundle available to validate older runs.
3. Prototype mission 1 fully, including the shortened control lesson and pickup response. Test it on Android before spreading the same assumptions to missions 2–3.
4. Author and test missions 2–3 using the encounter descriptions above. Make sure at least two intended approaches remain viable, with room for human timing error.
5. Audit missions 4–12 against the new opening. Mission 4 must not become an obvious difficulty collapse. Escalate combinations and exposure gradually, not every stat at once. Preserve specialized later mechanics: heavy rear weakness, multiple pickups, gates and extraction timing.
6. Bundle compatible client/server rules and verify them together before release. Existing weekly competition rules and accepted scores stay frozen; activate the difficulty changes for new campaign runs and future weekly rules only after validation.

## Acceptance criteria

### Logic and simulation

- Repeated direct-objective and stationary frontal-shooting strategies should stop producing easy, near-full-health clears across the opening. Do not demand that a lucky blind run can never win.
- At least two approaches per mission are reliably solvable across tested patrol seeds using human-sized timing windows, not frame-perfect input.
- Test moving targets during aim/recovery, close reacquisition, wall occlusion, drone broadcast cancellation, interrupted pickup, reinforcement safety and multi-guard path congestion.
- Keep seeded simulation, server replay compatibility, and the existing path-planning budget. Profile tap spam and multiple simultaneous pursuers on a physical Android device.

### Human playtesting

Use 10–15 people who have not learned the maps, plus a few experienced players. This is a directional usability sample, not statistically precise proof of retention.

Starting first-attempt clear-rate hypotheses: mission 1 roughly 60–70%, mission 2 45–60%, mission 3 30–45%. Reconsider these if players stop rather than retry. Most mission-1 players should be able to improve and clear within a few attempts.

Record attempts, abandonment, damage causes, chosen routes, completion time, and voluntary replay. Ask one useful question after a win: “What did you change to get through?” If the answer is “nothing, I just kept tapping,” the encounter still fails even if the win rate is lower.

Make retries short. Explain the immediate cause of failure with an actionable existing cue, such as the drone broadcast or an exposed crossing. Reuse the current results screen instead of adding a tutorial modal after every loss.

### Definition of done

A new player encounters real pressure during mission 1, understands a mistake, and can use a better tactic to win. Missions 2 and 3 demand different decisions. The build remains smooth on Android, campaign rewards and claims still work, and the rollout does not change the rules underneath a live weekly competition.
