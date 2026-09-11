> Historical plan, superseded on 12 September 2026. See [current plan](COMPLETE-GAME-PLAN.md).

# Steal a Seeker — implementation plan

Updated 11 September 2026. Solo, AI-assisted Android game, no multiplayer lobby. React Native / Skia; keep the current original courier and charcoal/mint art. The generated campaign screens are design references, not a record of completed features.

## Current increment: v0.2 Night Shift

- Preserve Quiet Pickup as an unguarded practice mission.
- Add Night Shift on the same warehouse layout with two predictable patrol routes.
- Render guards and amber sight cones; crates, racks and walls block visibility.
- Fill a visible alert over 0.8 seconds of exposure; breaking sight clears it over 0.55 seconds.
- Catch the player when a guard's alert fills. Explain the failure and retry the selected mission.
- Freeze patrols and alert during pause/backgrounding; reset all patrol state on restart.
- Verify an input-driven successful route, failures, occlusion and small-screen controls; produce an Android test APK.

This increment adds patrol detection, not pursuit pathfinding. Guard bodies are original procedural robot art. Practice and Night Shift share one room; do not count them as two unique level layouts.

## Next: make a small complete game

1. **Four distinct rooms.** Move map data behind mission definitions. Add a room focused on crossing patrols and another on the escape after pickup. Every room needs at least one tested winning route and a clear reason it differs from the others. Keep the original plan of twelve levels as an expansion target, not a promise.
2. **Local progress.** Save unlocked rooms, best times/scores and selected outfit; restore after restart. Add a simple mission picker and replay results. Version saves and recover safely from invalid data.
3. **Phone testing and controls.** Play on physical Android, then Seeker when available. Tune joystick placement, alert readability and feedback; add reduced effects and haptic settings. Measure actual frame timing and thermal behavior on hardware.
4. **Wallet access.** Implement Mobile Wallet Adapter connect/sign flow in an Android development build with clear network labels. Verify rejection, background/return and reconnect. Keep gameplay simulation offline and independent of wallet UI.
5. **SKR purchases and restore.** Define the access product and cosmetic SKUs. Backend orders bind wallet, network, mint, recipient, exact amount and unique reference. Grant access only after server verification; handle duplicate callbacks, pending payments, rejected transactions and restored access. Start with test transactions; do not accept real money until this works end to end.
6. **Shared scores.** Add run IDs and input replay validation before accepting competitive scores. Signed wallet data alone does not prove a run. Keep personal bests available without a server.
7. **Paid levels and success rewards.** Separate later release gate: supported jurisdictions/rules, a funded reserve, run verification, idempotent settlement, clear fees and handling of disconnects/refunds. No unfunded reward promise or client-authorized payout. The user wants real SKR; do not substitute a fake balance and call it complete.
8. **Submission.** Fresh-clone build, installable APK, judge access, commit history, three-minute demo and deck. Recheck the official deadline in the maintained rules before submission.

## Definition of ready for the next demo

A new player can select a room, understand the objective, get spotted, retry, pick up the phone and escape using touch. Backgrounding does not move the guards or advance the timer. The working APK and its known limits match the demo. No real-SKR shop, online leaderboard or payout is represented as live until implemented and verified.
