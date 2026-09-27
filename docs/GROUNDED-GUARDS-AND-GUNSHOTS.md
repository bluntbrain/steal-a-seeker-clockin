# Guard pace and gunshots — 25 September 2026

Version 0.3.25 (code 28) responds to feedback that the code-27 guards run unrealistically fast and gunfire lacks a convincing report.

## Movement

| Campaign missions | Old scout pursuit, tiles/s | New scout pursuit, tiles/s |
| --- | --- | --- |
| 1 | 4.1 | 2.85 |
| 2 | 4.3 | 2.95 |
| 3 | 4.5 | 3.05 |
| 4–6 | 4.6 | 3.15 |
| 7–9 | 4.7 | 3.25 |
| 10–12 | 4.8 | 3.35 |

This is a 30–32% pursuit reduction. Drones remain 0.3 tiles/s faster; heavy guards remain 0.45 slower. Patrol movement is also reduced: scouts 1.05 → 0.9, drones 1.35 → 1.15 and heavy guards 0.85 → 0.75. Courier movement remains 4.1 unloaded and 3.15 carrying.

Spotting time, vision, aiming, bursts, shot damage and team pursuit are unchanged. This lets enemies remain alert without outrunning every movement choice. Mission tips no longer claim guards run as fast as the courier.

Revision 12 isolates the new pace. Shipped revision-11 definitions retain their original behavior, pinned replay bundle and campaign-credit thresholds. Existing frozen weekly levels retain their published mechanics.

## Audio and volume

- Four original ElevenLabs gunshot cues replace both courier shots and enemy weapon sounds. The enemy sounds had still referenced the older robot/dart pack.
- New cues are mono 44.1 kHz PCM with 420 ms duration, a quick attack and a short decay. Peaks are -4 dBFS; no clipped samples were found.
- Courier shot gain increases from 0.58 to 0.8 of master volume; enemy shots increase from 0.36 to 0.55. Warnings, hit and defeat cues retain their existing levels.
- New settings default to 100%. The old non-selectable factory value of 65% migrates to 100% and saves. Explicit 25/50/75/100% choices, mute, haptics and reduced-effects preferences remain intact.
- This controls game volume; it does not change the phone's system/media volume.

Source recordings, prompts, checksums and processed WAVs are in `assets/audio-shots-v5`. The reproducible generator is `scripts/generate-shot-audio-v5.py`; it reads the shared private credential outside the repository.

## Verification

- 309 client and 81 server tests passed, including native Babel/worklet compilation, settings migration and old-engine compatibility. TypeScript and web export passed.
- Revision-11 campaign replays were compared against the immutable shipped verifier at three starting delays for all 12 missions.
- The ordinary-input solver completed all 12 campaigns and three weekly contracts. The objective-only probe still won only 1 of 36 attempts; this is a deterministic diagnostic, not a human win rate.
- Browser interaction confirmed Settings displays 100%, mission loading works, and entering the watched lane still triggers pursuit and defeat.
- APK signature and 16 KB ZIP alignment were verified. All 264 recorded source hashes match, and all four new WAVs were located in the APK by their actual content checksums.
- Phone speaker quality, haptic sensation and physical-device frame rate have not been verified in this pass. The sounds were checked for signal integrity; their subjective quality needs listening on the target phone.

APK: `releases/steal-a-seeker-mainnet-v0.3.25-code28.apk`.

Release evidence: `verification/guard-pressure/release-code28.json`.

Production deployment `d849b578-92e9-4985-8e2b-5ea83c46752d` succeeded. Health and payment-health checks returned healthy mainnet responses. The deployed worker verified first/final mission wins against rules `fc58093a3480dc87c58673c20c7cf44e34aa75a87c9c92c839f50c7c797a745a`, matching the APK. No payment, device installation or store submission was performed.
