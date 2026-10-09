# Industrial environment art — 10 October 2026

Generated with the built-in imagegen tool. Full prompts and original generation filenames are in `generation.json`. Runtime exports are 768 × 768 JPEGs, roughly 476 KiB combined.

| District | Wall cap | Cargo palette | Campaign levels |
| --- | --- | --- | --- |
| Warehouse | Terracotta brick, bolted steel rim | Green | 1–4; 13–22; then every 30 levels |
| Rooftops | Pale sandstone concrete, steel rim | Blue; existing HVAC racks | 5–8; 23–32; then every 30 levels |
| Powerworks | Lavender metal plates, navy rim | Copper; existing electrical racks | 9–12; 33–42; then every 30 levels |

Boss arenas inherit their district. Materials are inspired by the supplied reference screenshots; the screenshots themselves are not shipped in the app.

## Rendering

- `src/art/walls.ts` nine-slices the cap texture so long walls keep a narrow border.
- `src/art/wall-depth-art.ts` projects wall caps outward, exposing inward-facing sides. Vertical lift is strongest at the room centre and tapers toward the sides. A shared transform keeps connected walls aligned. The actor occlusion masks use the same projection.
- Shadows point mostly right on the left side and mostly left on the right side; central shadows point down. Two unioned shadow layers avoid darker seams where wall pieces meet. Everything is recorded once into the static Skia scene; there is no per-frame blur.
- `src/art/industrial-props.ts` draws deterministic cargo braces, panel seams, fasteners, handles, paint wear and clipped yellow/black tape on existing cargo footprints. The room rim is decorative, with an opening on the edge nearest extraction.
- `GameCanvas` and launch preloading use these new assets. Older `walls-v5` files are retained for recovery.

No collider, map layout, pathfinding, combat, score, progression or replay-rule changes.

## Review

Run the exported web app and open `/?wallLab=1&build=industrial-depth`. The preview supports all three districts, full-room and close-up views, and behind/in-front/walking poses. Its mission link opens a real playable mission.
