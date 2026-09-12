# Mission differences and district visuals

The renderer previously loaded assets/world-v3/floor.png for every mission. District props existed but the shared floor dominated. The new artwork selects a distinct material per district and adds mission-specific paint and equipment.

| Mission | District / place | Main gameplay difference |
| --- | --- | --- |
| 1. Quiet Pickup | warehouse / Loading bay | One pickup lane. Learn to steal and escape. |
| 2. Cone Lesson | warehouse / Sorting depot | Break line of sight around the central rack. |
| 3. Battery Dash | warehouse / Dispatch lane | A long return trip. Save charge for the escape. |
| 4. Crossing Signals | warehouse / Freight junction | Cross two patrol lanes, one at a time. |
| 5. Sweep Window | rooftops / Scanner roof | Move between the tower scanner’s sweeps. |
| 6. Narrow Crossing | rooftops / Skybridges | Two bridge gates open on alternating timers. |
| 7. False Footsteps | rooftops / Antenna terrace | Lure patrols away from the narrow lanes. |
| 8. Warden Gate | rooftops / Warden landing | A long-range Warden protects your exit. |
| 9. Power Trade | powerworks / Switchyard | Swap circuits to open doors and change scanner power. |
| 10. Two Targets | powerworks / Twin archive | Two deliveries. The alarm stays on between them. |
| 11. Silent Circuit | powerworks / Relay chamber | Each relay opens its door for nine seconds. |
| 12. The Last Vault | powerworks / Inner vault | Two phones, circuit doors, a relay and a Warden. |

## Implementation

- Two GPT image floor materials, saved in assets/world-v4, with generation prompts in README.md. Warehouse retains its original texture.
- Scene metadata is presentation-only in src/game/environment.ts. No simulation or ranked replay changes.
- Static art is recorded as Skia pictures once per level; no extra frame-loop rendering work for the landmarks.
- City facades occupy rooftop boundary colliders; rails identify their inner edge. All raised equipment stays inside existing blocker footprints. Markings and circuit traces are flat decorations.
- Briefings show the place and a one-line mechanic summary, replacing the prior timing row.
- The screenshot gallery is at /design/districts/index.html. Rebuild its captured views with scripts/playtest-world-v4.cjs, then scripts/build-district-preview.ts.

## Verification

Typecheck and production web export passed. All 12 actual gameplay scenes and mission previews rendered in isolated browser profiles with seeded unlocks. Small-screen briefing buttons fit at 320×568 and 430×932. No browser runtime errors. These are visual checks, not new completion runs; prior security-v3 simulation routes remain unchanged. Android device checks remain pending.
