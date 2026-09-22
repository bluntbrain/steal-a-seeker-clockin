# Full-screen play and replay completion — 23 September 2026

- Removed the Map/Follow toggle from gameplay.
- The normal combat camera now uses the full available width and height below the 48-point HUD, within the phone safe area. World scaling remains uniform. Camera bounds, overlay transforms, inverse tap projection and off-screen indicators use the actual viewport height.
- Guided tutorials, reduced-effects mode and the disabled-camera fallback retain the full-map overview so teaching targets remain visible.
- The campaign finale requires a win on the final mission as well as all twelve campaign clears. Wins on replayed missions 1–11 use the normal level result and credit-claim flow.

Validation: TypeScript passed; 229 app tests passed; simulation manifest fingerprints remain unchanged. Added regression coverage for all twelve replayed missions and tall-phone camera bounds/projection/markers. At a 390×844 browser viewport, gameplay fills from directly below the HUD to the bottom edge; the Map button is absent. Tapping a guard moved the courier and defeated it. No browser console errors were captured. Screenshot: verification/full-screen-play-390x844.png.

Android release: mainnet v0.3.10, version code 13. No phone was connected, so installation and physical-device checks remain pending. No backend change is required.
