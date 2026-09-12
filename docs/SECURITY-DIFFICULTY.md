# Security and decoys — 12 September 2026

The 2D campaign now has one to four guards per map, a theft alarm, and a usable noise decoy. This is the browser balance pass; Android and live wallet testing remain deferred.

## What a decoy does

DECOY / Q throws a small noise beacon in the direction you are moving or facing. The dashed line and landing ring show where it will land. It travels up to 4.4 tiles, stops before cover and makes noise for six seconds.

A mobile guard within nine tiles finds a route to the beacon, walks there, searches and then returns to its patrol. A mint marker and dashed route identify a responding guard. The message below the board reports the number responding and the remaining noise time. Use it from cover, then move away from the beacon. Throwing it along your intended escape path can draw guards into your way.

Scanners stay fixed and ignore noise. A guard that can see the courier gives the courier priority. Break sight before throwing. If a guard turns toward the noise and sees you along the way, it can still catch you. Closed doors may prevent a route; guards retry once per second while the beacon is active. A blocked throw does not spend an item. Out-of-range or unreachable throws explain why nobody responded. A new throw replaces the previous beacon.

The previous implementation only emitted a single frame of noise, supported only selected guards, and used a pathfinding body larger than the authored patrol collision body. The last issue rejected valid paths near cover. Noise now persists and pathfinding uses the same radius as collision.

## After taking the phone

- The first successful TAKE triggers the alarm immediately.
- Mobile guard movement becomes 40% faster, rising linearly to 80% faster over 30 seconds of active play. Scanner sweeps accelerate by the same multiplier.
- The alarm stays active between deliveries. It clears when starting a fresh attempt.
- A red screen tint and border pulse slowly. Top warnings report theft detection, active searches and direct sight. The displayed speed percentage comes from the simulation.
- A quiet looping siren follows sound and volume settings. Pause, menus and terminal results stop it. Reduced effects removes the screen tint and uses a steady border.
- Guards still need sight to detect you. The alarm does not reveal your exact position through cover.

## Mission pressure

| Mission | Guards / scanners | Decoys | Main pressure |
| --- | ---: | ---: | --- |
| Quiet Pickup | 1 | 2 | Guard near the phone; alarm on the short escape |
| Cone Lesson | 2 | 2 | Central patrol plus east-lane reinforcement |
| Battery Dash | 2 | 2 | Exposed return route with a faster patrol |
| Crossing Signals | 3 | 2 | Overlapping crossings and east-lane patrol |
| Sweep Window | 2 | 2 | Fixed scanner plus mobile guard |
| Narrow Crossing | 3 | 2 | Alternating doors and upper/lower patrols |
| False Footsteps | 3 | 2 | Noise lures and multiple approach lanes |
| Warden Gate | 3 | 2 | Long-range Warden plus reinforcements |
| Power Trade | 3 | 3 | Power choices, scanner and escape patrol |
| Two Targets | 3 | 3 | Alarm stays on while collecting the second phone |
| Silent Circuit | 3 | 3 | Timed relays while security accelerates |
| The Last Vault | 4 | 3 | Two phones, power/relay changes, Warden and scanner |

All twelve have deterministic successful input routes. The final-vault fixture uses two decoys. This establishes solvability, not that every player must use that exact strategy. Existing earned stars and purchases remain saved.

## Replay compatibility

The security rules and level identifiers are versioned. New recordings use a new immutable verifier bundle. Old bundles remain available for previously issued server tickets; incompatible old paid runs cannot silently resume using the new rules. Historical native fixtures remain historical evidence and are not claimed as validation of this new build.

## Sound provenance

`assets/security-alarm.wav` is an original four-second procedural two-tone effect, generated locally from sine waves with softened transitions. It contains no sampled song or third-party recording.
