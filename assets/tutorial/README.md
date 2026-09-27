# Tutorial tap hand

Generated with the built-in image generation tool on 2026-09-27, using the user screenshot as the visual direction.

Prompt: One friendly glossy 3D yellow cartoon hand with a bright cyan-blue rounded sleeve cuff. Index finger points diagonally toward the top left, remaining fingers curled, back of hand facing the viewer, cuff at bottom right. No text, rings or other objects. Transparent background, clean alpha, entire hand visible. Readable at 64 pixels.

The transparent source was resized to 192 x 192 for bundled use (35 KB). `TutorialHand.tsx` anchors the fingertip and prevents the decorative cue from intercepting touches. Gameplay animates it only while waiting for the tutorial action; lesson demos use their existing animation timeline. Reduced effects keeps the live tutorial pointer still.
