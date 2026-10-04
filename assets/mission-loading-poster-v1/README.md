# Mission loading poster

Generated with the built-in OpenAI image tool on 2026-10-05 using the existing courier character sheet and graphite Seeker product reference. The exact prompt is in PROMPT.txt. Private master references remain outside this repository.

Flat 2D courier / security-maze portrait, 9:16. Runtime asset: poster.webp, 900 x 1600, 156736 bytes. Derived from the generated master with Sharp resize and WebP quality 88; no content edits. No text or progress bar is baked into the picture.

MissionChaseLoader renders the label and rounded progress bar at the screen center. GameCanvas reports the proportion of required decoded textures (0–90%), then GameScreen marks the scene ready after its first paint (100%). Progress measures asset readiness, not remaining seconds. Reduced effects skips bar interpolation. Error state preserves retry / back actions. No minimum poster viewing time. The existing scene focus transition remains.

The rejected loading video is archived privately and has no import in the app. Preview at /?loaderLab=1; optional &controls=1 adds progress fixtures and music auditions for development only.

## Verification

TypeScript and web export / rules hash checks passed. Browser QA at 390 x 844: poster fits; progress fixtures, reduced effects and retry work. Real practice mission startup and restart return to gameplay, with no remaining loading overlay or video element. Browser error log empty during startup. No Android APK was built or physical-device test performed.
