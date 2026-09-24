# Gameplay, guard behaviour and Solana skins

Research and original plan: 23 September 2026. The user subsequently approved implementation. See [the implementation and verification report](SOLANA-ENCOUNTERS-IMPLEMENTATION.md) for shipped behaviour, tuning, assets and remaining device checks. The proposals below are retained as design rationale.

## Recommendation

Build readable encounters before adding more systems. The main problem is not a shortage of walls or a missing AI service. Normal guards follow predictable loops, do not share sightings, and return to patrol without a convincing search. Repeated small wall blocks make many encounters feel similar.

Use local, deterministic guard decisions and distinct cover layouts. Keep our dark mint palette, ranged combat, Seeker collection and extraction objectives. Start with three playable prototypes—missions 2, 5 and 9—before replacing all 12 maps. A wall layout balanced for Hunter Assassin's close-range attacks is not automatically balanced for our shooting game.

## Fixed now: district connections

The screen now snakes through the districts:

```text
01 → 02 → 03 → 04
               ↓
08 ← 07 ← 06 ← 05
↓
09 → 10 → 11 → 12
```

Only display anchors and connector paths change in `src/components/CampaignDistricts.tsx`. Mission IDs, content, saved stars, unlock order and scoring stay attached to their original missions. The left connector routes around the Powerworks heading.

Verified in phone-sized browser previews and at desktop size. Mission 5 opens Skybridge; mission 9 opens Dark Circuit. Type checking, production web export (including the rules manifest check), and all five campaign-completion tests pass. This update has not been packaged into a new APK or installed on a phone.

## What the reference actually shows

