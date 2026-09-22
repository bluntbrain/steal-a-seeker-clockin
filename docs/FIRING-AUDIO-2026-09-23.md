# Courier firing audio

Replaced the suppressed dart-pistol cues with two original ElevenLabs gunshot variations. The player alternates them through the existing combat event hook. Enemy fire and damage cues retain their separate sounds.

- Immediate crack and low-mid body; 350 ms total duration and a 60 ms tail fade.
- Mono 32 kHz PCM; peak normalized to -3 dBFS before the game mixer.
- Player shot mix increased from 0.48 to 0.58 times the user's effects volume.
- Source recordings, exact generation prompts, processing script and final hashes are retained. Credentials remain outside the repository.

Validation: TypeScript, all 233 tests and web export passed. Both WAVs served by the local game match the generated assets byte for byte. No gameplay or ranked scoring changes. Physical-device listening is still needed to judge the final balance on phone speakers.

Android release: 0.3.13 (16), mainnet. See its release receipt for the APK checksum and build configuration.
