# Complete phone crops and interactive inspection

## Why phones were cut off

The original renderer assumed the generated atlas was an exact 6 × 2 grid of 256 × 512 cells, then applied the same inset to every cell. The actual phones are spaced about 248 pixels apart; the second row starts about 448 pixels below the first. This shifted later columns and cut into the top of the lower row. Small rack slots also constrained their children more than the fixed thumbnail size allowed.

The fix uses measured rectangles shared by PhoneArt and GameCanvas. Every phone has at least five pixels of horizontal and eight pixels of vertical padding around the visible silhouette, including its buttons. Thumbnails now fit the rack's actual inner width and height.

## How the 3D view works

An interactive mesh has real depth and surfaces. Dragging changes its orientation, which lets the user inspect the front, back, sides, top and bottom. A flat source image only supplies the visible artwork; the unseen surfaces must be designed or obtained from a complete 3D source.

This implementation uses one shared, rounded phone chassis, twelve material/artwork variations, and authored camera/port/button geometry. The back is our game's collectible design. It does not claim to reproduce the physical Seeker exactly. The two-dimensional game renderer remains unchanged.

Tap any collection slot or a phone detail card to open the viewer. Uncollected phones can be inspected as previews; inspecting does not grant ownership or mission progress. No automatic spinning: the view moves when dragged or when a view button is pressed. The 3D bundle loads only on inspection, and the Canvas renders on demand.

## Reusable assets

All twelve GLBs are in assets/phone-models/. They contain geometry, materials and an embedded texture and can be opened in compatible 3D tools. The game uses shared source geometry for efficient reuse rather than loading twelve separate GLBs.

The [GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html) is the export implementation. Rotation is handled by React Native gestures; [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html) is an alternative for a web-only viewer.

## Verification

- Measured all twelve source silhouettes against their padded crop rectangles.
- Verified the rack does not clip any phone at 320, 390 or 430 pixels wide.
- Rendered all twelve model fronts and six Frost inspection angles.
- Dragging changes rotation; closing preserves the collection and returns to 2D gameplay.
- GLB validation checks the binary container, mesh records and embedded texture.
- Android physical-device validation remains deferred.

See verification/phone-viewer/ for checks, screenshots and export validation.
