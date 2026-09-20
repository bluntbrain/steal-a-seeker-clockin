# Stable outfit selection layout

Owned, unowned, free and weekly-locked outfits now share the same details area. The two-line description, credit-progress slot, action button and status-message area reserve consistent heights. Choosing an owned item no longer removes the progress row's space and expands the courier stage. Equipping an item no longer inserts a notice that shifts the layout.

The preview is still flexible with screen height, but does not depend on the selected outfit. Thumbnail density is based on the measured available store height, including the space left after navigation and safe areas. Full-sized thumbnails are retained on taller screens. Smaller screens use shorter thumbnails so all six choices and the action fit without scrolling.

Validation: TypeScript and production web export passed. `scripts/playtest-hideout-stability.cjs` uses isolated local fixtures to switch through all six outfits and equip Frost Runner. It compares the x/y/width/height of the preview, grid, details, action and bottom tabs before and after each selection. It also checks viewport bounds and browser errors at 390×844, 390×740 and 360×640. Screenshots and results are in `verification/hideout-stable/`.

No purchase prices, inventory rules or payment behavior changed. Web preview updated; existing Android APK remains unchanged.
