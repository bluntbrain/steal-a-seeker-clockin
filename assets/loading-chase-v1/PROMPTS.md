# Mission chase loader — generation record

Generated with the built-in image generator on 2026-10-04. Four running poses per character; original source sheets retained. No Higgsfield credits used.

## Shared prompt

Production game animation sprite sheet, transparent PNG, square 2048x2048. EXACT 4 columns by 4 rows, 16 equal square cells, NO text or grid. Each row uses the corresponding attached identity reference in the specified order. Four consecutive distinct running cycle phases facing RIGHT in side/three-quarter profile: right leg forward left back; passing knees bent; left leg forward right back; opposite passing. Pumping opposing arms, forward lean, preserve recognizable face, clothes, mint backpack and polished 3D collectible toy proportions. Full body fits inside each cell with transparent 12% margins, fixed foot baseline and identical character size across all frames. Genuine transparent alpha, no background, floor, shadows, checkerboard, scenery, glow, motion streaks or weapons. Clean studio light, crisp silhouettes. Strong running motion with airborne feet and distinct leg positions. Characters must NOT overlap cells.

## Courier crew suffix

Row1 the white hood robot courier carries a small mint Seeker phone against its chest, tiny black double-camera pill on phone rear corner. Row2 Toly. Row3 Mert. Row4 Lily. Courier playful escaping, humans determined chasing.

References, in order: `assets/costumes-v4/default.webp`, `assets/solana-skins/toly.webp`, `assets/solana-skins/mert.webp`, `assets/solana-skins/lily.webp`.

## Second crew suffix

Row1 Chase with long wavy brown hair mustache. Row2 Vibhu swept black hair clean shaven. Row3 Akshay dark hair trimmed black beard smile. Row4 Beeman bald head black sunglasses and full long grey beard. All chasing a courier offscreen, do not show any courier. Keep their identities exact.

References, in order: `assets/solana-skins/chase.webp`, `assets/solana-skins/vibhu.webp`, `assets/solana-skins/akshay.webp`, `assets/solana-skins/beeman.webp`.

## Runtime packing

Source dimensions returned by the generator differ from the requested size. Normalize each square to 1024×1024, then extract four 1024×256 row strips. WebP quality 86, alpha quality 95. These are app-only decorative loading assets; gameplay atlases and rules are unchanged. Runtime uses four 256×256 frames, at 10 frames/second, with staggered phases and UI-thread translation.
