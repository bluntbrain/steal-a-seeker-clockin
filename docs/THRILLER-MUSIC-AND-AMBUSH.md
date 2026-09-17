# Thriller music and rear ambush update

17 September 2026. Implemented in combat revision 6.

## What changes for players

- Each of the 12 campaign missions has its own original instrumental cue. There are 12 distinct 39-second loops, generated with ElevenLabs Music. Warehouse cues use lighter stealth tension, rooftop cues use faster chase rhythms, and powerworks cues use darker pulses. These descriptions are the creative direction supplied to the generator, not a transcription of the Hunter Assassin soundtrack.
- Weekly maps reuse the cue selected by their level number. The current three weekly maps select tracks 1, 5 and 9. Future maps can choose any of the 12 through that same field. Audio is bundled with the app and does not require a streaming connection.
- Music rises slightly after the phone is taken. The alarm, target warning, footsteps and impacts remain separate. The music player fades in, pauses in menus and when the app is backgrounded, and stops on the result screen. Browser autoplay denial is retried at the next player interaction.
- Close proximity behind a guard no longer grants it vision outside its cone.
- A rear opening against an undamaged, unseeing guard before the alarm does 50 damage. A scout has 50 HP; a sentry has 75, so it needs a follow-up. Heavies and wardens keep their higher health.
- Nearby gunfire has a 3.5-tile hearing radius. An unaware guard takes 0.3 seconds to react to noise; armor surviving an ambush gets a 0.4-second stagger, then turns visibly and must complete its aim warning. Subsequent hits do not restart that stagger. Turns are capped at 360 degrees per second.
- Once the phone alarm starts, guards still pursue aggressively. The initial noise delay does not delay an alarm report.
- Confirmed player damage publishes immediately to the HUD. The hit sound and edge-glow callback start together after the sound seek. Missed bullets do not trigger the glow. Muting audio keeps the visual feedback. Reduced-effects mode uses a shorter, weaker edge flash.

## Music source and production

Reference requested: [Hunter Assassin gameplay](https://www.youtube.com/watch?v=raDBMEIr6Uo). YouTube metadata was readable, but its audio download returned HTTP 403. No musical claims were inferred from the title or thumbnail, and no reference recording is bundled in this project.

The original compositions use descriptive prompts rather than an existing melody or artist imitation. Generated with the [ElevenLabs music compose API](https://elevenlabs.io/docs/api-reference/music/compose), model `music_v1`, instrumental mode, 40-second requested duration. A one-second circular crossfade produces 39-second repeatable cues. Mix target: -21 LUFS, -3 dBTP ceiling. Final files are AAC stereo at 44.1 kHz, approximately 9.8 MB combined. The first Opus encoding caused a browser-preview playback problem and was replaced with AAC.

Generation script: `scripts/generate-level-music.py`. It reads only the canonical private credentials file, skips already-generated tracks, and saves original MP3s, final AAC files and generation metadata under `assets/music-v1`. The key is never stored in the repository. Re-running the script with existing source files reuses them instead of buying another generation.

Listen to every track at `/design/soundtrack/index.html`. All 12 files were decoded, measured and played through the browser preview without media errors after the AAC change. The attempted automated subjective listening review did not succeed, so the gallery is the place to judge the creative result.

## Published weekly compatibility

The already-published week of September 14 retains revision 3. Its maps, attempts and scoring rules are unchanged. The client has an explicit compatibility entry for that older engine, backed by comparisons against the archived verifier for winning and delayed runs on all three frozen maps.

Campaign revision 6 applies immediately. Newly generated weeks use revision 6. No weekly score or payment record was reset. The existing Railway API service was updated, not replaced.

## Verification

- 178 game/client tests pass, including the rear-contact, noise reaction, armored response, confirmed-hit timing, and archived-week compatibility regressions.
- 70 backend tests pass against the local test database.
- Automated legal-input runs finish all 12 campaign maps and all three new weekly maps. The same input replay verifies on the server. These are solvability checks, not human difficulty or audio latency measurements.
- Browser gallery: all 12 AAC files return a 39-second duration and no media error; switching tracks stops the previous track.
- Signed Android release build and browser export are generated. Actual speaker/Bluetooth latency and the mix on the user's physical phone still need listening there.

Detailed evidence: `verification/thriller-ambush/`, `verification/combat/solvability.json`, and the current APK receipt in `releases/`.
