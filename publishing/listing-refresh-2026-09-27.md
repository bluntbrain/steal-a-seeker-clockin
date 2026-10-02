# Store listing refresh — review draft

Not published. Reviewed 27 September 2026 against saved release metadata, archived screenshot assets, current game source and the publisher-dashboard screenshot supplied by the owner. The exact live listing text and live screenshot order have not been verified in the publisher portal.

## What the evidence says

- The supplied dashboard shows 25 installs in the last seven days, 46 updates and one review. Updates are not new downloads. No listing impressions or page views are shown, so conversion cannot be calculated.
- Saved release metadata (`publishing/0.3.4/release-metadata.json`) leads with “Sneak past guards. Take the phone. Escape.” It explains the basic loop but leaves the free campaign out of the short description.
- That metadata still promises unlimited free weekly practice. Current `src/ranked/WeeklyBoard.tsx` hides Practice. Remove that promise if it remains in the live listing.
- The archived screenshot set leads with the district map, followed by a quiet gameplay frame, outfits and collection. It contains old UI. This is evidence about the saved assets, not confirmation that these exact images are still live.
- Current `src/commerce/PassIntroGate.tsx` displays the optional pass offer before the main app to non-owners, with dismissal stored in component state. A “free campaign” listing followed by a purchase screen can create confusion. This is a retention hypothesis, not an explanation for people who never installed.

## Recommended store copy

### Name

Steal a Seeker

### Short description

12 free heists. Make it out.

28 characters. Confirm the live portal field's limit before submission.

### Full description

Getting the Seeker is the easy part. Getting out is the heist.

Sneak through patrols, shoot your way out of trouble and race to the exit with the phone. Play 12 free missions across warehouses, rooftops and powerworks. No wallet is required to play the campaign.

TAP. PLAN. ESCAPE.
Tap the floor to move and an enemy to shoot. Use walls for cover, watch the guards and pick your moment. Grab the phone, then survive the escape.

KNOW YOUR ENEMY
Scout drones report your location. Armored guards are vulnerable from behind. Choose your route before the chase starts.

BUILD YOUR COLLECTION
Recover a different phone design in each campaign mission and view it in Hideout. Customize your courier with outfits and Solana character skins. Cosmetics keep the same gameplay stats.

TAKE ON THE WEEKLY BOARD
An optional, one-time Game Pass unlocks weekly ranked play: three shared missions, five attempts on each. Your best successful run on each mission counts toward your weekly score. Extra ranked attempts cannot be bought.

PLAY FREE. EXTRAS ARE OPTIONAL.
The full 12-mission campaign is free. Optional purchases support SKR or SOL through a compatible wallet. Game credits are in-game currency and cannot be withdrawn or exchanged for tokens. Weekly token prizes are not currently active.

An independent game, not affiliated with or endorsed by Solana Mobile.

## Replacement screenshot sequence

Capture from the published Android version; do not use concept art as gameplay evidence. Keep the game's dark/mint palette and make the action readable at thumbnail size.

1. **12 FREE HEISTS. ONE WAY OUT.** Actual gameplay: courier carrying the phone toward the exit, with enemies pursuing. Gameplay fills most of the image.
2. **TAP TO MOVE. TAP TO SHOOT.** A clear encounter with cover, target and courier visible. Small, accurate input annotations.
3. **THE DRONE SAW YOU. MOVE.** Show the real drone warning and approaching guards. Avoid staging a mechanic the released APK cannot perform.
4. **12 HEISTS. 12 PHONES TO COLLECT.** Current collection UI and a recovered phone.
5. **PICK YOUR COURIER.** Current Solana skin selector. Label paid cosmetics as optional; do not suggest endorsement by the people depicted.
6. **3 MISSIONS. 5 CHANCES EACH.** Actual leaderboard/weekly mission UI, with “Optional Game Pass” legible.

If the portal supports a preview video, use 10–15 seconds of actual gameplay: immediate near-detection, a cover maneuver, shooting, pickup, then escape. Do not make an AI skit the only evidence of what users will play.

## Conversion and retention checks

1. Record the exact live listing and whatever impressions, detail views and install counts the portal exposes before editing. If impressions/views are unavailable, say so rather than deriving a conversion rate from downloads alone.
2. Ask five Seeker owners unfamiliar with the game to view the listing briefly. Ask what kind of game it is, whether it costs money to start, and what they expect to do. Record their words before explaining anything.
3. Submit refreshed copy/screenshots as one coherent listing test. Compare similar periods and annotate promotion changes. With small counts, treat the result as directional rather than proof of a lift or of which individual asset caused it.
4. Separately observe fresh installs: first launch, tutorial completion, mission-one start/win and return play. Do not confuse an acquisition problem with an onboarding problem.
5. Recommended separate app change: make free play the primary first-launch action and offer the pass after a completed heist or from the weekly screen. This draft does not modify the app.

## Publishing

Solana Mobile permits a listing-only update using the existing APK. Listing changes become live after the release is approved. Source checked 27 September 2026: https://docs.solanamobile.com/dapp-store/submit-an-update

Do not advertise guaranteed SKR rewards, cash earnings, prizes that are not active, or weekly practice while its entry point is hidden. Recheck the final copy against the live build and catalog before submission.
