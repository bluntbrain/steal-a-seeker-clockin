# Enemy visual sizes — 2026-09-25

- Drone art: 0.70× previous size.
- Normal guard art: 0.88× previous size.
- Heavy/Warden art: 1.28× previous size.
- One shared presentation scale is used in gameplay and both teaching demos.
- Health bars scale in width, move clear of bodies, and retain readable alert symbols.
- Vision, collision, speed, damage, target selection and weekly rules are unchanged.

Validation: TypeScript passed; 19 existing worklet/demo checks passed; web export and rules-manifest check passed. Browser Mission 06 at 390×844 shows the three sizes together, correct facing, no renderer errors. Screenshot: gameplay.png. No new APK built for this visual adjustment; code32 predates these sizes.
