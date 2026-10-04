# Modular wall caps

Regenerated on 4 October 2026 with the Codex CLI image tool (`gpt-image-2`, high quality, 1024 x 1024). Originals and exact prompts: `output/imagegen/walls-v6/`. The first set (framed modules with a centrepiece) lives in `output/imagegen/walls-v5/`.

The runtime files are 512 x 512 JPEGs. Each cap is a bolted frame around a uniform, tileable interior with no centrepiece. No generated text, brands or characters. The palette follows the existing Warehouse, Rooftops and Powerworks environments.

`src/art/walls.ts` nine-slices each cap once per wall: the four corners keep a fixed world size, the edge strips and the interior tile at the corner scale, so a long wall reads as one continuous slab. The level renderer records them in a static Skia picture. Only the selected district texture is loaded. Existing wall rendering remains the fallback while the image loads. Perimeter walls retain their original art.

`manifest.json` records source hashes, runtime filenames and generation settings. Credentials are stored outside this repository and are not included in prompts or assets.
