# Campaign balance retest — 17 September 2026

All 12 maps remain solvable. The targeted changes improve the reference escapes in 3, 5 and 10–12. Level 7 is still a problem; delaying its reinforcements did not materially improve these trial results. Do not describe the campaign as fully balanced yet.

Baseline rules: `e2520ba24b57fbccd87af7552c5e0febc954a9d5749a776d584f00428de41314`. Retest rules: `79f40a869f1d80dca448cc6566e20c014fea8b26124d2afba5a2eaa736e37fb2`.
Run generated: 2026-09-16T20:42:37.528Z. Based on commit `a69e247540a42a9e8167125ec91f48bf57a0c80d` plus the balance patch identified by the retest rules hash.

## Before and after

HP is from a verified reference escape, not a human average. Shooting combines 24 basic and 24 slower-controller trials. Mild delay means 24 perturbed versions of the reference plan.

| Mission | Change | Reference HP before → after | Shooting wins before → after /48 | Mild-delay wins before → after /24 | Assessment |
|---|---|---:|---:|---:|---|
| 01 First Pickup | Unchanged | 100 → 100 | 47 → 47 | 24 → 24 | Unchanged |
| 02 Blind Corner | Unchanged | 100 → 100 | 34 → 34 | 24 → 24 | Unchanged |
| 03 Crossfire | Reinforcements: 2.2 / 4.4 → 3.5 / 5.7 s | 20 → 60 | 11 → 11 | 0 → 22 | Improved |
| 04 Loading Lockdown | Unchanged | 80 → 80 | 1 → 1 | 1 → 1 | Unchanged |
| 05 Skybridge | Reinforcements: 2.2 / 4.4 → 4 / 7 s | 10 → 35 | 0 → 2 | 0 → 0 | Still a spike |
| 06 Heavy Watch | Unchanged | 50 → 50 | 3 → 3 | 1 → 1 | Unchanged |
| 07 Split Route | Reinforcements: 2.2 / 4.4 / 6.6 → 4 / 6.2 / 8.4 s | 25 → 25 | 0 → 0 | 0 → 0 | Unresolved |
| 08 Twin Relay | Unchanged | 75 → 75 | 4 → 4 | 0 → 0 | Unchanged |
| 09 Dark Circuit | Unchanged | 100 → 100 | 0 → 0 | 7 → 7 | Unchanged |
| 10 Vault Window | Upper sentry stops before the Heavy crossing | 20 → 40 | 0 → 0 | 0 → 1 | Still harsh |
| 11 Security Grid | Right sentry stops one tile before the middle crossing | 30 → 58 | 0 → 0 | 0 → 13 | Improved, still hard |
| 12 Last Seeker | Heavy moves across the middle aisle; scout keeps the lower lane | 15 → 33 | 0 → 0 | 0 → 0 | Still harsh |

## What changed

- Level 3: first reserve arrives 1.3 seconds later; the second keeps its 2.2-second spacing.
- Level 5: waves arrive at 4 and 7 seconds after alarm.
- Level 7: waves arrive at 4, 6.2 and 8.4 seconds after alarm.
- Level 10: upper sentry moves between (1.5, 3.5) and (1.5, 1.5), leaving the Heavy crossing at y=4.5.
- Level 11: right sentry turns at y=6.5, before the middle crossing at y=7.5.
- Level 12: Heavy patrol moves from (4.5, 10.5) to (6.5, 10.5); the scout retains the lower vertical lane.
- Walls, colors, enemy health, damage, movement speed, phone positions and mission timers remain unchanged.

## Verification

- 1,296 controlled trials rerun with the same seeds and controller policies. Every result matches local server replay verification.
- Winning command sequence for all 12 maps, with mission completion, unlock, save serialization and reload.
- All eight tutorial steps still complete with 100 HP.
- Eight seconds of idle input at every spawn still leaves 100 HP.
- Geometry checks pass for patrol segments, objectives, gated routes and alternate cover routes.
- Untargeted missions 1, 2, 4, 6, 8 and 9 have exactly identical map definitions, reference outcomes and profile summaries.
- App tests: 153 passed. Backend integration tests against the local test database: 66 passed. TypeScript and generated-rules checks pass.
- Frozen active-week compatibility: all three live map definitions have the same complete verifier outcomes in the current and archived engine, across six start-delay variants each. Live runs were not submitted.

## Limits and next decisions

These are automated simulations, not human win rates or a complete manual phone playthrough. The reference solver can simulate future outcomes. Basic controllers do not intelligently dodge bursts. Delayed plans do not replan. The solver recomputes its winning route after a change, so the before/after HP figures compare two reference solutions, not necessarily identical tap sequences.

Two alternative patrol placements failed the winning-route search and were rejected. Failure to find a route does not prove impossibility; there was no reason to ship a candidate without a verified win.

### Mission 3: Improved

The reference route leaves 60 HP rather than 20. Mildly delayed plans improve from 0/24 to 22/24, but basic shooting stays at 11/48.

Test whether new players can use the larger escape window without memorizing the route.

### Mission 5: Still a spike

The reference leaves 35 HP rather than 10. Basic shooting improves only from 0/48 to 2/48; both delayed-plan groups still fail.

A longer reinforcement delay helps, but does not resolve the escape spike. Review the upper firing lanes with phone playtests.

### Mission 7: Unresolved

Reference health stays at 25 HP. Basic shooting and delayed-plan trials still have zero wins. A timing delay alone did not solve this map.

Next experiment: separate the guards covering the phone bay, then repeat the same audit.

### Mission 10: Still harsh

Reference health rises from 20 to 40 HP. Only 1/24 mildly delayed plans clears; basic shooting remains 0/48.

Keep the verified patrol separation, then test the approach and timed exit with people.

### Mission 11: Improved, still hard

Reference health rises from 30 to 58 HP; mildly delayed plans improve from 0/24 to 13/24. Basic shooting remains 0/48.

The route has more timing tolerance. Test whether players can discover it without help.

### Mission 12: Still harsh

Reference health rises from 15 to 33 HP, but the winning route is longer. Basic shooting still dies before pickup in every trial.

The opening remains the problem. Test a reduced early Heavy sightline before changing the final Warden encounter.

## Weekly maps

The native app downloads the backend’s frozen weekly map definitions. This update separates engine compatibility from campaign layout changes. The current week remains unchanged; new weeks store an engine fingerprint.

The current generator still remixes a small layout family. It does not create three newly designed dense maps each week. See `docs/WEEKLY-MAP-AUTOMATION.md` for the current flow and proposed validated template/pack pipeline.

## Reproduce

```sh
npm run rules:generate
AUDIT_OUTPUT_DIR=verification/campaign-balance-v5 ./node_modules/.bin/tsx scripts/audit-campaign-v5.ts
python3 scripts/build-balance-report.py
```

Evidence: `verification/campaign-balance-v5/report.json` and the 12 map/replay files beside it. The original audit remains in `verification/campaign-audit-v5/`.
