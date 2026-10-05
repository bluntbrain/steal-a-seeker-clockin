# Boss firearm and walking sheets

Generated with OpenAI image generation on 2026-10-05 from the approved character sheets. All seven bosses already fire projectiles in heist-guards-v17.ts, including Akshay's three-shot burst. These assets match that existing rule. They do not give the courier a gun.

Each lossless WebP is a 1024 x 512 atlas with eight 256 px cells. Top row: four strict overhead gun-holding walk poses facing +X. Bottom row: crouch, jump, land and ready entrance poses facing the player. Idle fallbacks are under idle/. Gun barrels remain in their own cells; alpha-gap detection avoids slicing across a pose.

Regenerate runtime assets with node scripts/pack-boss-motion.cjs boss-motion-v3. The manifest records hashes and dimensions. Source PNG masters and initial prompts are retained. Toly, Chase, Vibhu and Akshay received a second reference-guided correction to remove invented sunglasses. Generation provenance is in verification/hunter-stealth/boss-presentation/.

Walking is selected from distance travelled. A stationary boss holds the idle frame. Existing defeat sheets remain in use. Private identity references are not bundled.
