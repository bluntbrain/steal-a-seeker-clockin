# Leaderboard A artwork and lighting

Implemented from `design/visual-v2/leaderboard-options/a.png` on 24 September 2026.

- `courier-wave.png`: new transparent greeting pose generated with the built-in OpenAI image tool using the approved A concept and existing default courier as references. Exact prompt in `courier-wave.prompt.txt`. Resized to 600 px height without changing the character design.
- `courier-wave-header.png`: alpha fade of that pose for a clean blend into the live header.
- `header-glow`, `card-mint`, `row-dark`, `row-gold`, `button-mint`: editable SVG lighting/gradient layers, rasterized to PNG for identical lightweight native/web rendering.
- `crown`, `silver`, `bronze`: editable vector medal artwork with native rank text. These remain accurate for tied ranks.
- The leaderboard navigation mark is three bars, matching reference A.

Rebuild static layers with `node scripts/build-league-ui.cjs`. All balances, timers, names, rankings and scores remain native text from the existing league state. No sample data is imported by the app. Review fixtures live separately under `design/leaderboard-a/` in the browser export.
