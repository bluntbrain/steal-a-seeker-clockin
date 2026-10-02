- **P1 — `src/components/ResultSheet.tsx:6`: WebP migration breaks `npm run export:web`.** `scripts/build-sheet-preview.cjs:3` handles only `.png`. Its imported `ResultSheet` now requires six WebPs. A write-free bundle check reproduces “No loader is configured for .webp” for all six. **Fix:** extend the preview’s image plugin to `/\.(png|webp)$/`.

- **P2 — `scripts/optimize-assets.mjs:23–25`: deleting PNGs leaves consumers outside `src` broken.** The script deletes every planned PNG but rewrites only TypeScript under `src`. Specifically, `scripts/copy-design.cjs:10`, also invoked by `export:web`, still copies Solana `.png` portraits and atlases. Those files are absent in the checkout, so this becomes another export failure after fixing the loader. **Fix:** migrate the copy script and corresponding gallery references to WebP; check all consumers before deleting originals.

No changed worklet bodies, captured variables, default parameters, frame callbacks, or reactive dependencies. The asset substitutions introduce no evident per-frame allocations or React render fan-out. Existing allocations in surrounding code are unchanged.

No simulation or backend protocol changes appear in this diff. The checkout’s rules manifest and weekly engine verification passes; all six costume/melee tests pass. The checkout includes updated asset manifests omitted from the pasted diff—ensure those accompany the binary conversion.

Android decoding, visual quality, and video playback were not tested.

FIX FIRST