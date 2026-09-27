# Stronger guards — 24 September 2026

Implemented the requested stronger difficulty pass across all 12 campaign missions. This supersedes the gentler tuning proposed in `FIRST-THREE-DIFFICULTY-PLAN.md`. This pass changes combat pressure and opening patrol/response placement; it does not claim to have completed every proposed encounter redesign.

## Actual tuning

| Missions | Scout pursuit (tiles/s) | Vision (tiles) | Initial spotting | Aim time | Bullet damage |
| --- | --- | --- | --- | --- | --- |
| 1 | 4.1 | 5.2 | 0.24 s | 0.67 s | 25 |
| 2 | 4.3 | 5.4 | 0.22 s | 0.60 s | 25 |
| 3 | 4.5 | 5.6 | 0.20 s | 0.57 s | 25 |
| 4–6 | 4.6 | 5.8 | 0.20 s | 0.57 s | 27 |
| 7–9 | 4.7 | 6.0 | 0.18 s | 0.53 s | 28 |
| 10–12 | 4.8 | 6.2 | 0.18 s | 0.53 s | 30 |

For comparison, previous missions 2–3 had 2.05 pursuit, 3.5 scout vision, 0.45-second spotting, 0.97-second aim and 12 damage. Courier movement remains 4.1 unloaded / 3.15 carrying.

- Drones pursue 0.3 tiles/s faster than scouts. Armored enemies pursue 0.45 slower, and Wardens see 0.3 farther.
- Guards have wider initial vision cones, fewer patrol pauses, and longer gunshot hearing (5.8 rather than 3.6 tiles).
- Scouts now fire two-round bursts; armored enemies retain three rounds. Recovery falls from 27 ticks to 15–18 for ordinary guards.
- Guards close at 85% pursuit speed during the tracking part of aiming. They still plant during the final six ticks and fire along the committed, visible aim line.
- Shots lead current courier movement by at most 0.18 seconds. Enemy projectile speed increases from 13 to 16 tiles/s. Changing direction and using cover remain meaningful counters.
- Drone reporting takes 21–24 ticks rather than 27. The displayed charge ring uses the same threshold as the simulation. Breaking sight or defeating the drone cancels an unfinished first report.
- Existing team-wide pursuit, persistent searches, wall occlusion and safe reinforcement entrances remain active. No new network AI or per-player AI service was added.
- Enemy health, courier controls, palette and cosmetic stats are unchanged.

## Opening missions

Mission 1 now uses revision 11 rather than the old tutorial combat branch. The three-step lesson teaches movement, cover and shooting; the player then completes the mission without forced taps. Its existing control targets remain valid, an extra scout watches the exposed phone approach, and the pickup response enters near the return corridor. The teaching drone faces away initially and stays stationary until alerted; it still has working detection, reporting and pursuit.

Missions 2 and 3 now have one warned pickup reinforcement each. All three opening missions use the same stronger combat system as later levels.

## Verification

- 305 client tests and 81 server tests passed; TypeScript and the web export passed.
- The Android Babel/worklet compilation tests passed, including initialization of the real game modules. This is not a physical-device performance test or a newly built APK.
- Winning ordinary-input replays were found for all 12 campaigns and the three existing weekly contract slots. Campaign wins were checked against server replay and restored client state.
- The recorded before/after objective-only probe uses the same three starting delays per mission, without modifying health, coordinates, enemy state or score:
  - Full campaign: **25/36 wins before → 1/36 after**.
  - Opening three missions: **9/9 before → 1/9 after**.
  - The remaining mission-1 blind clear finished with 50 HP; the other two starting delays were caught.
- New regressions cover wider/longer vision with cover occlusion, drones gaining on a running courier, quicker and stronger fire, movement during tracking aim, locked final aim, interrupted broadcasts and old campaign credit eligibility.
- Published revision-10 campaign replays were compared with their immutable verifier at three start delays for all 12 missions. Existing revision 3/6/7/8/9 compatibility checks also passed.

These are deterministic simulation results, not player win rates. The combat solver can still earn clean early clears by targeting enemies; that is an intended distinction from ignoring them. Test on a physical Android phone before judging touch timing, haptics or frame rate.

Evidence: `verification/guard-pressure/before.json`, `verification/guard-pressure/after.json`, `verification/combat/solvability.json`.

## Release scope

New campaign rules hash: `8325f1cc68a4847c185a412c1c95f5ec00d2e8b41d80950024b27307902d1d19`.

The new immutable replay bundle and manifests are generated. Revision-specific branches preserve older rules, and the shipped 0.3.23 campaign retains its original credit thresholds. Existing frozen weekly manifests are unchanged.

Signed mainnet APK **0.3.24 (version code 27)** is available at `releases/steal-a-seeker-mainnet-v0.3.24-code27.apk`. Its package remains `com.bluntbrain.stealaseeker`, and its signing certificate matches 0.3.23, allowing an in-place update. APK signature, 16 KB ZIP alignment, mainnet configuration and all 263 recorded source hashes were verified. No physical-device installation or store upload was performed in this build pass.

The matching production API deployment `1bdec248-532a-424c-a0e3-76971458d22c` succeeded. Both `/health` and `/health/payments` returned healthy mainnet responses. A read-only check inside the deployed container confirmed the new rules hash, immutable bundle integrity, and successful first/final campaign replays through the production worker, with scores and health matching local results. These checks did not submit paid runs or change player records.

Release evidence: `verification/guard-pressure/release-code27.json`. The 35 older APKs were deleted with user authorization to recover disk space; version 0.3.23/code 26 remains as a rollback copy, alongside the new release. Historical build receipts and signing files were preserved.
