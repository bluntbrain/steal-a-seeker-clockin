# Native Seeker turntables

Rendered from the shared `src/three/seekerPhone.ts` geometry. Every edition has 18 views: 16 yaw angles in 22.5° steps, followed by top and bottom. Each frame is **512 × 640**, packed into a six-column, three-row **3072 × 1920** WebP.

Android displays one frame at a time without opening a live GL context. Dragging and Front/Back/Left/Right/Top/Bottom presets remain available. The default rear three-quarter view shows the actual Seeker camera arrangement, Seed Vault panel and Solana logo.

Follow `assets/phone-models/README.md` to regenerate. The older browser-capture scripts predate this model pipeline and should not overwrite these assets.
