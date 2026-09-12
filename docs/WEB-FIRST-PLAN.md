# Web-first playable build

Updated 12 September 2026. User priority: test the whole game in the browser before spending more time on Android. Android testing is paused, not removed from the release requirements.

## Three main screens

1. **Welcome / access** — premise, controls, one-time campaign purchase, restore. The browser uses clearly labelled local playtest credits, never real SKR.
2. **Hideout** — continue, all twelve missions with inline briefing, stars and collection. Shop, daily records, entry challenge and settings open as panels. No separate inventory, collection, profile or briefing screens.
3. **Heist** — large angled 3D scene, objective, battery, joystick / keyboard, take, dash and decoy when applicable. Pause and results are overlays; retry and next mission stay here.

## Browser acceptance

- Fresh profile → review campaign offer → buy with 50 of 250 local credits → select first mission → extract → next mission unlocks.
- All twelve maps can be completed using actual pointer input. Capture, retry, pause, switches, decoys, multiple deliveries and timed gates remain functional.
- Buy every cosmetic, equip it, see appearance change; reload retains purchases, equipment, progress and balance.
- Daily runs record this browser's real results. No fabricated global leaderboard or bot scores presented as users.
- Entry challenge costs 10 local credits, success returns 10, capture/timeout zero. Show terms and a local receipt. Resume saved inputs after leaving/reloading; never debit twice for the same entry.
- Local playtest economy is independent of devnet accounts, server entitlements and transactions. Phantom and live token settlement remain separate integration checks.

## 3D pass

Keep simulation and collision unchanged. Improve silhouettes, material contrast, shadow grounding and district identity. Warehouse: strapped shipping crates, metal shelving, cables and floor markings. Roof: vents, panel seams and cooler trim. Vault: dark metal, inset panels and warm brass accents. Improve courier helmet, backpack and boots; give robots wheel hubs, panels and lenses. Use pooled / shared geometry where possible. Decorative detail stays within existing collision footprints.

Avoid heavy cinematic effects that hide hazards. Keep camera heading compatible with controls. Portrait and desktop layouts must both leave enough space to read guards and the phone. Generated posters remain marketing art, not evidence of in-game graphics.

## Deferred, still required for release

Physical Android / Phantom test, stable HTTPS API, funded devnet mint and live settlement, production signing, performance / thermal run, final asset polish, hackathon APK / demo / deck. Browser playtest completion does not establish these.
