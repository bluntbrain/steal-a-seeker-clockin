# Heist encounters: implementation plan

24 September 2026. Written before implementation.

## Scope and intended experience

Implement the requested encounter and mission changes across the campaign: paired guards around cover, short watched routes versus longer covered routes, faster pursuit, local radio support with an interception role, reinforcements triggered by the phone pickup, an interruptible drone report and directional Heavy armor. Reshape missions into observation, commitment and escape; vary objective placement; teach before combining; add a reusable noisy floor grate; make the finale use established mechanics.

The intended experience is: **I read the situation, made a move and escaped the response.** The early campaign stays forgiving. Later missions should require deliberate timing, routing or combat. Completing a mission without attacking remains a valid strategy when the player earns it through stealth.

No additional purchase mechanics, stat upgrades, new currency or runtime AI service. Keep the existing dark/mint palette and wall art. Do not add a new screen or bottom sheet for these changes.

## Implementation order

1. Snapshot the existing revision-9 maps and archived replay engine for compatibility tests.
2. Add campaign combat revision 10 and bounded, deterministic encounter behavior. Older revisions keep their existing code path.
3. Author mission layouts and encounter landmarks. Validate traversal before balancing damage.
4. Replace the scanner silhouette with a four-rotor Skia asset; add in-world report, armor, grate and entrance cues.
5. Test mechanics, tutorial, repeatability, restore/replay parity and all twelve solutions. Repeat objective-only probes at ordinary tap cadence.
6. Export the playable web build, inspect the actual rendering and exercise representative missions. Build an Android test APK if the native toolchain is available, with physical-device checks reported separately.

## Rules

### Patrol, pursuit and radio

- Patrol slowly inside authored encounter zones with seeded variation and pauses. Do not use unbounded random walks.
- After confirmed sight, pursue at a separate authored speed, below the courier's carrying speed for ordinary guards. Aim, committed fire and recovery remain distinct phases.
- Preserve contact with a nearby visible opponent; cover still breaks vision.
- Local radio reports carry a position snapshot. One responder follows that location; another can take a reachable neighboring route junction. Responders never know the hidden live courier position.
- Bound support counts by campaign stage and avoid assigning several responders to the same interception point. Preserve the pathfinding budget and stagger replanning.

### Pickup response

- Interpret “at the same point the phone is picked” as **at the moment of pickup**. Activate the response immediately from an authored entrance, with a short visible arrival warning. Never materialize a firing guard on the courier.
- Reinforcements are preallocated in the level, spawn once, and join during the return journey. Nearby ordinary guards investigate the pickup snapshot.
- Extraction has a viable route after the response. Existing guards can be bypassed or defeated; there is no kill-all requirement.
- Multiple-phone missions do not spawn unlimited waves.

### Drone

- Four distinct fan housings, diagonal arms, central body and forward camera. Render with the existing Skia vector system; animate rotor blades using the shared presentation clock. No additional GPU texture dependency.
- States: scanning, charging a report, broadcasting briefly, then cooldown.
- A report requires sustained actual sight. Breaking sight or defeating the drone before charge completion cancels it. No through-wall report charge or instant room alert.
- Use a visible progress ring and a recognizable radio cue. Drones do not shoot.

### Heavy and Warden

- Frontal armor reduces bullet damage; side hits remain normal; rear hits do more damage. Evaluate the impact direction against the guard's facing at impact.
- Show frontal armor and a rear weak-point marker. Do not make the whole body flash identically for a blocked and a weak-point hit.
- A surviving guard reacts once rather than becoming permanently staggered by repeated hits.
- Keep weekly and legacy replay damage unchanged.

### Environment and input

- A noisy floor grate emits a local position snapshot when crossed, with a cooldown. It uses normal movement; no extra distraction button.
- In-world cables/markings connect switch and gate where applicable. Entrance warnings, objective pedestals and exit markings use the established palette.
- Objective hit areas must not be stolen by an occluded guard. Confirm actual target selection with regression cases before increasing pressure.
- All authored safe pockets and bypass paths must be collision-valid. No gate can close on a body or eliminate the only remaining route.

## Mission plan

