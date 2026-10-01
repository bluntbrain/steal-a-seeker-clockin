# Cosmetic defeat pickups

Generated gold coin source and 128 × 128 runtime sprite. Six coins burst from a defeated enemy, briefly scatter, then converge into the courier's current position and shrink away. The animation lasts up to 1.12 seconds. All campaign maps use the shared GameCanvas layer, including heavy guards and drones.

This is cosmetic feedback only. It does not grant credits, SKR, health or score. Existing settlement and reward rules remain authoritative.

The UI-thread Skia Atlas has a fixed eight-burst / 48-sprite budget and one 64 KiB texture. Restart/remount does not replay old corpses. Pause freezes the shared animation clock. Reduced effects uses two brief local fading coins instead of travel.

Two generated ElevenLabs variants live in ../audio-loot-v1/. Sounds follow existing sound/volume controls and pause cancellation. Generation script reads only the shared private credential file; credentials are not included. Mono 32 kHz WAV clips are approximately 1.115 seconds. manifest.json preserves generation prompts and hashes.
