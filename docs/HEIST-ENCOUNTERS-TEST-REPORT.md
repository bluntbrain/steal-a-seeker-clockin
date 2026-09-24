# Heist encounters — implementation and test report

24 September 2026. Local test build; not published to the dApp Store or production API.

The implementation follows [the plan written before the code changes](HEIST-ENCOUNTERS-IMPLEMENTATION-PLAN.md). Campaign missions 2–12 now use combat revision 10; mission 1 retains the verified guided tutorial.

## What changed

- Paired patrols around cover islands, covered flank routes, regroup pockets, and watched shortcuts across the campaign. Authored route hints are longer than the direct path and collision-checked. These are options, not guaranteed safety under every patrol phase.
- Separate slow patrol and fast pursuit speeds. A confirmed guard sighting or completed drone broadcast now reaches every living deployed guard and drone. They converge on the latest observed position and continue searching after cover breaks vision. The first-playtest support radius, responder cap and interception detour have been removed. Hidden player positions are not transmitted.
- Pickup starts the entrance warning immediately in missions 4, 5, 7, 8, 10, 11 and 12. A reserve enters after 24 simulation ticks (0.8 seconds), once only, and waits if the courier is within 2.2 tiles of the entrance.
- Four ducted fans, diagonal arms, camera and animated rotor blades replace the old drone shape. Sustained sight starts a 27-tick report charge after the initial scan. Cover or defeat cancels it. A completed report alerts the entire deployed team. The drone itself follows the courier instead of returning to its old patrol route.
- Heavy/Warden frontal hits deal 28% damage, side hits keep normal damage, rear hits deal double (capped at 75). Gold front armor and a mint rear marker make the rule visible.
- Noisy metal grates in missions 9–12 where authored, a switch/gate mission, two deliveries, timed extraction, and a finale combining established rules. Grates emit a location snapshot with a cooldown, a visual ripple, a mechanical clack and a haptic cue.
- Updated existing mission lessons and contextual hints; no new game screen, purchase flow or overlay.
- Occluded guards no longer intercept a tap intended for a phone. Older replay revisions retain the old selection behavior.

## Solvability and balance probes

Every level has a verified winning replay made with ordinary recorded taps. No health, positions, enemy state or simulation speed was overridden. The solver attacks visible targets; this proves a route exists, not that a human will find it or enjoy it.

The objective-only probe tries direct objective taps at most once per second, without deliberately choosing enemies. It was repeated with initial waits of 0, 1 and 3 seconds. Values below are remaining HP; **caught** means the run failed. Automatic tap target selection may still select a visible guard near an objective.

| Mission | No wait | Wait 1s | Wait 3s | Combat solver |
|---|---:|---:|---:|---:|
| 1 — First Pickup | 100 | 100 | 80 | 100 HP |
| 2 — Blind Corner | 88 | 100 | 88 | 100 HP |
| 3 — Crossfire | 88 | 100 | 88 | 100 HP |
| 4 — Loading Lockdown | 28 | 46 | 28 | 100 HP |
| 5 — Skybridge | 82 | 64 | 100 | 100 HP |
| 6 — Heavy Watch | 64 | 28 | 64 | 100 HP |
| 7 — Split Route | 28 | caught | 10 | 64 HP |
| 8 — Twin Relay | caught | caught | caught | 64 HP |
| 9 — Dark Circuit | caught | caught | caught | 64 HP |
| 10 — Vault Window | 82 | 28 | caught | 100 HP |
| 11 — Security Grid | 82 | 64 | 64 | 64 HP |
| 12 — Last Seeker | caught | caught | caught | 100 HP |

**Interpretation:** after the pursuit fix, missions 8, 9 and 12 defeat all three direct-objective probes. All twelve still have a verified ordinary-input win. The combat solver now takes damage in missions 7, 8, 9 and 11; it still clears eight missions at full health. Fast offense remains strong, and these probes are not human difficulty ratings. The chase bug is fixed; the full difficulty curve still needs human playtesting.

## Verification

- 288 app tests passed, including the new mechanics, actual Expo/Babel worklet-module initialization, tutorial, serialization, path reachability and historical replay checks.
- 79 backend tests passed.
- TypeScript and web export passed.
- All 12 winning campaign replays verified locally. Frozen weekly revisions and archived campaign revisions 7, 8 and 9 retained their verifier outcomes.
- Browser checked at 390×844: ordinary movement into mission 2 triggered the team hunt. The distant scout and red four-rotor drone converged with the observing scout, and continued pressure depleted health. No new JavaScript errors were logged. Heavy pursuit/recovery is also covered by the targeted regression tests.
- Android release-mode **judge/test** APK built separately from the mainnet release. Native test details are recorded below.

The initial rendered build exposed a forward-reference error caused by worklet capture of the visibility helper. That was fixed before the deliverable, and the regression test now loads the actual compiled game modules rather than only a synthetic worklet.

Desktop simulation probes measured a worst per-run p95 step of 0.544 ms. This excludes rendering, audio, bridge work and Android GPU costs. It is not a phone FPS claim. Guard pathfinding is bounded to two plans per simulation tick and replans are staggered.

## Files and release boundary

- Raw probes and ordinary-input winning replays: `verification/heist-encounters/campaign.json`.
- Reproduce with `npx tsx scripts/qa-heist.ts`, `npm test`, `npm run server:test`, `npm run typecheck`, `npm run rules:check`.
- New pinned rules hash: `f4597c232c4bf00b5c1f2d43be08db491fa37812472b656f3fbfb441ec19db74`.
- The active production weekly competition was not changed. This campaign update does not silently replace already-issued weekly contracts.
- The judge APK uses a separate application ID and devnet configuration. It is for gameplay testing, not live payments or store upload. No wallet or payment was tested. The mainnet release remains untouched.
- Before a public release, deploy the matching verifier and campaign-reward version support, then build the mainnet APK with a new version code. Do not distribute a new campaign against an API that cannot verify its rules hash.

## Pursuit regression details

The first heist playtest exposed real state-machine problems rather than just low damage numbers:

1. Drones never entered pursuit after observing the courier, so their old patrol resumed after the broadcast animation.
2. Radio excluded other drones and distant guards, and capped the number of responders.
3. Search expired into return/patrol after three seconds.
4. The Heavy could retain an obsolete waypoint while recovering between bursts.
5. Patrol movement could turn an enemy away during the initial detection confirmation.

The corrected engine keeps persistent hunt state, broadcasts fresh sightings to the whole deployed team, uses direct movement toward a visible courier during recovery, and keeps searching last-seen corners when contact breaks. A later sighting cancels old search paths. An arriving reserve joins the current hunt. Cover interrupts both drone charge and unfinished Heavy bursts. All these transitions are covered by regression tests, alongside deterministic state restoration.

The eight-step native tutorial previously completed at 100 HP on the preceding local APK. That verifies the unchanged tutorial branch, not a full physical-phone test of this patch. The current separate judge APK was rebuilt, installed and launched on the emulator; the startup screenshot is `verification/heist-encounters/android-pursuit-startup.png`, and the captured startup logs contained no JavaScript or Android fatal error. Native pursuit was not played end to end on this exact APK. Physical Realme/Seeker performance remains unverified; one earlier emulator tutorial sample was only 16 FPS, so no smooth-native-performance claim is made.