| Mission | Encounter and route question | Pickup/escape change | Difficulty intent |
|---|---|---|---|
| 1 — First Pickup | Keep the working guided taps, safe rear attack and dodge lesson. | Existing easy extraction. | Tutorial; preserve verified guide geometry. |
| 2 — Blind Corner | A drone and scout watch a cover island; go behind the scan or wait. | Local pickup investigation only. | Forgiving introduction. |
| 3 — Crossfire | Two scouts on opposite sides of cover; short watched crossing or longer flank. | Guard attention shifts to the pedestal. | First deliberate tactical choice. |
| 4 — Loading Lockdown | Two small encounter islands separated by a screened pocket. | First marked reinforcement entrance activates at pickup. | Teach return-route planning. |
| 5 — Skybridge | Short exposed gaps and a covered outer loop, with moving drones. | A response approaches one return lane. | Timing under moderate pursuit. |
| 6 — Heavy Watch | Heavy protects the direct approach; a loop reaches its rear. | Drone/local guards respond to the theft. | Learn directional armor. |
| 7 — Split Route | Short central crossing versus long flank around paired guards. | A pursuer and route responder test the chosen exit. | Combine route choice and radio. |
| 8 — Twin Relay | Two pickups with different cover approaches and a useful regroup pocket. | First theft changes the second trip; one bounded reserve. | Planning over two trips. |
| 9 — Dark Circuit | Read the switch/gate connection; choose a noisy shortcut or quiet detour. | Pickup guards investigate while the opened route remains usable. | Introduce environmental noise. |
| 10 — Vault Window | Approach extraction through cover; time the final visible opening. | A marked response makes waiting exposed costly. | Timing plus pursuit. |
| 11 — Security Grid | Linked rooms, paired guards and a drone; break contact between rooms. | Bounded support checks a neighboring junction. | Combine known rules. |
| 12 — Last Seeker | Warden's front, rear flank, drone report and two exit approaches. | Pickup response creates the final escape decision. | Final exam; no surprise new rules. |

Exact coordinates and timing will be refined through collision, replay and playtest evidence. Avoid trying to make every level harder by increasing enemy count.

## Acceptance checks

- The complete existing tutorial still succeeds with off-center taps and after checkpoint restore.
- Every mission has a winning ordinary-input replay with no health/position overrides; local restore and server verification agree.
- Authored objective routes, return paths, guard anchors and interception points are reachable. Grates and gates do not create softlocks.
- Reinforcements activate from pickup, once, and cannot immediately damage a courier occupying their entrance.
- Drone charge cancels on cover/death; completed reports remain local and bounded.
- Front/side/rear armor damage differs as specified; historical revisions are unchanged.
- Pursuit is faster than patrol, and investigators retain only observed/reported snapshots after sight is lost.
- The same inputs produce identical results; the archived revision-9 campaign and frozen weekly fixtures still verify.
- The objective-only script should no longer make the entire advanced campaign trivial. This is a diagnostic, not a substitute for human difficulty testing.
- Inspect the drone, report animation, armor orientation and entrance warning in the actual rendered game. Profile simulation/path budget rather than claiming performance from unit tests.

## Release boundary

Generate a new rules manifest and verifier bundle. Retain archived bundles and reward compatibility for supported previous campaign versions. This task prepares and tests the new campaign; publishing a new weekly manifest or changing an active competition is a separate release operation. Report exactly which web, emulator, APK and physical-device checks were completed.

## Pursuit correction after the first playtest

The user rejected limited support and enemies abandoning the chase. This supersedes the local-radio/interceptor behavior above for the new campaign.

- A confirmed guard sighting or completed drone charge alerts every living, deployed enemy, including other drones. No response radius or stage-based cap. Reserves join the latest report when they spawn.
- The observing drone starts following immediately and stays in pursuit after broadcasting; the first broadcast can still be canceled by breaking sight or defeating it.
- Engaged enemies retain visible contact around them, including nearby side/back movement. Walls and range still block contact.
- Visible pursuit takes priority over an old patrol/search path, pickup report or floor noise. During recovery, a Heavy closes toward the courier rather than continuing an obsolete waypoint.
- After losing sight, pursue the last confirmed position and keep searching surrounding corners. No three-second reset to patrol. Only actual observers update the shared position; no hidden live tracking.
- Regression checks must cover the drone after cooldown, Heavy recovery, distant drone responders, fresh reports during a search, reserve arrival, cover interrupting a burst, and long loss of sight. Repeat all twelve solvability checks and desktop probes.
