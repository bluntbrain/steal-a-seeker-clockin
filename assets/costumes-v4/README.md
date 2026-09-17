# Costume sheet v4

Generated on 2026-09-17 with OpenAI `gpt-image-2` via the bundled imagegen CLI, using individual crops of `../../../assets/seeker/02-costumes.jpg` (workspace source: `/Users/bluntbrain/Documents/code/clockin/assets/seeker/02-costumes.jpg`).

Each `NAME.png` is a transparent 512×768 store portrait. `NAME-atlas.png` has eight 256×384 gameplay frames: front/left/back/right standing, then the same four walking poses. `frames.json` describes the cells. `portraits.embedded.json` supplies the same portraits to native and web share cards.

The source crops, prompts and generated sheets are preserved in `output/imagegen/costumes-v4/`. `manifest.json` records the actual model and hashes. Run `uv run --with pillow --with numpy python scripts/prepare-costumes.py` to recreate the processed files from those sheets. That step makes no API calls.

Stable inventory IDs preserve old purchases: `signal-runner` now displays Frost Runner; `ghost-courier` displays Ghost Signal. The image filenames follow the reference sheet. All outfits are cosmetic.

Archive Keeper's generated source frames 3 and 7 both faced left. The preparation script now mirrors those two source cells so east-facing idle and walking art face right. This is a source-specific correction, recorded as `mirroredSourceFrames` in the manifest; the other five outfits and global direction mapping are unchanged.

Run `python3 scripts/check-costume-directions.py` (Pillow required) to check the actual side-facing pixels in all six atlases. It locates the mint visor in each side pose and rejects a visor on the wrong half of the frame. It also verifies that deliberately reversing a correct right pose is detected. The preparation script runs the same validation before saving each atlas.
