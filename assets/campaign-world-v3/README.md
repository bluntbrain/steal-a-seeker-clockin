# Solana campaign world v3

Three quiet evergreen 768 × 2304 backgrounds replace the busy city illustrations. Seven giant Solana characters chase the small courier; Seeker phones and spaced ecosystem marks occupy the empty sides of six winding bends. No buildings, unnecessary street furniture, or generated lettering.

## Runtime and geometry

- `warehouse.webp`: Toly, Mert, Beeman; Jupiter, BONK, Solana.
- `rooftops.webp`: Chase, Lily, Seeker; Meteora, dogwifhat, SKR.
- `powerworks.webp`: Vibhu, Akshay, Seeker; Pump, Phantom, Solana.
- Ten missions per tile. `src/components/campaignRoad.ts` defines the exact cubic curve both for the asset packer and for node positioning. Do not independently move the road in an image editor.
- Tiles keep their 1:3 aspect ratio. Matching edge colors and continuous curve tangents remove the need for overlapping fades or partition strips. Road strokes overscan tile edges before rasterization.
- Only three static images ship to the campaign map. FlatList virtualization remains in place. Final WebPs total about 899 KiB; no runtime blur, SVG filters, or animation loops were added.
- This is decorative map artwork. Combat maps, unlock rules, scores, rewards, and purchase behavior are unchanged. Ecosystem marks do not imply integrations, sponsorship, or endorsements.

## Generation and repeatable packing

`prompts.json` preserves the full generation instructions and character/phone reference paths. Two transparent four-cell source sheets were generated using the built-in image-generation tool, with the existing character sheets and the real graphite Seeker phone reference. `source/giants-a.png` contains Toly, Mert, Chase, Lily; `source/giants-b.png` contains Vibhu, Akshay, Beeman, Seeker. The phone reference is in `../campaign-15-days/videos/classroom-orientation/production/references/seeker-phone.jpeg` relative to the repository root.

Regenerate final images from this repository root:

```sh
npx tsx scripts/pack-campaign-world-v3.ts
```

The packer crops the generated transparent dioramas, places the original official logo assets without changing their colors/proportions, and composites a road from the shared geometry. `manifest.json` records dimensions, sizes, and checksums. The road is deliberately not AI-painted: its exact location must remain reliable for touch targets.

## Source research

Official sources consulted on 4 October 2026:

- [Solana brand](https://solana.com/branding) — original mark and palette.
- [Solana Mobile Seeker](https://solanamobile.com/seeker) and [SKR](https://solanamobile.com/skr) — device and token identity. SKR uses its own distinct white symbol, not a recolored Solana mark; the local SVG provenance is recorded in `../skin-ui/README.md`.
- [Jupiter](https://jup.ag/), [Meteora](https://www.meteora.ag/), [Pump](https://pump.fun/), [Phantom](https://phantom.com/) — recognizable Solana app landmarks.
- [BONK](https://www.bonkcoin.com/) and [dogwifhat](https://dogwifcoin.org/) — meme-token references.

`brands/sources.json` records the exact downloaded logo URLs. These were selected for recognizable, specific references, not as a live market-cap ranking.

## Preview and validation

Normal app: `http://127.0.0.1:8787/?build=solana-world-v3`.
Local-only map fixture: `http://127.0.0.1:8787/?worldLab=1` (sample progress, no saved-progress writes).

See `verification/qa/2026-10-04-solana-map/README.md` for verification scope.
