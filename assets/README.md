# Runtime assets

- courier.png: untouched transparent 2688×1520 GPT Image 2.5 sheet; four directions with standing/stride poses. courier.frames.json defines normalized source rectangles and the renderer uses a foot pivot plus gentle step bob. This is a small MVP cycle, not the full planned animation set.
- courier.prompt.txt, courier.result.json, provenance.json: exact generation records and source hash. A failed observation was recovered from the same completed job, without generating a duplicate.
- pickup.wav, dash.wav, success.wav: original synthesized cues from scripts/make-audio.py. No sampled audio.
- Environment and UI: original code-native art in src/game/art.ts, src/components/GameCanvas.tsx and src/GameScreen.tsx. The map art shares coordinates with collision data; no concept screenshot is a gameplay background.
- public/canvaskit.wasm and its adjacent license: web runtime from the locked dependency. Android uses native Skia.

The source PNG is preserved. Frame rectangles normalize the generated grid's spacing; a paint-time alpha filter suppresses faint halos. A full rig and more stride frames remain future art work. The game makes no runtime request to a font, image or audio service.
