# Combat v2 — testable build

16 September 2026. This is the implemented first version. The research document contains broader design targets; this file records actual scope and evidence.

## What changed

- Tap floor to move around cover. Tap another spot to change course. Tap the courier to stop.
- Tap a visible robot to approach and shoot it. Moving cancels shooting. It does not fire at unselected targets.
- Courier has 100 HP. Robots have distinct health, aim times and shot patterns: Scout 50, Sentry 75, Heavy 150, Warden 200. Training drone has 25 and cannot shoot.
- Bullets and vision stop at cover. Guards telegraph shots, lock their aim, fire, then recover. Defeated robots cannot attack.
- Tap the phone to pick it up; tap EXIT to leave. Theft activates red edge lights, pursuit and finite reserve guards at marked doors. Reserves wait if the player occupies their entry.
- No joystick, Distract, Take button or manual Dash in the new campaign and weekly missions. Old paid/daily tickets retain their original rules.
- First mission guides each action and freezes while presenting the next instruction. Failed training steps return to a checkpoint. Checkpoints persist locally; restored training never submits a spliced ranked replay. Replay tutorial is in Settings and Pause.
- New installs can play the training heist before wallet/payment. Existing pass ownership and campaign progress are retained.
- Three visual districts, 12 authored combat layouts, two-phone delivery, a switch-controlled vault, timed extraction, heavier guards and finite reinforcements.
- Six new short effects for taps, player shots, guard shots, aiming, damage and knockout. Existing theft, alarm and extraction cues remain. Enemy impacts flash, health bars update, and all essential warnings are visible with sound off.
- Optional local playtest logging now records HP, shots, knockouts, damage and replanning rather than reporting unused Distract charges as actions.

## Mission changes

| # | Mission | Main problem |
|---|---|---|
| 1 | First Pickup | Guided movement, knockout, dodge, pickup, alarm and escape |
| 2 | Blind Corner | Three Scouts around separate cover lanes |
| 3 | Crossfire | Sentry and Scouts cover two approaches |
| 4 | Loading Lockdown | Long rack detour; two reserves after pickup |
| 5 | Skybridge | Additional rooftop rack changes the return route |
| 6 | Heavy Watch | Heavy guard plus a flank around the centre cover |
| 7 | Split Route | Two separated approach lanes and four initial guards |
| 8 | Twin Relay | Two different phone positions; health persists across both trips |
| 9 | Dark Circuit | Tap the switch before entering the enclosed phone vault |
| 10 | Vault Window | Extraction opens for four seconds every eight seconds |
| 11 | Security Grid | Five initial guards, staggered cover and two reserves |
| 12 | Last Seeker | Warden, Heavy, Sentries and two reserves |

These are short arcade rooms. Automated input runs take roughly 12–28 seconds; that is a solver result, not a measured human completion target.

## Weekly competition

Three weekly missions use seeded geometry/phone placement and Blackout, Double haul or Exit window. Five ranked starts each; unlimited practice. Cosmetics do not alter combat stats.

Score for a win: 5,000 extraction + up to 3,000 time + 20 per HP remaining. Maximum 10,000 per mission, 30,000 total. Only the best complete run per mission counts. Total ticks break score ties. Server replays the input to calculate the result; client HP and scores are not trusted.

Replay v2 stores bounded, sequenced tap commands. Historical v1 bundles remain available for old tickets. Native pending-run recovery and browser replay restoration both support v2.

The live test week's old manifest was backed up before replacement. Three abandoned/expired test starts remain in the database. There were no verified scores, pending verifications or unexpired attempts. Combat mission IDs are separate from legacy IDs. Future live competitions must stay frozen once attempts/results exist.

## How to test

1. Open `http://127.0.0.1:8787/?build=combat-v2`.
2. Open mission 1. If guidance was completed before, use Settings → Replay tutorial.
3. Follow each highlighted tap. Then try mission 2 without guidance.
4. Tap a wall during movement: it should keep the valid destination. Tap a guard behind a wall: it should not shoot through cover.
5. Stand in an aim line, then retry and move when it appears. Check that damage, sound and HP agree.
6. Take the phone: check red warning, marked reserve countdown and pursuit. Reach the exit without needing to kill every guard.
7. Leaderboard → Play this week → a mission → Play for score. Finish, return, and reload. Check one chance was used and the result remains.
8. Practice must not consume a ranked chance. Outfits must not increase HP or weapon strength.

The web preview uses local credits and local standings. Android uses the deployed wallet/account service. Real test pricing remains **$0.10**, payable in SOL or SKR. No wallet transfer was made during combat QA. Weekly token prizes remain inactive.

## Verification

- TypeScript check passed.
- 145 game tests and 65 backend tests passed. Additional checks after the vault adjustment covered all combat maps and pinned worker replay verification.
- All 12 campaign rooms and the three current weekly maps have winning input-only recordings with exact server result parity.
- 52 weekly rotations checked for deterministic generation and reachable objectives.
- Browser tutorial completed using actual clicks, with no JavaScript errors.
- Browser ranked mission completed, saved one result/one attempt, and survived reload without errors.
- Signed Mainnet APK built. Separate offline judge build completed all eight tutorial steps on the Android emulator using actual taps, without a crash. Real-device installation depends on USB availability.
- Automated browser training sample measured about 30 FPS while other build/test processes ran. This is not evidence of 60 FPS on a phone.

Evidence is in `verification/combat/`. Scripts: `scripts/qa-combat.ts`, `scripts/playtest-combat.cjs`, `scripts/playtest-combat-weekly.cjs`, `scripts/playtest-combat-native.py`.

## Deliberate first-version limits

The original proposal included an 8×12 teaching room, a second Warden pattern, multiple variations per sound, elaborate sprites, idle hint pulses and a route demonstration after two failures. This version keeps the same 12×20 board/rendering pipeline, uses a single Warden spread pattern, one sample per new effect, existing character art with weapon/hit overlays, and a static highlighted teaching target. Those features are polish, not prerequisites for testing the requested controls and game loop.

Human balancing is still required. A solver winning does not prove a room is fun, and a player losing does not prove it is good. Test first with three to five people who have not seen the instructions. Check that they can explain movement, why they were hit, and why they chose to retry. Physical Phantom approval and a long session on the user's phone remain separate checks.
