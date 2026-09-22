# Guard defeat polish

Defeats now use a render-only recoil, tipping/flattening collapse, visor shutdown, six spark streaks, a short expanding ring and complete fade. Heavy guards fall more slowly; drones spin faster. Reduced effects uses only a 220 ms fade. Defeated guards no longer retain their frozen hit flash or health bar. Restoring an already defeated guard does not replay the effect.

Four original ElevenLabs cues replace the shared knockout sound: two alternating regular defeats, armor collapse and drone shutdown. Sources and prompt provenance are in assets/audio-defeats. All cues are 0.78 seconds, mono 32 kHz, start without leading silence, and have measured peaks below -3 dBFS. Existing foreground/mute/volume handling remains in effect. Android kills use a Context Click haptic through the existing rate and priority limiter.

No simulation, enemy health, movement, collision, scoring, award or replay rules changed. Death positions and timing live only in the renderer.

Validation: TypeScript passed, all 233 tests passed, rules manifest check and web export passed. Local browser gameplay rendered and responded to taps. Screenshot sampling did not capture the short collapse reliably, so full motion/audio feel and physical Android haptic validation remain manual checks. Audio files were measured for duration, leading silence and clipping; not independently auditioned.

Signed APK: releases/steal-a-seeker-mainnet-v0.3.12-code15.apk
Package: com.bluntbrain.stealaseeker
SHA256: 1375f0f3e111b7f509125869a746c0efc93132cde9f7da634e3033efaf6d76a2
APK signing verification and package/version inspection passed after the build completed.
