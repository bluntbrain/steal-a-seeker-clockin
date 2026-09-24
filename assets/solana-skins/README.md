# Solana character skins

Generated 23–24 September 2026 with the built-in OpenAI image generator. No Higgsfield. The supplied private character sheets and Akshay Rajan / Beeman photographs were identity references; those original photographs are not included here.

- Seven identities: Toly, Mert, Chase, Lily, Vibhu, Akshay Rajan, Beeman.
- `source/`: generated transparent eight-pose originals.
- `*-atlas.png`: 1024×768, eight cells of 256×384. Front, left, back, right; then walking in that order. Feet align to y=376 in each row.
- `*.png`: front-view store portraits extracted from the same accepted atlas.
- `portraits.embedded.json`: same portraits for native/browser scorecard exports.
- `packing.json`, `manifest.json`: crop bounds and verified output hashes.
- `generation.json`: prompts/briefs and original generator output paths.
- `akshay-generation.json`, `beeman-generation.json`: exact generation prompts, reference roles and output paths for the additional skins.
- `portraits-preview.jpg`: contact sheet for review.

Repack deterministic PNGs and embedded exports with `python3 scripts/pack-solana-skins.py` (Pillow required). This only crops, scales and packs existing generated art; it does not regenerate characters. `tests/costumes.test.ts` verifies each atlas hash and dimensions.

To add or repack just Akshay without changing the other atlases, use `python3 scripts/pack-solana-skins.py --only akshay`. The shared costume, credit-store and direct-checkout catalogs all include `solana-akshay`; the default price is 3,000 credits, in the same cosmetic tier as the other Solana skins. The backend can override prices through its existing pricing configuration.

Skins are cosmetic. Runtime game logic receives no skin-based health, damage, speed or score modifiers.

The UI reference was generated first and saved at `design/solana-store/ui-reference.png`. The playable Hideout and checkout were implemented from that reference; the picture's example prices are not used for purchases.

Beeman uses the same 3,000-credit cosmetic tier, eight-pose atlas and scorecard exports. Repack only his generated source with `python3 scripts/pack-solana-skins.py --only beeman`.
