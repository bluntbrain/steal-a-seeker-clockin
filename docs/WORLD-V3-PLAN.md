# Collection and environment pass

Reference set: 04 seeker collection, 11 hideout rack, 12 missions, 13 gameplay core, 15 rooftops. Keep the game in 2D. Illustrated depth comes from materials, front faces, shadows and layered scenery.

1. Assign one of the twelve reference phone editions to each campaign mission: Frost, Graphite, Tide, Static, Mist, Orbit, Pearl, Circuit, Relic, Flux, Archive, Ghost. The pickup, carried phone, mission briefing and collected slot use the same edition. Multi-delivery missions recover two devices of that edition; completing the mission unlocks its collection slot.
2. Replace the long hideout page with a room view and working 4×3 charging rack. Earned phones illuminate slots; tapping a slot shows its edition and mission. Keep shop, daily, entry and settings accessible. Collection derives from existing completed missions, so saves remain compatible.
3. Put mission selection on an illustrated district map inside the Hideout. Warehouse, Rooftops and Powerworks/Vault have four real mission nodes each. Selection shows the real playable geometry, target phone, guard count and goal. Locks and stars derive from progress.
4. Replace the gritty floor with consistent graphite plate art. Add district-specific environment details: crates and shelving; HVAC, aerial fixtures and rails; server racks and vault hardware. Rooftops should read as elevated spaces with city depth and bridges, while visible boundaries match collision.
5. Reduce HUD clutter to enlarge the 2D play area. Keep compact result sheets, alarm feedback and reliable touch controls.
6. Verify collection persistence, mission selection/unlocks, all phone variants, district scenes, small-screen fit and gameplay regression. Rebuild the local preview and push to the existing private repository. Android remains deferred.

Generated dioramas are backgrounds; nodes, phones, stars, counters and buttons are live components. Sample values painted into concept art are not used as real balances or progress.

## Completed implementation

The six generated assets and their exact prompts are in assets/world-v3/README.md. UI is in Hideout.tsx, PhoneArt.tsx and MissionPreview.tsx; district scenery is recorded once by game/art.ts. New collection metadata does not change simulation hashes or the progress schema.

To test: open the local web preview, enter Hideout → Missions, select an unlocked node and play. Extract with the phone to fill its rack slot. Tap any rack slot to inspect its edition. The all-phones screenshot is a separate verification profile with previous earned campaign results, not a change to your save.

Checks and screenshots: verification/world-v3/checks.json, collection-win.json and adjacent images. Android remains a separate testing step.
