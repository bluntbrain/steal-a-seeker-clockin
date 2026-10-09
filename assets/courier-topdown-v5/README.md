# Fixed-head courier

Default top-down courier, facing east. The head pivot is the centre of each 256 × 256 cell. Other costume atlases retain their north-facing convention.

The source is the project's generated white-hood courier study. `node scripts/pack-courier-v5.mjs` clips and rotates the approved limb artwork, preserves a single stationary hood and backpack, and packs a lossless atlas. No Hunter Assassin pixels are used in the shipped artwork.

Each bank has 36 poses: idle, 32 walk frames, windup, slash and follow-through. The second bank includes the phone. Walking uses a 1.6-second cycle with a three-degree arm swing; attack poses follow existing simulation ticks. Only actual travel enables the gait, so pushing into a wall stays idle.

The atlas is 2048 × 2304 (18 MiB decoded RGBA). All frames retain the same head anchor and scale. The phone is included in its hand, with no runtime prop overlay. Tests compare the hood pixels across all 72 frames and verify attack priority and carrying transitions.
