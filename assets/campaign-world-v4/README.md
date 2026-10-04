# Campaign artwork v4: ten distinct chapters

24 new generated dioramas join the eight original character scenes. All 32 are placed once across ten different backgrounds for levels 1–100. Characters recur in different poses; entire scenes and chapter backgrounds do not repeat. Official ecosystem marks deliberately remain recurring visual signposts.

| Levels | Chapter | New scene direction |
| --- | --- | --- |
| 1–10 | First Pickup | Original Toly, Mert and Beeman chase scenes |
| 11–20 | Seeker Square | Original Chase, Lily and Seeker monument |
| 21–30 | Validator Yard | Vibhu, Akshay, courier on a validator, Pump capsule escape |
| 31–40 | Seed Vault | Toly raids a vault, phone in a Seed Vault, grappling-rope escape |
| 41–50 | Relay Raid | Mert searches with a light, validator cable heist, token fountain |
| 51–60 | Phone Flight | Chase rides a Seeker, phone skateboard ramp, courier glider |
| 61–70 | Meme Market | Lily's catching net, BONK-inspired dog, dogwifhat-inspired dog |
| 71–80 | Orbital Escape | Vibhu's phone shield, coin inspection, Jupiter-inspired orbit |
| 81–90 | Portal Pursuit | Akshay at a portal, drone lift, meteor stepping stones |
| 91–100 | Last Hideout | Beeman's bridge, standing lookout, Phantom-inspired friend |

## Production files

- `source/encounters-c.png`, `source/encounters-d.png`: twelve new character encounters.
- `source/heist-props-e.png`, `source/meme-props-f.png`: twelve new courier/prop scenes.
- `prompts.json`: original full prompts and reference paths.
- `repair-prompts.json` and `additional-repair-prompts.json`: standalone regeneration prompts.
- `individual/*.png`: fourteen corrected/replacement sprites, including standing Beeman.
- `<chapter-id>.webp`: ten final 768 × 2304 map backgrounds, about 3.04 MiB combined.
- `overview.png`: all ten chapters in one review sheet (not imported by the game).
- `manifest.json`: per-image sizes, hashes, illustration IDs, and actual official marks used.

Generated using the built-in image-generation tool with the v3 character atlases and real Seeker phone reference. Six transparent square cells per portrait atlas. Fourteen scenes with crossed cell boundaries were regenerated as individual images; these bypass atlas slicing entirely and retain their full silhouettes with a 24px safety margin. The rejected seated-on-phone Beeman scene is not used. The original atlases and official logo sources remain under `../campaign-world-v3/`.

These are stylized game illustrations, including fictional vaults/portals and mascot interpretations. Official logos remain separately sourced assets. Artwork does not imply partnerships or new game mechanics.

## Layout contract and rebuild

`src/components/campaignWorlds.ts` assigns each chapter its own illustration IDs, marks and restrained center tint. `campaignMapLayout.ts` assigns chapter art by its ten-level block rather than cycling three backgrounds. Combat districts and all gameplay data remain untouched.

Road geometry is unchanged: `campaignRoad.ts` drives both rasterized roads and mission-node positions. Every tile keeps the same edges, tangent and 1:3 aspect. New center tints fade out before tile edges. FlatList virtualization remains; no animation loop, runtime blur or particle work was added. The bundle has more image data, so this is not a claim of zero memory/loading cost.

```sh
npx tsx scripts/pack-campaign-world-v4.ts
```

The packer rejects individual sprites whose visible subject touches an image edge and checks that the top eight rows and bottom eight rows match respectively across all ten backgrounds, then builds the overview. The road itself continues across each join.

Preview every chapter locally: `http://127.0.0.1:8787/?worldLab=1&build=world-art-v4`. Sample progress does not write to the user's saved progress.
