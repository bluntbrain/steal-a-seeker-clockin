# Courier side-facing correction

Archive Keeper's generated frames 3 and 7 faced left, although the atlas layout assigned them to right-facing idle/walk poses. The simulation's west=1 / east=3 mapping was correct.

Corrected those two art cells and the preparation recipe. No other costume atlas, portrait, movement code, combat rule or payment flow changed.

Verification:

- The pixel validator failed on the original Archive Keeper frame 3 and passes after the fix.
- All 24 side poses across six outfits pass; all six deliberately reversed-right-frame negative controls are detected. Measurements: `pose-audit.json`.
- Four focused costume tests pass, including actual tap/stick movement in all four directions and atlas hash verification.
- TypeScript and rules-manifest checks pass.
- Actual web gameplay screenshots: `walking-right.png` and `walking-left.png` at 390×844. Archive Keeper's face points along the movement route in each.
- Web export and signed Android APK rebuilt. Native installation/play still needs a physical device check.
