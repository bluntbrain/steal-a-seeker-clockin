# Shallow wall depth

The Skia 2D game now defaults to shallow raised walls. Reuses the three existing wall textures; no new image downloads or 3D engine. Interior wall tops lift 0.30 tiles, with shaded front faces, edge highlights and short contact/cast shadows. Perimeter walls and non-wall props keep their existing treatment.

## Preview and rollback

Run `npm run export:web`, then `npm run preview`. Open `http://127.0.0.1:8787/?wallLab=1` for Current / Subtle / Stronger comparisons on real warehouse, rooftop and powerworks levels. The fixture stages actors; it does not save a run or change progress. Use its play link for the actual game.

`EXPO_PUBLIC_WALL_DEPTH=subtle` is the default. `flat` restores previous wall rendering; `strong` uses 0.48 tiles. Re-export/rebuild after changing the environment. On localhost only, `?wallDepth=flat` (or `subtle` / `strong`) overrides it. The lab route and URL override are not Android controls.

## Rendering and boundaries

Collision boxes, guard vision/pathfinding, tap destinations, mission geometry and scoring are unchanged. Adjacent wall edges are merged before drawing the exterior faces. Static shadows and wall geometry are recorded into the existing cached world picture.

Ground actors select a precomputed clip using interpolated foot position. A wall occludes an actor while its feet remain behind the wall base; actors in front render over its face. Drones bypass wall occlusion. Boolean path operations run once per scene/style, not per actor/frame. Flat mode and flying actors still use a full-world clip: an undefined animated clip can unbalance Skia's canvas save/restore stack.

## Verification (2026-09-27)

- TypeScript check passed.
- Production web export and rules-manifest check passed.
- 17 targeted tests passed: wall joins, depth-band transitions, defined actor clips, unchanged campaign collision data, tap destinations and camera transforms.
- Browser visual checks: Current / Subtle / Stronger; warehouse, rooftops, powerworks; front/behind/corner poses and a walking fixture. Checked the comparison at 390 x 844.
- Live local test mission inspected with flat and subtle rendering. At 390 x 844, tapped a destination near cover and verified the courier reached it with camera follow and actor visibility intact.
- No physical Android performance/thermal check or new APK build in this change. Cached rendering reduces avoidable work; it is not a measured FPS claim.

Logs: `verification/wall-depth/`.
