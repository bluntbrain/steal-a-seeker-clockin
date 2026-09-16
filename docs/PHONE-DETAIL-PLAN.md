# Sharper collectible phones

17 September 2026. Audit and proposed implementation, not a completed phone upgrade.

## What is limiting the current result

| Area | Current source | Effect |
| --- | --- | --- |
| Android viewer | `src/components/PhoneStage.tsx` re-exports `PhoneTurntable` | Crash-safe image rotation, not continuous real-time 3D |
| Rotation | 16 yaw frames, 22.5° apart, plus top and bottom | Visible angle jumps |
| Native resolution | 384 × 472 per view, 6 × 3 atlas | Soft at phone display pixel densities |
| Screen texture | 156 × 333 crop from `assets/world-v3/phones.png` in `CollectiblePhone.tsx` | Fine details cannot be recovered by increasing output size |
| Model | Procedural rounded slabs, lens rings, buttons, ports | Good silhouette, limited close-up surface detail |
| Web rendering | Live Three.js; DPR capped at 1.5; direct lights | Limited display sharpness and reflection detail |

One current atlas is 2304 × 1416. Its uncompressed RGBA image is about 12.45 MiB before other rendering costs. Tripling both dimensions makes that nine times larger. Do not solve quality by loading giant atlases for all 12 phones.

## Build one master first

1. **Model Frost in detail.** Add modeled chamfers, separate front glass and metal chassis, camera glass and rings, a recessed USB opening, individual speaker perforations, button gaps, antenna breaks and a seam around the back. Use the existing silhouette unless real Seeker measurements/reference are supplied; do not claim CAD accuracy.
2. **Replace the low-resolution screen crop.** Author separate 1K or 2K screen and back artwork. Use normal and roughness maps for microdetail instead of adding thousands of unnecessary polygons. Keep markings original and readable. Reuse one master model with 12 materials/edition designs.
3. **Set up studio lighting.** Broad white reflections show curved edges; controlled darker reflections define glass. Tune metal roughness and lens clearcoat. Three.js explicitly recommends an environment map with MeshPhysicalMaterial and notes its higher per-pixel cost: https://threejs.org/docs/pages/MeshPhysicalMaterial.html .
4. **Review Frost before making the other 11.** Inspect front, rear, edge, camera and USB macros. The same panel must look consistent through the rotation. An AI image can guide materials, but independent generated angles are not a reliable 3D model.

## Keep Android stable

- Start with individually stored 768 × 960 frames and 32 yaw steps plus top/bottom views. Treat these as prototype targets; profile before increasing resolution or view count.
- Load the current frame and a small bounded neighbor cache, then release them when the inspector closes. Avoid keeping full decoded atlases for multiple editions.
- Preload nearby angles while idle. Retain a static image fallback and the existing recovery boundary.
- Keep the simple front/back/top/bottom controls. Add zoom only if the source detail supports it.
- Use the same master GLB and material sources in the web viewer. Raise DPR only after measuring it on a weaker device. Do not replace the Android turntable with live GL until the earlier crash path has been reproduced and resolved on hardware.

## Acceptance checks

- Compare old and new at the actual inspector size and at 2× zoom; judge edge and texture sharpness, not just file resolution.
- Inspect all angles for clipping, missing geometry, changing logos, seams and texture stretching.
- Check that all 12 editions keep correct names and materials.
- Open/rotate/close 50 times on the Realme. Check memory growth and missing frames. Measure APK size and load time before accepting the whole set.
- Confirm web context loss and native image failures still recover to a usable screen.

## Battery dash: current answer

There is no active battery dash in the current tap-to-move combat. `CombatCommand` has move, attack, phone, exit, switch and stop. Dash controls in `GameScreen.tsx` are gated behind legacy non-combat mode. Combat mirrors health into the old `battery` field for compatibility; it is not a spendable battery power. Mission 3 retains the internal ID `battery-dash`, but its displayed name is **Crossfire**.

If a dash is added, make it a separate explicit mechanic with a cooldown, clear feedback and no extra pay-to-win charge. It would change movement, guard balance, scoring and replay verification. It needs its own full campaign/weekly compatibility test pass. This leaderboard redesign does not enable it.
