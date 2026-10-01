# Knife attack art

13 appearances, 12 generated attack poses per appearance: wind-up, contact and recovery in four directions. `generation.json` records prompts and source outputs. `source/` contains the accepted transparent generation sheets.

Run `node scripts/pack-melee-sprites.cjs` to pack original eight idle/walk poses and twelve new attack poses into each 768 × 960 atlas. Each equipped atlas uses 2.8125 MiB decoded RGBA. Unused appearances are not decoded by the game canvas. Foot anchoring and one scale per source sheet prevent size changes between attack poses.

`src/components/melee-presentation.ts` synchronizes poses with existing simulation ticks; this update does not change damage, replay rules or weekly scoring. Shared demo sprites use the same atlas. Legacy gun revisions retain their original art.
