# Missions-first navigation

Updated 12 September 2026.

The campaign opens on the mission map after purchase and on subsequent launches. Hideout is no longer a peer tab. A smaller Hideout button in the mission header opens the phone collection, which has explicit return-to-missions controls. The main Continue action belongs to Missions.

Flow: Missions → mission briefing → gameplay → Missions. Optional collection detour: Missions → Hideout → phone inspector → Hideout → Missions. Wardrobe, Daily, Rewards and Settings remain available from the screen footer. Gameplay and unsuccessful-run return buttons now say Missions.

The default applies to the shared web/Android game component. Trial and timed-run entry routes retain their existing direct launch behavior. No economy, unlock, collection or save data was changed.

Verified in isolated browser profiles at 320×568, 390×844 and 430×932: default map on first purchase/reload, all twelve nodes, separate rack, phone inspector, return navigation, disabled locked mission, briefing/start, and paused gameplay behind the map. Evidence: `verification/mission-navigation.json`. Android runtime verification remains deferred.
