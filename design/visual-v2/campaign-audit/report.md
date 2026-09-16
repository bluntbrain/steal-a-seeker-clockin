# Campaign difficulty audit — wall maps v5

**All 12 campaign maps are solvable. That does not establish that the difficulty curve is fair.** The biggest change is between missions 2 and 3. Do not increase difficulty globally. Tune the opening and escape spikes, then test with people.

Audited commit: `04e5897244d191969c38ea4b4e71e40f7f053721`. Rules hash: `e2520ba24b57fbccd87af7552c5e0febc954a9d5749a776d584f00428de41314`. Generated: 2026-09-16T20:25:25.932Z.

## What was actually completed

- Re-ran a winning, ordinary-input route for each of the 12 current maps. Every result independently agrees with the server replay verifier.
- Completed all eight tutorial steps in the simulation with 100 HP and two disabled guards.
- Ran 1,296 controlled attempts across five input profiles. These percentages measure these controllers, not human players.
- Recorded each win through the real progress model in mission order, serialized and reloaded it, and verified that the next mission unlocks. All 12 saves passed.
- Eight seconds of idle input at every starting position caused no damage.
- Saved a winning replay, timeline, damage events and map definition for every mission. The HTML report lets you watch each one.
- No map, enemy, damage, payment, account, backend, or live leaderboard state was changed.

## Limits

This is an offline simulation and progress-model audit, not a completed manual browser or physical-phone playthrough. Browser automation was unavailable; a native-browser tutorial input was checked, but that session was then used by the user and was left alone. Rendering, gesture delivery, payment, real-account synchronization and device persistence are not certified by these runs. The replay viewer is a schematic built from recorded positions, not captured game footage.

The best-route solver can simulate future outcomes. Basic shooting controllers only observe the current state and do not intelligently dodge bursts. Delayed-plan tests do not replan if they get into trouble. All three limitations matter: a failed bot is not proof that a person cannot win, and one winning solver is not proof that a new player can.

## Mission-by-mission result

Pressure is a provisional editorial rating, not a measured human difficulty score. The 48 shooting trials combine the two reactive profiles.

| # | Mission | Pressure / 5 | Reference clear | HP left | Shooting clears / 48 | Recommendation |
|---|---|---:|---:|---:|---:|---|
| 1 | First Pickup | 1 | 13.03 s | 100/100 | 47/48 | Keep |
| 2 | Blind Corner | 2 | 15.9 s | 100/100 | 34/48 | Keep |
| 3 | Crossfire | 4 | 20 s | 20/100 | 11/48 | Ease |
| 4 | Loading Lockdown | 4 | 18.7 s | 80/100 | 1/48 | Ease |
| 5 | Skybridge | 5 | 17.5 s | 10/100 | 0/48 | Ease first |
| 6 | Heavy Watch | 4 | 17.5 s | 50/100 | 3/48 | Ease |
| 7 | Split Route | 5 | 19.93 s | 25/100 | 0/48 | Ease first |
| 8 | Twin Relay | 4 | 33.37 s | 75/100 | 4/48 | Ease slightly |
| 9 | Dark Circuit | 4 | 20.67 s | 100/100 | 0/48 | Ease approach |
| 10 | Vault Window | 5 | 17.17 s | 20/100 | 0/48 | Ease approach |
| 11 | Security Grid | 5 | 20.03 s | 30/100 | 0/48 | Ease approach |
| 12 | Last Seeker | 5 | 22.63 s | 15/100 | 0/48 | Ease entry |

## Proposed first adjustment per mission

### 01 · First Pickup

The eight guided taps complete with full health. The simple controllers clear 47 of 48 runs. This is a suitable introduction.

Keep the current tutorial and combat strength. Check that a first-time player understands tapping a guard versus tapping the floor.

### 02 · Blind Corner

The shooting controllers clear 34 of 48 runs. Direct rushing also succeeds in 8 of 12 starts. This still gives room to learn.

Keep the current balance. Do not add guards just because an experienced player can rush it.

### 03 · Crossfire

Shooting-controller clears fall to 11 of 48. The reference route loses 80 HP after pickup. Sentries cause 25 of the 37 controller deaths.

First experiment: delay the first reinforcement from 2.2 to 3.5 seconds. Leave damage and geometry alone for that comparison.

### 04 · Loading Lockdown

Only 1 of 48 shooting-controller runs succeeds, despite an 80 HP reference clear. Forty of the 47 deaths occur in the upper third. Route knowledge matters much more here.

First experiment: turn one upper sentry patrol away from the approach to the phone, so both firing lanes do not cover the crossing together.

### 05 · Skybridge

No shooting-controller or perturbed-plan trial succeeds. The reference clear has only 10 HP left and takes all 90 damage after pickup.

First experiment: move the two reinforcement arrivals from 2.2/4.4 to 4/7 seconds. Keep the roof layout, guard health and movement unchanged.

### 06 · Heavy Watch

Three of 48 shooting-controller runs succeed. Scouts cause 29 of 45 deaths; the Heavy causes 14. The Heavy alone is not the main problem.

First experiment: move one scout patrol away from the Heavy courtyard crossing. Keep the Heavy as the lesson instead of weakening every enemy.

### 07 · Split Route

No shooting-controller trial succeeds. All 48 deaths occur in the upper third, and 40 happen after pickup. The reference loses 75 HP on escape.

