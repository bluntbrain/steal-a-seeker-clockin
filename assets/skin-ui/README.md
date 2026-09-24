# Hideout UI assets

The layout follows the supplied generated reference in `design/solana-store/ui-reference.png`. Existing character portraits and gameplay atlases are unchanged.

- `skr.svg`: official SKR mark extracted from the inline SVG on https://solanamobile.com/skr on 24 September 2026. The mockup used a mint Solana mark for SKR; the implementation uses the actual distinct SKR mark.
- `sol.svg`: official gradient logomark from https://solana.com/src/img/branding/solanaLogoMark.svg, linked by https://solana.com/branding.
- Other SVG files are locally authored UI geometry: a soft radial glow, floor light, game-credit coin, crown, stats bars and courier mask. Game credits do not use the SKR logo.
- PNG copies are rasterized for consistent React Native Image rendering; no runtime SVG dependency. Run `node scripts/build-skin-ui.cjs` to rebuild.
