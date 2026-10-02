# Cosmetic defeat pickups

Generated gold coin source and 128 × 128 runtime sprite. Ten coins burst from a defeated enemy, scatter over roughly twice the previous radius, then converge into the courier's current position and shrink away. The animation lasts up to 0.68 seconds, with an accelerating return and a brief gold arrival ring. All campaign maps use the shared GameCanvas layer, including heavy guards and drones.

This is cosmetic feedback only. It does not grant credits, SKR, health or score. Existing settlement and reward rules remain authoritative.

The UI-thread Skia Atlas has a fixed eight-burst / 80-sprite budget and one 64 KiB texture. Restart/remount does not replay old corpses. Pause freezes the shared animation clock. Reduced effects uses two brief local fading coins instead of travel.

Two generated ElevenLabs variants live in ../audio-loot-v1/. Sounds follow existing sound/volume controls and pause cancellation. Generation script reads only the shared private credential file; credentials are not included. Mono 32 kHz WAV clips are approximately 0.66 seconds (1.7× tempo from the original ElevenLabs sources). manifest.json preserves generation prompts and hashes.
