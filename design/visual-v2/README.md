# Steal a Seeker — 2D art and interface

Updated 12 September 2026. The user chose the original 2D direction and explicitly rejected the live 3D version. The design references are `../../../assets/seeker/originals/`: especially character sheet 01, guards 03, environment kit 05, gameplay 13 and outcomes 18.

## Implemented direction

All active campaign, daily and entry modes use the shared Skia 2D canvas. Screen movement equals world movement. The archived Three renderer is not imported by the normal game. The same game component is used on web and native; this pass is verified on web only. Android and Phantom testing remain deferred.

Fixed overhead camera; ivory hooded courier with mint eye band and backpack; graphite industrial rooms; chunky offwhite armored crate corners; mint interactions and exits; amber threats. Charcoal #0C0C0E, graphite #161618, offwhite #F6F6F5, mint #CFE6E4, warning #FD8F3A. The old green modal surfaces are replaced with charcoal panels.

## Three primary views

| View | Contents | Secondary surfaces |
| --- | --- | --- |
| Welcome | Courier artwork, premise, controls, clearly priced campaign access | Error / restore information inline |
| Hideout | Continue, twelve mission cards, selected briefing, stars and collection | Shop, daily, entry, settings as sheets |
| Heist | Full room, objective, charge, clock, stick, take, dash, optional decoy | Pause and results anchored to the bottom |

No separate profile, inventory or briefing page. Bottom sheets retain readable costs and explicit action labels. Pause and results leave the room visible above; longer payment or recovery messages scroll. Dash readiness and cooldown remain readable with reduced effects enabled.

## Actual assets versus concepts

The gallery separates runtime assets, actual browser captures and rejected sprite drafts. Level images are captures of the implemented maps, not invented AI layouts. Generation prompts are in `prompts/`; provenance is in `asset-manifest.json`.

Runtime assets generated with the built-in GPT image tool:

- `assets/visual-v2/courier-portrait-v2.png`: welcome, hideout and success portrait. Existing production eight-frame courier atlas is retained for movement.
- `cover-crate-v2.png`: ivory corner guards, graphite lid, mint front strip. Runtime crop maps its opaque face into each crate collision box.
- `cover-cabinet-v2.png`: tall graphite cabinet, ivory armor and mint screen. Runtime crop maps the body into rack collision boxes; generated outside glow is clipped.
- `rooftop-floor-v2.png`: quiet charcoal roof tiles for missions 5–8.
- `vault-floor-v2.png`: graphite metal panels and recessed cable channels for missions 9–12.

Warehouse missions retain the original detailed floor. All three floors are visible below separately placed cover; generated backgrounds never define collision or puzzle routes. Multiple phone pedestals now reflect the actual target list.

Robot raster drafts failed the alpha check: the checkerboard was painted into RGB. They are retained as drafts, not loaded into gameplay. The game uses code-native 2D patrol, scanner and warden silhouettes based on the reference sheet, with actual line-of-sight cones clipped by cover. A transparent robot atlas is still an asset-pipeline follow-up; a background-removal promise is not a usable sprite.

## Asset production rules

1. Use the existing concept sheets as identity and material reference. Generate one reusable layer per job: floor, prop, actor or portrait. Do not bake a whole level into a background.
2. Match camera and light across the set: fixed overhead camera, upper-left soft key, no rotating perspective. Use large shapes that survive at 35–90 pixels.
3. Keep walkable floor low contrast. Keep cover boundaries solid and inside the authored geometry. Separate contact shadow, glow, cone and interaction rings from art.
4. Inspect PNG mode, alpha, silhouette, padding and dimensions before import. A painted checkerboard is rejected. Keep versioned originals and exact prompts.
5. For animated actors, preserve common frame size, feet anchor, body scale and direction order. Reuse the tested eight-frame courier rather than guessing frame bounds on inconsistent generated poses.
6. Load images once; record static geometry as Skia pictures. No per-frame allocations of raster files or regenerated backgrounds. Keep simulation at its existing fixed timestep and interpolate visual movement.
7. Check portrait, desktop, reduced effects, all cosmetic selections, capture, success and recovery screens. A beautiful still is not gameplay validation.

## Dash and cosmetics

Physics retained: 8 units/s for 0.2 seconds, 20 charge, 2-second cooldown. The burst has three directional streaks, a foot ring and up to 0.48 seconds of visual decay. The paid Escape trail adds a subtle carrying trail. Reduced effects removes both trails, the burst and decorative bobbing/pulsing. Night Courier uses a charcoal tint; Signal Runner gets an amber trim marker. Cosmetics do not change speed, collision or rewards; daily and entry runs use the neutral appearance.

A longer physical dash would require a deliberate balance change and a new pinned rules version. This pass improves its visual feedback without silently changing submitted replay rules.

## Twelve level identities

| # | Mission | Visual / playable distinction |
| --- | --- | --- |
| 01 | Quiet Pickup | Shipping room, safe pickup and mint extraction, no guards |
| 02 | Cone Lesson | Central cabinet with one patrol; cover blocks the beam |
| 03 | Battery Dash | Long return lane with cover breaks and a charging decision |
| 04 | Crossing Signals | Two crossings and central waiting cover |
| 05 | Sweep Window | Roof materials, fixed scanner and narrow sweeping beam |
| 06 | Narrow Crossing | Two timed gates; mint open, amber closed |
| 07 | False Footsteps | Tall roof equipment, decoy rings and investigating patrol |
| 08 | Warden Gate | Larger warden silhouette and defended route |
| 09 | Power Trade | Utility floor, alternating power switch and scanner |
| 10 | Two Targets | Two visible phone pedestals; sequential deliveries |
| 11 | Silent Circuit | Relay console and time-limited gates |
| 12 | The Last Vault | Two targets, relay, power, scanner and warden |

The current rooftop maps remain their authored rectangular collision rooms. Cinematic disconnected skybridges from early concepts are not claimed as implemented terrain. Future layout changes need new playable routes and replay validation.

## Browser test scope

Local campaign access, cosmetics, challenge entry, success returns and receipts use browser credits. They are not real SKR and cannot be withdrawn. Devnet wallet and backend settlement work remains separate. See `../../docs/WEB-TEST-GUIDE.md` for the browser flow and `../../verification/2d-*` for this pass's evidence.
