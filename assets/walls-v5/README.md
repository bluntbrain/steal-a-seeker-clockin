# Modular wall caps

Generated for Steal a Seeker using the user-approved OpenAI image API (`gpt-image-2`, high quality, 1024 × 1024), via the bundled imagegen CLI. Originals and exact prompts: `output/imagegen/walls-v5/`.

The runtime files are 512 × 512 JPEGs, about 308 KB combined. No generated text, brands or characters. The palette follows the existing Warehouse, Rooftops and Powerworks environments.

`src/art/walls.ts` divides each cap into nine slices so corners keep a fixed size, then repeats modules across long walls. The level renderer records them in a static Skia picture. Only the selected district texture is loaded. Existing wall rendering remains the fallback while the image loads. Perimeter walls retain their original art.

`manifest.json` records source hashes, runtime filenames and generation settings. Credentials are stored outside this repository and are not included in prompts or assets.
