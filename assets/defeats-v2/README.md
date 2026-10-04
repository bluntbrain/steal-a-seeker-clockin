# Defeat sprites

Forty generated frames, used by `GuardLayer`: twelve robot frames (patrol/heavy/drone rows, four columns) and four frames for each of seven bosses. Robot camera and forward direction match existing sprites. Boss references are the matching files in `assets/bosses-v1/`.

Masters are in `source/`. `node scripts/pack-defeats-v2.cjs` packs lossless transparent WebP sheets with 256px cells and 8px safety gutters. First boss recoil frames are rotated to the game's +X facing. Runtime never squeezes the sprites. Final frames persist as body/wreck evidence without changing AI.

Generation direction: preserve exact reference identity, materials and mint/ivory/charcoal palette; strict overhead view; transparent equal cells; recoil, instability, collapse, settled inert pose. Robot frames articulate dislodged panels, tracks and rotors. Human frames bend knees, fall onto a side and settle with head right/feet left. No blood, gore, labels, floors or cast shadows.

Runtime sheets total approximately 1.7 MiB compressed. Only the robot sheet and a scene's current boss sheet are decoded in gameplay. The local `?defeatLab=1` route inspects the real production layers at normal speed, slow motion and held phases.
