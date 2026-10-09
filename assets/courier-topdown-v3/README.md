# Overhead courier with dedicated carrying poses

Generated with built-in imagegen on 10 October 2026. Original transparent sheets are in `source/`; exact generation prompts are in `generation.json`.

The default courier has a smaller hood relative to its shoulders, visible forearms, gloves, feet, rear mint backpack, and a readable silver-blue knife.

`default.webp` is a 1024 × 1024 atlas with sixteen 256 × 256 cells:

- 0–7: standard idle, three gait poses, three attack poses, and the existing carry-idle slot.
- 8–15: dedicated phone-carrying versions of the same poses. The left glove grips the phone in every frame; the knife stays in the right hand.

The running cycle selects 9 → 10 → 11 → 10 based on actual distance travelled. Carrying attacks use 12–14. The separate phone overlay is disabled for these frames. Other costume sheets keep their previous rendering until they receive matching carrying artwork; this update does not replace purchased costume appearances.

Repack with `node scripts/pack-courier-v3.mjs`. Packing preserves the complete equal-sized cells and alpha; it does not recenter each frame independently.

Preview: `/?wallLab=1&build=industrial-depth`. Choose **Carrying phone**, **Walk around**, and **Courier zoom**. The preview uses staged game state, not a recorded run.

Validation: all sixteen cells have real alpha and no opaque content touches a cell edge; TypeScript and the wall/courier regression tests pass. No gameplay rules were changed.
