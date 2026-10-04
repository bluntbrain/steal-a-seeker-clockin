# Stealth campaign, boss motion and contact fix

## Why the bugs happened

The shared HapticPressable inserted a new View around every label/child tree and placed an absolute loading overlay above it. Child-based button layouts could lose their expected sizing, and the overlay had no explicit corner radius. The new implementation preserves the original children, clips the press surface, and copies its resolved corner radii to the spinner overlay, including function styles and asymmetric corners.

Bosses used a single overhead texture. Position changed, but feet did not. Seven generated eight-frame sheets now provide four overhead walk poses and four face-visible entrance poses. Walk frames follow actual distance moved. Stopped bosses hold a stance. The 1.55-second entrance is presentation only: simulation and taps remain gated until it finishes. Reduced effects use a short still; Skip, load failure, and background interruption are handled. Faces disappear before gameplay. Boss rules are unchanged: they are ranged wardens with character-specific traits, so the new artwork carries a blaster instead of the misleading knife.

Courier attacks previously stopped movement for four wind-up ticks, often at the very edge of reach. A patrol could leave range before every hit. Revision 18 allows collision-checked pursuit during wind-up at normal courier speed. Damage still requires current reach, angle and unobstructed sight at impact. Older revisions retain their previous behavior and archived verifiers.

## How levels after 12 work

They are data-driven, but the authoring source is TypeScript rather than manually writing one JSON file per level:

1. `shared/campaign-stealth-layouts.ts` contains ten authored room layouts. Each rectangle is `[x,y,width,height]` on a 12 × 20 world grid. Rectangles join into U courts, L bays, split tunnels, staggered teeth, rings and switchbacks. Existing game textures render these collision boxes; artwork is not the collision map.
2. `shared/campaign-levels.ts` creates deterministic recipes. A recipe chooses a room, mirrors/flips it, places patrols, sets objectives/modifiers and assigns bosses every third level. A seed reproduces exactly the same result. Version 1 recipes still build from the original weekly templates; version 2 uses denser campaign-only geometry.
3. `scripts/publish-campaign-levels.ts` builds each recipe, finds a winning replay, and checks it with the pinned server verifier. A failed layout/roster tries another seed rather than publishing a broken level.
4. `src/campaign/published-levels.json` contains the finished, frozen definitions for levels 13–100, including geometry, objectives, guard roster, boss and rules fingerprints. The app bundles these for offline play. Later batches can arrive through `/campaign/levels`.
5. PostgreSQL stores the current published row in `campaign_levels`. Migration 016 adds `campaign_level_versions`: before changing a shipped layout, the old definition is archived by level number and rules hash. Old replays use their original definition. Stars and credits remain keyed by mission, preventing duplicate payouts after a refresh.

These are ten distinct room families with seeded variants, not 88 individually hand-designed maps. More distinct families can be added without changing the renderer. Every map keeps top/bottom objective aprons, cover pockets and connected routes. More walls are useful only while escape routes and flanking space remain readable.

## Add the next 100 levels

Use Node 22. After changing simulation or campaign layout/generator source, first run `npm run rules:generate` and keep the previous replay bundles.

```sh
npx tsx scripts/publish-campaign-levels.ts --from 101 --to 200 --dry --bundle /tmp/seeker-levels-101-200.json
```

Review the generated maps and playtest representative difficulty bands, bosses and modifiers. The dry run creates no production records. After review, publish using the backend's private DATABASE_URL (never place it in source):

```sh
npx tsx scripts/publish-campaign-levels.ts --from 101 --to 200
```

`--from` must continue the existing sequence. Omitting it starts at the database's latest level plus one. Publishing inserts new levels; rerunning does not overwrite existing rows. Apps fetch the extra batch without an APK only when their engine fingerprint is compatible. Engine changes still require a new app build and backend verifier deployment. To ship the full batch offline, generate `--from 13 --to 200 --bundle src/campaign/published-levels.json`, test and release the app.

## Validation scope

All 88 regenerated levels have solver wins verified by the pinned engine. Separate tests cover reachable objectives, patrol placement, replay compatibility, moving-target contact, walking-frame progression and the entrance handoff. Browser tests cover the visible button states and boss/map previews. Native frame rate and physical haptic/audio feel require a Seeker device; an APK is not part of this update.
