# Knockout reward assets

Generated 2026-10-04 with OpenAI image generation. `coin-spin.png` is now used by the gameplay collection effect. `impact-absorb.png` remains an unused concept; production impacts and trails use bounded Skia paths.

See [the implementation plan](../../docs/plans/MINIMAL-INTRO-AND-DEFEAT-FX-2026-10-04.md).

`coin-spin.png`: six transparent 128px cells in three columns/two rows. `impact-absorb.png`: eight transparent 192px cells in four columns/two rows. The first row is impact; second row is absorption. Exact rectangles, file sizes and hashes are in `manifest.json`. Masters and generation prompts are retained. Pack with `node scripts/pack-loot-v2.cjs`.

The diamond emblem represents the existing visual credits motif. These particles do not grant currency or change the game economy.
