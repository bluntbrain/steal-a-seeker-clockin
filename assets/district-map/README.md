# District map artwork

Derived from the existing GPT-generated `assets/world-v3/district-*.png` scenes. No new generation and no source overwrites. `scripts/prepare-district-map.py` removes the connected near-black outer backdrop, keeps dark interior details, and trims unused margins with padding. Each scene is uniformly scaled and fully contained by the UI; buildings are never stretched or cropped by the layout.

The numbered missions, route lines, completion stars and locks are real UI, not baked into these images. Source crops and final dimensions are in `frames.json`.
