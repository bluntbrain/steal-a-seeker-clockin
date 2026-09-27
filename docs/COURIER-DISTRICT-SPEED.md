# Courier district speed — 25 September 2026

Version 0.3.26 (code 29) increases courier movement when entering each new four-mission district.

| Missions | Bonus | Unloaded, tiles/s | Carrying, tiles/s |
| --- | --- | --- | --- |
| 1–4 | Standard | 4.1 | 3.15 |
| 5–8 | +8% | 4.428 | 3.402 |
| 9–12 | +16% | 4.756 | 3.654 |

The bonus follows the selected mission. Clearing or replaying missions cannot stack it. Returning to an earlier district restores that district's pace. Weekly challenges keep their published movement speed for every player. Shooting cadence, guard pace, vision and damage are unchanged.

`src/game/courier-speed.ts` supplies the multiplier to movement and the displayed bonus to the mission briefing. Sprite animation and footstep timing already follow actual distance travelled, so they follow the faster movement without independent timers.

Revision 13 gates the change. Revision-12 definitions still use their original movement; the code-28 immutable verifier and campaign-credit thresholds are preserved. The rules fingerprint includes the new helper, and the backend must deploy the matching bundle before players submit these runs.

## Verification

- 314 client tests and 81 server tests passed; TypeScript and web export passed.
- Movement tests measure actual distance for both unloaded and carrying states across district boundaries. They also check retries, weekly definitions and old revision-12 movement.
- All 12 archived code-28 missions were replayed at three starting delays and compared with their immutable verifier.
- An ordinary-input solver completed all 12 current campaign missions and all three weekly contracts. This proves routes remain possible, not that human difficulty is balanced.
- Browser checks confirmed the level-5 and level-9 briefing labels and visible Play buttons.
- Mainnet APK version, signing certificate, 16 KB ZIP alignment and recorded source hashes were verified. No physical phone test or store submission was performed in this pass.

APK: `releases/steal-a-seeker-mainnet-v0.3.26-code29.apk`.

Release and production verification: `verification/guard-pressure/release-code29.json`.