Source: [Hunter Assassin gameplay walkthrough](https://www.youtube.com/watch?v=raDBMEIr6Uo), approximately 10:49. Extracted 130 screenshots at five-second intervals; reviewed their contact sheets. The local research gallery contains every sample. These are visual observations, not a reconstruction of the game's source code. The scrolling camera also prevents a single screenshot from revealing every part of a map.

Useful patterns:

- Around 00:35: a large U-shaped wall and separate islands make a readable loop, rather than an even grid.
- Around 01:10–01:20: a courtyard and long wall divide two approach lanes. Short pieces of cover interrupt exposure along the route.
- Around 03:15–03:30: a narrow bypass sits beside shorter, more exposed routes.
- Around 04:40–04:55: the boss arena has substantial open space around a few large islands. More difficulty does not require more wall density.
- Around 06:25–06:40: divided rooms and gates create successive encounters.
- Around 08:50–09:30: multiple small courtyards create repeated ambush and retreat opportunities. This section also shows failed attempts; it is not evidence that this difficulty should be used early in our game.
- Around 09:40–10:15: broad wall spines form an S-shaped route with cross-links.

The repeatable rhythm is **approach unseen → strike → attention shifts → relocate behind cover → choose the next approach**. Take this rhythm and topology as reference; design our geometry around projectile line of sight, collision clearance, phone retrieval and a return path. Keep the current colours and wall art.

The [Realme review](https://c.realme.com/in/post-details/1220765619637452800), dated 24 January 2020, describes simple tap controls, flashlight avoidance, escalating enemies and other guards rushing to a defeat location. It supports the importance of readable reactions, but is an old player review, not evidence for a particular AI algorithm. Adopt clear controls and reactions; do not import the screenshots' ads, random unlocks or paid health/speed advantages into weekly competition.

## Guard AI: varied, but learnable

### Current implementation

- `src/game/combat.ts`: revision 7 drones already report sightings to nearby guards. Ordinary guards currently update only their own last-seen position when they see the courier.
- Combat guards investigate a position and then return to their authored waypoint loop. Their shot/recovery phases intentionally include pauses; randomising all pauses away would remove useful counterplay.
- `src/game/guards.ts` already defines patrol, investigate, search and return state fields. The active combat path does not yet use a full search phase.
- The phone alarm currently reports the courier's position periodically. That explicit beacon must be distinguished from ordinary guard vision, otherwise losing line of sight will appear broken.
- Navigation and wall-safe movement already exist. Reuse them rather than adding a second movement engine.

### Proposed state machine

| State | Behaviour | Visible feedback |
|---|---|---|
| Roam | Choose a reachable point within an authored patrol zone; pause and look at a corner | Normal cone; relaxed motion |
| Suspicious | Turn toward a noise or partial sighting, with a readable response delay | Small amber marker |
| Pursue | Move toward a confirmed sighting or a fresh shared last-seen position | Red alert; existing aim/burst tells remain |
| Search | Check two or three reachable corners near the last sighting for 2–4 seconds | Amber search state; no live tracking through walls |
| Return | Rejoin the home zone and resume varied patrol | Alert fades |

Initial tuning values are starting hypotheses, not tested balance: a 0.25–0.4-second sight confirmation/response window and a 4.5–5-tile local radio radius. Preserve the existing fair-ambush turn rate and attack wind-up so arriving behind a guard does not cause an instant 180-degree shot.

### Shared sightings

1. On a newly confirmed sighting, emit `{eventId, reporterId, position, tick, expiry}`.
2. Only active guards within the level's alert radius can respond. Use a small, explicit radio pulse as the explanation when a guard is behind a nearby wall.
3. Early missions permit one supporting responder, middle missions two, late missions at most three. The observer is separate from that support cap.
4. Recipients use the reported position, not the courier's hidden live position. Recipients do not recursively rebroadcast the same event.
5. Stagger response times and destinations. One pursuer checks the last-seen position; another may check a nearby reachable exit from that area. Neither gets knowledge of the player's unseen route.
6. Expire reports and search, then de-escalate. Keep reinforcement spawning separate and delayed; a detection must not silently spawn a crowd on top of the courier.

### Roaming without fixed loops

Author zones and candidate patrol anchors with each map. Choose the next anchor with a weighted, seeded random generator: prefer unvisited anchors and short paths, penalise immediate backtracking and destinations another guard already occupies. This allows variable movement while preventing guards from abandoning an encounter or congregating at one doorway.

Do not use `Math.random()` in the simulation. Derive each guard's random stream from the level seed and stable guard ID, and store its state with the simulation. Campaign missions initially keep repeatable seeds so retries are learnable. Weekly attempts share the same challenge seed and rules. The path through the fight can differ because of player actions without giving one competitor an easier random roll.

Repath only after a relevant event or an expired route. Stagger requests and budget pathfinding work per simulation tick; start with at most two path searches per tick, then measure. Cache static navigation data and invalidate gate-dependent paths when a gate changes. Do not move pathfinding, physics or hit checks into network requests or React rendering.

### Alarm rule

For the new rules revision, replace the always-current phone position broadcast with an explicit pickup alert at the phone location, followed by normal sight/noise reports. If a later level needs a tracking beacon, give it a visible timed pulse and teach it there. This is a proposed rule change and must be tested before shipping.

## Twelve-map design plan

These are original layout briefs informed by the referenced topology, **not implemented or claimed to be solvable yet**. Proposed enemy counts include drones and exclude delayed reserves. Retain each mission's existing named objective and collectible phone. A drone replaces a normal guard in missions 2–6; it is not automatically an extra enemy.

| Mission | Cover and routes | Proposed encounter | What it teaches | Target first-attempt wins* |
|---|---|---|---|---|
| 1 · First Pickup | One L-shaped island, generous start pocket, a simple return lane | 2 separated normal guards; no support response | Move, shoot from safety, collect, exit | 90–95% |
| 2 · Blind Corner | U-shaped cover with two ways around it; short central island (ref. ~00:35) | 2 guards + 1 roaming scout drone; 1 support cap | Break detection around a corner | 85–90% |
| 3 · Crossfire | Offset long walls and two safe alcoves; diagonal cross-link (ref. ~01:10) | 3 guards + 1 drone in two separated pairs | Clear one firing lane before crossing | 80–85% |
| 4 · Loading Lockdown | Loading-bay loop and a side bypass; phone pocket off the main lane (ref. ~02:10) | 3 guards + 1 drone; reserves delayed until there is time to move | Plan the escape before pickup | 75–85% |
| 5 · Skybridge | Two parallel roof routes joined at three protected crossings (ref. ~03:15) | 3 guards + 1 drone; 2 support cap; delayed reserves | Choose a crossing and escape pursuit | 70–80% |
| 6 · Heavy Watch | Large central island with two flanking routes and small rest pockets (ref. ~04:40) | 1 Heavy, 2 normal guards, 1 drone | Flank during the Heavy's recovery | 65–75% |
| 7 · Split Route | Short exposed middle lane and a longer outside loop (ref. ~05:35) | 5 guards in two zones; delayed reserves | Speed versus safety without a forced damage trade | 60–70% |
| 8 · Twin Relay | Two linked courtyards and a sheltered central return route (ref. ~06:25) | 5 guards; encounters reset between the two retrievals | Preserve health across two trips | 60–70% |
| 9 · Dark Circuit | Switch in a visible safe alcove; gate on a clear main route; outer retreat loop (ref. ~06:55) | 5 guards; switch reachable before crossing enemy lanes | Understand switch → gate → phone | 55–65% |
| 10 · Vault Window | Ring around the exit area; protected staging pocket before its timed opening (ref. ~08:00) | 6 guards in staggered zones; no initial overlapping cones | Observe the exit window, then commit | 50–60% |
| 11 · Security Grid | Three linked rooms, each with an island and two exits (ref. ~08:50) | 6 guards; capped support; sighting roles split across corners | Dismantle the network one encounter at a time | 45–55% |
| 12 · Last Seeker | S-shaped spine leading to an open Warden arena, plus a longer bypass (ref. ~09:40 and ~04:40) | 1 Warden + 5 mixed enemies, separated into phases | Combine ambush, retreat and extraction | 40–50% |

*Product targets for first-time players, not measurements. Test with people new to the game. A bot completing a level proves a route can exist, not that a human will understand or enjoy it. Keep all 12 completion targets achievable within a few attempts; difficulty can come from optional faster/cleaner clears.

Geometry acceptance checks: at least two useful approach choices for each post-tutorial encounter, collision-safe corridor widths with margin, one usable escape route after detection, no enemy at the spawn exit, reachable objectives in every relevant gate state, no unavoidable crossfire, and preserved switch/timer/two-phone mechanics. Guard spacing and the timing of support arrivals matter more than a wall-count quota.

## Level-start focus animation

Use a shrinking mint focus ring rather than a screen-covering modal. Initial proposal: about 650 ms from outside the viewport to the courier, then fade. Add only a mild camera settle; the player needs to retain awareness of nearby walls and guards.

- Start only after the new scene's assets and layout are ready in `src/GameScreen.tsx`, keyed by the scene epoch. Never animate over the previous mission's map.
- Use Skia/Reanimated on the UI thread. Centre the ring using the existing world-to-screen transform from `src/camera/geometry.ts`; integrate with `src/camera/useFollowCamera.ts`.
- Keep local simulation, run timer and movement input gated until the reveal ends. Ensure the ranked run's server expiry has the documented presentation allowance; the visual must not consume competitive play time.
- No additional Continue button. Retry uses a shorter settle. Reduced-motion mode uses a brief static highlight and no zoom.
- Cancel on back/unmount; prevent duplicate starts; verify tap coordinates under every camera transform.

## Hideout: Outfits · Solana · Phones

Replace the Effects sales tab with **Solana**. Keep current colours and stable stage/grid/footer sizing. Retire effects from new sales, but preserve previously purchased entitlements and their equipped appearance; leave any existing effect toggle in appearance settings.

Start with Toly and Mert, then Chase, Lily and Vibhu. Each needs a recognisable character adapted to the game's proportions—not a realistic portrait pasted onto the current body. The supplied private sheets provide identity and outfit reference, but are not game-ready sprite atlases. Confirm permission for commercial likeness use before a paid release, and avoid implying official endorsement.

Required asset pack per skin: consistent store portrait, front/back/left/right idle and walking frames matching the current eight-frame atlas contract, correctly aligned feet/pivot and phone-carry attachment. Test the rendered result in every facing direction; previous left/right mistakes must not recur. Preview and in-game appearance must use the same equipped identity. Loading a new atlas should use the existing scene-ready gate.

### Pricing and clarity

Current ordinary outfit defaults in `shared/store.ts` range from 300 to 600 credits. Propose **3,000 credits per Solana skin**, at least 5× the highest normal default. Use backend-owned SKU pricing, not a client multiplier. Direct SKR/SOL purchase prices are separate backend configuration and need a deliberate price decision before launch.

At present a campaign first clear awards about 50–60 credits. Twelve first clears therefore do not fund a 3,000-credit skin. Be explicit that these are premium cosmetics. If they should be earnable, add a separate repeatable credit-earning plan before promising that; do not silently inflate the economy or force users to replay unrewarded levels.

No health, damage or speed increase for a paid skin, especially in the paid weekly league. Do not copy the reference screenshots' stat bonuses or random unlock mechanic.

### Purchase flow

1. Tap a skin to preview it. This never launches a wallet or charges anything.
2. With enough credits: **Unlock · 3,000 credits**, then an atomic server debit and entitlement grant.
3. Without enough credits: primary CTA opens one dedicated full-price skin checkout, with its portrait, live SKR/SOL quote, currency choice and total. Preserve the player's existing credits. Do not send them through a generic credit-pack purchase unless they choose that alternative.
4. Explicit Pay opens wallet connection/approval as needed. Reuse MWA `signAndSendTransactions`; the current call already exists in `src/commerce/CommerceSection.tsx`.
5. Backend reconciliation confirms the signature and grants the skin once. Only then show Owned / Equip and refresh appearance.

This needs an `openProduct(sku)` route in `src/commerce/EconomyProvider.tsx`, the new SKUs and entitlement mappings in shared/server commerce, portrait/atlas mappings, and an idempotent credit-spend path. Keep cancellation, quote expiry, insufficient SOL for fees, pending status, app restarts and wallet switching explicit. A timeout after submission must reconcile the original payment instead of asking for a second payment. Race a credit purchase against a token purchase in tests: only one ownership grant is allowed and a failed/double purchase must not silently consume value.

## Does Jev help, and what would it cost?

**Do not add Jev to ordinary guard movement.** A local state machine handles these decisions, works offline and preserves deterministic weekly verification. Its additional model API cost is **$0 per play**; normal backend hosting still exists.

TypeSafe's [introduction](https://docs.typesafe.ai/introduction) describes Jev as a model returning structured choices and scores from state and questions. It does not replace collision, navigation or animation code. A later offline experiment could use it to rate authored encounter descriptions, followed by simulation and human playtesting.

The [official model page](https://docs.typesafe.ai/models), checked 23 September 2026, lists Jev 1.13 at **$0.042 per million input tokens**, free output tokens and **1,200 requests/minute**. Limits can change. Illustrative costs below assume exactly 1,000 input tokens per call, a 60-second mission and 300,000 missions/month; they exclude retries, hosting and taxes.

| Use | Calls per mission | Cost per mission | Cost per 300,000 missions |
|---|---:|---:|---:|
| One model call per mission | 1 | $0.000042 | $12.60 |
| One squad decision every 2 seconds | 30 | $0.00126 | $378 |
| Six guards, each every 2 seconds | 180 | $0.00756 | $2,268 |

At the published request limit, squad decisions every two seconds reach the limit at roughly 40 simultaneous players before retries or headroom. Batching guard questions reduces request count but not the need to evaluate token usage and latency. No runtime latency benchmark was performed here.

There is also a fairness cost: `server/replay.ts` verifies runs by replaying input. External model answers would need an authoritative recorded decision stream, version pinning and a deterministic fallback. That is significant infrastructure for behaviour we can implement locally.

## Implementation order and release gates

1. **Current update:** district display fix and this plan only.
2. **Guard prototype:** local roam zones, sighting broadcast, search and readable loss of detection on missions 2 and 5. Keep existing rules available behind the rules revision.
3. **Map prototype:** missions 2, 5 and 9 first. Playtest movement, shooting, pickup/return and switch teaching. Adjust topology before reproducing the approach across all 12.
4. **Campaign rollout:** remaining layouts, opening focus ring and tutorial tips describing the actual new mechanics. Run reachability and end-to-end simulation, then human tests.
5. **Skins:** generate and verify two complete asset packs, implement the Solana tab and backend SKU purchase flow, then test Android equip and wallet flows. Expand the cast after the first two work.
6. **Weekly rollout:** publish a new frozen challenge/rules revision at a week boundary only after client and server agree. Current weekly contracts use revision 6 while campaign combat uses revision 7; do not change active-week geometry or scoring underneath submitted runs.

Required checks before shipping the later changes:

- Same seed and input replay produce identical guard states, hits and final scores; historical rules still replay.
- Alert propagation stays local and capped; breaking sight stops live tracking; no repeated report chain, instant ambush snap or guards stuck at gates.
- Every mission's objectives and extraction remain reachable; reinforcements leave a fair reaction window; missions 10–12 start with separated patrols.
- Opening animation never shows an old map, starts the timer early, accepts stray taps or survives navigation away.
- Rapid tapping and maximum enemy count on the Realme and, when available, Seeker: record frame-time percentiles, pathfinding time, memory and stutters. Aim for a 60 Hz frame budget; do not claim smoothness based only on browser testing.
- Paid skins match previews in all directions; no stats or weekly score changes; ownership survives restart and wallet switching.
- MWA payment approval appears with the correct live total; cancellation grants nothing; pending signatures recover; duplicate retries never charge/grant twice.

The next implementation should optimise encounter quality and reliability first. Adding an AI subscription, five paid skins and twelve new layouts at once would make it harder to tell which change improved the game.
