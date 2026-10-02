# Targeting, HUD and first-map update — 2026-10-01

## Implemented

- Campaign combat revision 14: tap an enemy to route to the first reachable clear firing position, stop at a 2.6-unit standoff, and shoot. Moving targets trigger bounded replanning; tapping the floor cancels pursuit. Unreachable targets fail without walking into walls.
- Four inward gold arrows follow the selected enemy. The attack route is gold.
- Courier and active enemies have green, dark-outlined health bars below their sprites with outlined white actual HP values. Barlow is bundled under the included OFL licence.
- First Pickup reconstructs the visible reference's tall central spine, crossbars, upper cover islands and alternating crate pockets. Unseen boundaries, phone, exit and seven enemy placements are adapted for a complete playable mission. This is not a claim to reproduce the unseen full original map.
- Tutorial waypoints match the new map and teach automatic approach-and-fire.
- Original generated courier launch artwork, coded title and real asset-loading progress. Native OS splash remains unchanged; the new artwork is the in-app loading screen. See assets/splash-v2/README.md for the exact prompt.

## Verification

- Full automated suite: 349 passed, zero failures. Includes all 12 campaign solver runs, new targeting cases, replay serialization and archived revision-13 compatibility.
- TypeScript check and web export passed after final rendering changes; git diff --check passed.
- Interactive browser at 390 × 844: selected distant drone, selected guard behind cover, observed gold route and four arrows, observed automatic approach and shooting, checked health labels and new first-map rendering.
- Replayed tutorial through both movement targets and the drone attack. Drone defeated and tutorial dismissed successfully.
- Visually checked splash image, title, progress and safe-area spacing. Evidence: splash-phone.png and tutorial-phone.png.
- Browser QA found and fixed unsupported CanvasKit measureText, small-font glyph spacing, and intrinsic ImageBackground sizing.

## Release boundary

Local changes only. No APK built, no backend deployed, no physical Android device tested. Current weekly contracts retain their revision-13 gameplay to avoid changing a live competition. Revision-14 approach behaviour is currently on campaign levels; target arrows and health-bar rendering are shared. Archived campaign/weekly verification bundles are preserved. Deploy the matching backend rule registry before publishing a new APK with the campaign changes.
