# Seeker collectible models

All twelve editions share the Seeker hardware silhouette from the supplied phone reference sheet: a separate upper camera, a vertical lower two-sensor pill, adjacent flash, left-side Seed Vault panel and a low rear Solana logo. Edition colors and screen artwork remain distinct. These are stylized reference-matched game models, not manufacturer CAD.

The source is `src/three/seekerPhone.ts`. `CollectiblePhone.tsx` attaches the edition texture for the browser. Android uses rendered turntables to avoid the earlier native GL crashes. Exported GLBs include mesh geometry, materials and the display texture; they are not all loaded into the game.

Regenerate using Node 22, Blender and Python Pillow:

```
npx tsx scripts/export-seeker-geometry.ts
/Applications/Blender.app/Contents/MacOS/Blender -b -t 4 --python scripts/render-seeker-models.py
python3 scripts/pack-seeker-turntables.py
```

The scripts write temporary geometry/frames under `/tmp`, twelve self-contained GLBs here, and eighteen-view WebP atlases under `assets/phone-turntables`. Rear labels and the Solana logo are geometry rather than a mirrored decal. The opening pose now shows the rear cameras and markings.

Validation outputs: `verification/seeker-hardware/assets.json` and `all-backs.jpg`. Physical-device validation remains pending.
