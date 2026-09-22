# Scout encounters and cosmetic combos

Implemented for Android 0.3.14 (17) and the local web game.

## Scope

- Campaign levels 2–3: one moving scout drone each. Levels 4–6: two each.
- Existing scanner artwork and sight-cone rendering reused. No new drone art, rotor audio, firing drones or presentation redesign.
- Drones have 25 HP, never fire, follow short closed patrol loops and require 0.8 seconds of continuous sight to report. Reports reach live guards within 4.5 tiles, with a two-second cooldown. Losing sight quickly clears the exposure meter. Drone movement and reports are revision-7-only.
- Guard pursuit, alarm tracking and ambush damage remain unchanged, respecting the exclusions of points 2 and 4. The request also mentioned improved escape-from-detection, so a clarification was asked; that conflicting part was left unchanged.
- Levels 2–6 now have two-enemy encounters around cover islands, a screened regroup alcove between encounters, and screened starting cover. Level 6 adds an upper scout/sentry pair. Reserve arrivals retain a delay instead of adding a simultaneous crowd. Other campaign levels keep their maps.
- Two or more defeats less than four simulation seconds apart, without damage, show a short DOUBLE/TRIPLE TAKEDOWN or CLEAN SWEEP callout and a 380 ms ascending cue. Damage, pause, mission change, restoration and restart reset the chain. This lives entirely in presentation state: no score, health, credit, replay or weekly ranking multiplier.

## Verification

- TypeScript and all 239 game tests passed. All 76 backend tests passed, including concurrent reward deduplication across the previous and current app versions.
- All twelve campaign missions and three weekly missions have successful recorded tap replays, verified by the server code.
- Every new patrol loop is walkable. Both designated regroup points stay unseen during 30 seconds of pre-alarm patrol simulation on each new map. They are not invulnerable zones once an alerted guard searches them.
- Tests confirm that new drones move, die to one shot, cannot fire, cannot report through walls, and do not report to distant guards.
- Frozen revision-3 and revision-6 weekly wins and delayed attempts match their archived verifier. Live weekly maps are not replaced by this campaign update.
- Inspected the actual game at 390×844: maps load, scanner drones render, movement accepts taps; browser error/warning log was empty. No physical Android device was connected, so phone performance, sound mix and haptics remain unverified.

Automated campaign result examples (legal taps, no HP/position overrides):

| Level | Drones | Time | Remaining HP |
| --- | ---: | ---: | ---: |
| 2 — Blind Corner | 1 | 15.2 s | 100 |
| 3 — Crossfire | 1 | 14.9 s | 100 |
| 4 — Loading Lockdown | 2 | 13.2 s | 100 |
| 5 — Skybridge | 2 | 15.0 s | 100 |
| 6 — Heavy Watch | 2 | 19.6 s | 100 |

These prove a winning route exists; they do not estimate first-time player win rates. Level 7 retains its previous difficulty and should be checked with human players for the transition from the easier level 6.

The previous campaign rules hash remains eligible for its original credit thresholds during rollout. Rewards are still capped through the same per-wallet/per-mission star record; installing the update cannot grant those credits again.

Local playtest: `http://127.0.0.1:8787/?build=scout-encounters&testMission=cone-lesson`. Test missions do not save campaign progress or request rewards.

Deployment verified: Railway `60a23433-26b8-4171-9831-3b8884237fc1` succeeded. The mainnet health endpoint passed after rollout, and the active weekly rules hash, engine hash and three contract definitions match the pre-deployment snapshot.

Signed APK: `steal-a-seeker-mainnet-v0.3.14-code17.apk`; package `com.bluntbrain.stealaseeker`; signing certificate matches the existing release certificate. SHA-256: `34422613b27a9a373d00f69ad5d3b3aa42ad85cb5f730bf78b7d371ba4cf1b4f`.
