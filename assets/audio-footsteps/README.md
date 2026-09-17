# Courier footsteps

Original shoe-on-concrete foley generated with ElevenLabs `eleven_text_to_sound_v2` on 2026-09-17. Prompts and hashes are in `manifest.json`; the MP3 files retain the original generations.

- `step-a.wav`, `step-b.wav`: 240 ms each, mono 32 kHz PCM. Leading silence removed, filtered, normalized to -6 dB peak, with short fades. These are the two bundled game samples (31 KB total).
- `walking-preview.wav`: standalone audition, brisk footsteps followed by a pause and slower carrying footsteps. The game schedules individual steps from movement instead of looping this preview.
- Regenerate with `python3 scripts/generate-footsteps.py`. The script privately reads the shared ElevenLabs credential file and reuses existing generations.
- API reference: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert

## Playback

`src/audio/useFootstepAudio.ts` reads the courier's accumulated travel from HUD snapshots. First movement triggers a step; subsequent steps occur roughly every 1.15 map units, capped at one per 240 ms. Carrying the phone naturally slows the cadence. Two feet alternate. Gunfire/alarms reduce footstep gain.

Standing, blocked movement, pause, tutorial instructions, menus, mute, backgrounding, mission restart and finished runs stop playback. A long update gap discards old travel rather than playing delayed footsteps. No new timers, network playback, simulation rules or guard-hearing changes.

## Verification

- TypeScript and 10 focused audio/lifecycle tests passed.
- Tests cover alternating steps, carrying cadence, stationary movement, mute/pause, win/capture, restart, mission changes and stale updates.
- Browser: started First Pickup, moved across the bottom lane and paused. No warning/error logs during the check.
- WAV decoding: both cues are non-silent and peak at -6 dB without clipping.
- Web export includes both WAV assets. Android package built separately; on-device listening still needs a phone test.
