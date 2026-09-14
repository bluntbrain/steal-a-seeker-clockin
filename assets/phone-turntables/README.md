# Phone turntables

Rendered from our existing CollectiblePhone geometry and phone atlas. No new character art or external model.

Each WebP contains 18 views: 16 yaw angles in 22.5 degree steps, then top and bottom. Six columns × three rows; each frame is 384 × 472 pixels. Native displays one frame at a time, avoiding an Expo GL context. Rebuild with scripts/render-phone-turntables.cjs while the web preview serves PhoneStage.web.tsx.
