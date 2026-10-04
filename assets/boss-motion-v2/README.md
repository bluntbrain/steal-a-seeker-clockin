# Boss movement and entrance sheets

Seven generated sheets, 8 frames each: four overhead walking poses facing +X and four face-visible entrance poses (crouch, airborne, landing, standing). Generated with OpenAI image generation on 2026-10-04 using each character's existing `loading-chase-v1` face sheet and `bosses-v1` overhead sprite as references. Black tactical clothing and mint straps are retained. A compact blaster replaces the knife to match existing ranged boss rules.

1024×512 lossless WebP, four columns, 256px cells and transparent padding. The packer finds the transparent gap between generated rows before extracting, preventing heads from being sliced at an assumed equal row boundary. Sources retained under `source/`; rebuild with `node scripts/pack-boss-motion.cjs`. Runtime loads the current boss only. See `manifest.json` for frame order and hashes.