First experiment: delay the first reinforcement sentry from 2.2 to 4 seconds. Recheck whether the player can leave the phone bay before the lanes close.

### 08 · Twin Relay

Four of 48 shooting-controller runs succeed. Forty-three of the 44 deaths happen after the first pickup. This requires two deliveries without a health reset.

First experiment: remove the second reinforcement scout. Keep the two-phone objective; it is already a distinct increase in workload.

### 09 · Dark Circuit

The reference clears untouched, and 7 of 24 mildly delayed plans still work. But neither shooting controller clears it; most deaths occur in the middle and before pickup.

First experiment: turn the sentry watching the switch corridor away at the start. Keep the sealed gate and switch sequence intact.

### 10 · Vault Window

No shooting-controller trial succeeds. Thirty of their 48 deaths happen before pickup. The reference waits only 0.73 seconds at the closed exit, so the timer is not the only issue.

First experiment: offset one upper sentry patrol from the Heavy firing lane. Do not increase the mission timer to solve an approach problem. Review the 3-second exit window separately with people.

### 11 · Security Grid

No shooting-controller or perturbed-plan trial succeeds. Thirty-four of the 48 controller deaths happen before pickup; 31 occur in the middle third.

First experiment: stagger the two middle sentry patrols so their aim windows do not overlap on the same crossing. Keep the four alarm reserves for this first comparison.

### 12 · Last Seeker

The reference wins with 15 HP. Every shooting-controller trial dies before pickup; the Heavy causes 26 of 48 deaths. The opening is killing runs before the Warden becomes the focus.

First experiment: move the lower Heavy patrol one crossing farther up. Preserve the Warden and final escape pressure, then retest the opening.

## Why the pressure rises

Most of the campaign shares the same hard combat values. Scouts aim for 0.7 seconds, sentries for 0.6 seconds, and the player needs to stand still to shoot. A shot deals 20–25 damage for the common guards. Extra overlapping guards can therefore remove the health bar quickly.

Taking a phone reduces courier speed from 4.1 to 3.15 world units per second. An alarmed scout starts at 2.9 and reaches about 3.41 after 12 seconds. Guards refresh the courier position every 1.4–1.7 seconds during alarm, even without a current sight line. Cover blocks bullets, but does not make them forget the courier. This explains why more walls alone do not guarantee an easier escape.

The reference clears total about 3 minutes 56 seconds of simulation time, excluding tutorial pauses, menus, retries and loading. Every reference clear already meets its time-star target. Do not shorten the time limits yet: the main pressure is combat, not running out of time.

## Profiles and reproducibility

- **direct:** 12 start delays, objective only, no attacks.
- **reactive:** 24 trials: 6 route/range policies × 4 start/tap seeds; 0.4–0.5 s decisions, ±0.12 world-unit tap error; visible nearest guard, no future simulation.
- **slow:** 24 trials: same policies/seeds, 0.7–0.8 s decisions, ±0.24 tap error.
- **mild:** 24 trials of a known winning command plan; per-command delay 0–0.067 s, initial delay 0–0.5 s, ±0.10 tap error; no replanning.
- **coarse:** 24 trials of a known winning command plan; per-command delay 0–0.20 s, initial delay 0–0.5 s, ±0.22 tap error; no replanning.

Each run starts at 100 HP with the unchanged map and guards. Only taps, reaction interval, route policy and starting delay vary. Randomness comes from deterministic input seeds; the game itself is not randomized. Deaths and timeouts are recorded separately. Runs are checked using the actual server replay-verification function locally, without network transactions.

Run from the repository root:

```sh
./node_modules/.bin/tsx scripts/audit-campaign-v5.ts
python3 scripts/build-campaign-audit.py
```

A controller bug found during the audit was corrected before the final run: side waypoints within the game’s stop-tap radius were skipped, and side waypoints inside walls were discarded. Otherwise controller stalls would have looked like difficult levels. The final reactive profiles have zero timeouts.

## Next balance pass

1. Keep missions 1–2 as the learning phase. Ease mission 3 before adding pressure elsewhere.
2. Prioritize mission 5 escape, mission 7 escape, and the early approaches in missions 10–12.
3. Change one proposed variable at a time, rerun these same seeds, and compare deaths before and after pickup. Do not change speed, damage, guards and cover all at once.
4. Then give the build to five new players on phones. Record attempts to first clear, where they die, whether they understand the death, and whether they retry voluntarily. Suggested starting design targets: guided mission on the first attempt, missions 2–4 within 2–3 attempts, later missions within 3–6. Those are design targets, not industry benchmarks.
5. Verify the complete UI journey on a phone: tutorial → mission unlock → retry → all 12 completed → collection/progress after closing and reopening. This remains outstanding.

## Evidence

- `verification/campaign-audit-v5/report.json`: all 1,296 trial summaries, profile definitions and progress chain.
- `verification/campaign-audit-v5/01-practice.json` through `12-last-vault.json`: current maps, verified winning commands, position samples and event timelines.
- `design/visual-v2/campaign-audit/index.html`: interactive report, heatmaps and replay diagrams.
- `src/game/combat.ts`: aiming, damage, carrying speed, alarm behavior and scoring.
- `src/game/combat-levels.ts`: exact map, patrol and reinforcement definitions.
- `src/progress/model.ts`: completion, stars, unlocks and progress serialization.

No balance changes were applied as part of this report.
