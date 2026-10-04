# Illustrated campaign and courier refresh — 4 October 2026

The campaign is a miniature Seeker city with giant Solana characters. The artwork is decorative; it changes no enemy statistics, level geometry, combat, economy, unlock conditions or campaign ordering.

## Included artwork

| District | Giant characters | Scene |
| --- | --- | --- |
| Warehouse | Toly, Mert, Beeman | Canal warehouses, angry Toly, Mert firing, Beeman reaching for tiny couriers |
| Rooftops | Chase, Lily | Roof gardens, skybridges, Chase pursuing and Lily aiming at the courier |
| Powerworks | Vibhu, Akshay | Reactors, SKR workshop, Vibhu firing and Akshay reaching across the street |

Each world is a 724 × 2172 source PNG and optimized WebP. The three worlds cycle as decorative scenery with ten mission nodes per image. The actual combat district of every mission stays unchanged. Images keep their exact 1:3 aspect ratio. Road-centre coordinates place the native mission buttons directly on the illustrated road; no extra connector line or district divider is drawn. Neighboring scenes overlap with a continuous alpha crossfade.

Six courier sheets live in `../courier-topdown-v2/source/`: default, Night Courier, Frost Runner, Circuit Scout, Archive Keeper and Ghost Signal. Each produces a 1024 × 512 transparent atlas with eight 256px frames: idle, three walking poses, windup, slash, follow-through, phone carry. Existing cosmetic IDs remain unchanged. Retired Solana outfits retain the pre-existing default top-down fallback.

## Generation and provenance

Generated with the OpenAI built-in image tool. No Higgsfield credits used. `prompts.json` contains the complete prompt set, including intermediate environment concepts. `manifest.json` records the final source/output paths, sizes and SHA-256 hashes.

References:

- Courier identity: `../../../assets/seeker/01-character-sheet.jpg` (in the parent clockin workspace).
- Seeker hardware: `../../design/visual-v2/completion-options/seeker-phone-sheet.png`.
- Seven character sheets: `../solana-skins/source/{toly,mert,beeman,chase,lily,vibhu,akshay}.png`.
- SKR reference: `../skin-ui/skr.png`. Generated coins are stylized environmental Solana marks, not payment UI icons.
- Costume edits reference the new default sheet and preserve its grid, camera and poses.

Rebuild optimized assets with `node scripts/pack-world-art.mjs` from the repository root. The new packer extracts only within exact cell boundaries and preserves the source alpha, avoiding the old fixed crop window's neighboring-frame fragments.

## Runtime

`CampaignMap.tsx` keeps a virtualized FlatList. It virtualizes full scenes rather than individual background slices. Only nearby scenes are mounted. Three shared Skia images retain their native ratio; an alpha gradient blends the previous scene into the next over 7.5% of the image height. `campaignMapLayout.ts` supplies scene offsets and ten road slots, with smaller mission circles. The map header retains only the wordmark, balance and settings; the share/progress heading and free-campaign footer are removed. No new runtime library was added.

Browser evidence and limits: `../../verification/art-refresh/README.md`.
