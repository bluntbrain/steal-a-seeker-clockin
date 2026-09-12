# Collectible phone models

Twelve self-contained GLB files, exported from the same procedural model shown in the collection viewer. Each contains mesh geometry, materials and an embedded display texture. These are stylized game collectibles, not manufacturer CAD or verified Seeker hardware replicas. Back panels, cameras, edge controls and ports are authored game designs.

## In the app
Tap a rack slot, the selected phone card, or the phone card in a mission briefing. Drag to rotate horizontally and vertically. Front, Back, Left, Right, Top and Bottom buttons provide exact views. Close returns to the previous screen without changing progress.

The model uses a rounded chassis, bezel, textured screen, back panel, camera lenses, flash, side keys, antenna bands, USB-C detail and speaker holes. Editions share geometry; shell colors and display artwork vary. Gameplay stays 2D.

## Source and exports
- Source: src/three/CollectiblePhone.tsx.
- Viewer: src/components/PhoneStage.tsx; lazily loaded by PhoneInspector.tsx.
- Crop metadata: assets/world-v3/phones.frames.json. The generated source is not an equal 256 × 512 grid.
- Runtime builds one model on demand from a shared texture atlas. These exported GLBs are reusable production assets and are not all loaded into the app.
- To regenerate exports, run the web preview and scripts/playtest-phone-viewer.cjs with the documented Playwright dependency path. It opens an isolated profile, checks all twelve models and writes their GLBs. The local ?phoneModelExport=1 flag enables this export function; ordinary gameplay does not expose it.

[Three.js GLTFExporter documentation](https://threejs.org/docs/pages/GLTFExporter.html) describes the binary glTF export used here. For this small viewer, React Native PanResponder controls model rotation directly; a larger scene could use [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html) on web.

Validation: verification/phone-viewer/checks.json and glb-validation.json. Chrome web tested at 320×568, 390×844 and 430×932. Shared native code typechecks; physical Android rendering and gestures remain untested.
