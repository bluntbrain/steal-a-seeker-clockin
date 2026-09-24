# Steal a Seeker: game-design research and next experiments

24 September 2026. Research and proposals only; no gameplay, economy or release changes made for this report.

## What was reviewed

English captions were retrieved and read for all four supplied videos, totaling 87 minutes 13 seconds. This is transcript-based analysis, not a claim to have visually watched every example. The addiction essay uses automatic captions, so exact wording may contain transcription errors. Full third-party transcripts are not reproduced here.

| Video | Length / captions | Useful lesson and source passage |
|---|---|---|
| Game Maker's Toolkit — **How To Think Like A Game Designer** | 13:06 / supplied English | Work backward from the desired player experience to the behavior and rules that produce it. Mechanics can undermine one another. [MDA, 1:33](https://www.youtube.com/watch?v=iIOIT3dCy5w&t=93), [vision, 5:04](https://www.youtube.com/watch?v=iIOIT3dCy5w&t=304), [interactions and playtesting, 8:28](https://www.youtube.com/watch?v=iIOIT3dCy5w&t=508). |
| Field of View — **5 Principles of Game Design** | 39:47 / supplied English | Vision, agency, feel, systems and discovery need to reinforce each other. Bounded choices, responsive actions and combinations of familiar rules can create depth. [Agency, 6:11](https://www.youtube.com/watch?v=pF2LGYVRCwI&t=371), [feel, 14:46](https://www.youtube.com/watch?v=pF2LGYVRCwI&t=886), [adaptive audio, 24:13](https://www.youtube.com/watch?v=pF2LGYVRCwI&t=1453), [discovery, 30:59](https://www.youtube.com/watch?v=pF2LGYVRCwI&t=1859). |
| goukigod — **Designing Addiction: The Twisted Psychology Of Game Design** | 16:08 / automatic English | A critique of reward schedules, loot boxes and spending friction. Treat this as a warning about reward chasing and obscured costs, not a scientific recipe for enjoyment. [Reward tactics, 4:18](https://www.youtube.com/watch?v=K0M1PuQaE8s&t=258), [currency and spending, 9:24](https://www.youtube.com/watch?v=K0M1PuQaE8s&t=564). |
| Luke Muscat — **How to be a game designer** | 18:12 / supplied English | Choose rules that create many useful combinations within production constraints. Prototype, communicate the reason for a change and observe players before polishing. [A reusable mechanic, 3:33](https://www.youtube.com/watch?v=d8EBjqWb5SA&t=213), [prototypes, 12:24](https://www.youtube.com/watch?v=d8EBjqWb5SA&t=744). |

The proposals below are our application of those ideas to the current game. They are hypotheses to test, not claims made by the video creators or proven retention improvements.

## The most important finding

**The current local campaign lets a simple objective-seeking strategy win every mission without firing a shot.**

The attached probe uses ordinary `combatTap` and `step`, knows the switch/phone/exit coordinates and relies on the game's normal pathfinding. Whenever its order clears, it taps the next objective again. It does not override health, position, enemy behavior or rules. All twelve missions finish; seven finish with full health. Excluding the tutorial, all eleven finish and six take no damage.

| Mission | Name | Finish time | Health left | Courier shots |
|---|---|---:|---:|---:|
| 1 | First Pickup | 12.2 s | 100 | 0 |
| 2 | Blind Corner | 11.3 s | 85 | 0 |
| 3 | Crossfire | 15.3 s | 100 | 0 |
| 4 | Loading Lockdown | 12.3 s | 100 | 0 |
| 5 | Skybridge | 12.3 s | 100 | 0 |
| 6 | Heavy Watch | 21.1 s | 100 | 0 |
| 7 | Split Route | 13.2 s | 82 | 0 |
| 8 | Twin Relay | 25.8 s | 28 | 0 |
| 9 | Dark Circuit | 13.2 s | 100 | 0 |
| 10 | Vault Window | 12.8 s | 100 | 0 |
| 11 | Security Grid | 11.7 s | 64 | 0 |
| 12 | Last Seeker | 12.3 s | 82 | 0 |

**Slower-input check:** repeating the probe at a maximum of one tap per second also clears all twelve missions with zero shots fired. Four finish at full health. Mission 10 drops to 10 health, versus 100 in the faster-input run, so timing clearly matters in some encounters. The result supports investigating the broadly successful objective-only strategy; it does not mean every route or starting phase is safe. See `objective-only-30ticks-results.json` for the full second pass.

Scope matters: this is one deterministic initial state per mission in the current working tree, which includes uncommitted changes. It does not test the published APK, physical controls, the tutorial overlay, discovery of objectives or human enjoyment. It automatically retries taps as often as the simulation allows. Some objective taps resolve to attack commands when a guard is near the tapped location; those attempts never fire a shot. The probe is a reproducible design diagnostic, not a human difficulty rating or a statistically measured win rate.

Avoiding combat is a valid stealth strategy. The problem is that this same minimal strategy works throughout the campaign without deliberate routing or evasive decisions. Requiring every guard to die would remove a valid way to play. Instead, make bypassing guards require observation, timing or an intentional longer route.

### Why the current rules permit this

- **Speed advantage:** the courier moves at 4.1 world units/s, or 3.15 carrying a phone. Ordinary guards patrol at 0.68–0.90 and investigate at 1.22 times that. Once a guard starts aiming, it can be easy to leave its lane before the shot.
- **Range advantage:** the courier's attack range is 4; ordinary authored guard ranges are 2.9–3.5. This can make frontal shooting too safe as well. It did not cause the zero-shot wins, but it is a separate balance concern.
- **Late reinforcements:** missions 4, 5 and 7 wait 13–15 seconds after an alarm. The entire objective-only runs finish in roughly 12–13 seconds, so those reinforcements cannot influence those runs.
- **Repeated objective geometry:** missions 2–12 generally put the courier at the bottom, the phone near the upper-right and extraction near the starting point. Mission 8 adds a second phone. Visual wall variety does not guarantee distinct tactical problems.
- **Some advanced systems are already present:** seeded roaming, last-seen searches, nearby radio reports, contact retention, drones, rear ambushes, cosmetic combos, defeat effects and haptic policies. Adding these again would not solve the encounter design.
- **Music has room to respond:** there are already twelve level tracks, but the current alarm change mainly raises the same track's volume from 0.42 to 0.48.

Source files: `src/game/combat.ts`, `src/game/campaign-layouts.ts`, `src/game/encounters.ts`, `src/audio/useLevelMusic.ts`, `src/feedback/clean-combo.ts`. File hashes are recorded in `sources.json` for this working-tree snapshot.

## Design direction

**The intended feeling: “I outsmarted the guards—and barely escaped.”**

A good encounter should offer a readable threat, a small decision, a responsive action and a brief release of tension. The first missions should let new players learn and succeed. Later missions should combine known rules so skilled players must pay attention. Difficulty should come from choices and execution, not unclear controls, surprise damage or excessive enemy health.

## Thirty ideas, in priority order within each group

P1 means prototype first. P2 means test after the basic encounters work. P3 means optional expansion. These are a menu, not a request to implement all thirty.

### Combat and guard behavior

1. **P1 — Give each small encounter one tactical question.** Two enemies around a cover island: wait for separation, flank, or risk a fast frontal fight. Place a safe observation pocket before the encounter. Extends existing guards and walls; mainly level-authoring work.
2. **P1 — Make exposed movement dangerous, but predictable.** A late-level sentry should control a clearly marked lane long enough that the player must wait, evade or flank. Preserve a visible aim warning and escape window. Tune lane geometry, aim and range together; do not globally multiply damage.
3. **P1 — Separate patrol speed from pursuit speed.** Slow patrols help players read the scene; an alerted guard should close distance convincingly. Begin with one pursuer and retain a viable cover loop. This requires tuning, not a new AI service.
4. **P1 — Give radio support a different job.** The first guard follows the last known position; one nearby responder checks an adjacent exit from that area. Extend the existing bounded radio system. Never feed hidden player coordinates to responders or seal every escape simultaneously.
5. **P1 — Bring reinforcements into the actual escape.** Trigger a clearly announced doorway response from the pickup or a return-route checkpoint. Use measured travel time instead of a fixed delay longer than the entire run. No spawning on top of the player; keep at least one escape route open.
6. **P2 — Make the drone a target-priority decision.** Add an explicit scan → report preparation → broadcast sequence. The player can break sight or defeat the drone before the report. This extends existing drones/radio with an interruptible, readable warning; it should not add another action button.
7. **P2 — Give the Heavy a directional weakness.** Strong frontal protection and a readable turn/recovery create a flanking puzzle. More health alone only extends shooting time. Prototype the silhouette/feedback before adding detailed armor art.
8. **P2 — Let players understand how they escaped detection.** Preserve the existing last-seen search, but make searching versus confirmed tracking visually distinct. Reaching cover should lead to a search; stepping slightly sideways beside an alerted guard should not make it forget the player.

### Maps and mission variety

9. **P1 — Make two routes meaningfully different.** A short watched crossing and a longer covered loop should offer speed versus safety. The longer path must cost enough time to be a real choice without becoming tedious. A direct objective tap should not routinely select a route that trivializes the encounter.
10. **P1 — Make stealing the phone change the problem.** The existing pickup alarm can activate a new patrol goal, open an alternate corridor or announce a guarded exit. The return journey should require a fresh choice. Warn before any route closes and prove the remaining route is reachable.
11. **P1 — Design exposure windows around movement time.** Measure how long a courier takes to cross a gap, how long a guard watches it and where the next safe pocket lies. Test entering at several patrol phases; a map should not work only from one lucky starting state.
12. **P1 — Use three beats per substantial mission.** Observation → commitment → escape. A brief safe pocket between fights allows players to register a successful move. Constant enemy overlap feels noisy; uninterrupted empty corridors feel automatic.
13. **P2 — Vary the relationship between entry, objective and exit.** Try central vaults, opposite-corner extraction and a choice of two return loops. Preserve the game's existing colors and art language. Make original layouts using these principles rather than tracing another game's maps.
14. **P2 — Prototype one reusable environmental rule.** For example, a noisy metal grate creates a sound event that guards investigate when crossed. It uses movement and the existing hearing system, so there is no confusing distraction button. Test whether the noise makes route choice interesting before creating more props.
15. **P2 — Use recognizable landmarks instead of more overlays.** A visible cable connects a switch to its gate; extraction has one consistent light/symbol; a phone pedestal is readable at gameplay zoom. Keep these readable without color alone. The player should understand the room while still playing.

### Controls, sound and feedback

16. **P1 — Fix ambiguous taps before increasing difficulty.** The probe exposed objective taps resolving to nearby guards, even though no shots followed. Test phone, guard and gate hit areas on a physical phone; use explicit priority and feedback for occluded/overlapping targets. A failed input must not feel like a tactical mistake.
17. **P1 — Measure tap response during combat stress.** The latest tap should win, with immediate visual acknowledgment. Profile rapid taps, path requests, guard replanning and effects together. Set a physical-device frame-time target from measurements rather than promising smoothness from desktop results.
18. **P2 — Make enemy attack phases unmistakable.** Use distinct aim, committed shot and recovery cues. A visible commitment point lets the player deliberately dodge rather than merely outrun slow enemies. Keep sounds short and prioritize the nearest relevant threat.
19. **P2 — Turn existing defeat effects into one coherent impact.** Synchronize reaction pose, impact flash, sound and a brief haptic. Avoid adding global simulation pauses to ranked play for dramatic hit-stop; use presentation effects unless a pause becomes a versioned game rule. Respect reduced motion and disabled haptics.
20. **P2 — Give the existing combo a musical rise.** DOUBLE/TRIPLE/CLEAN SWEEP already exists and is cosmetic. Add a restrained rising audio sequence and compact feedback when encounter spacing makes it achievable. Do not cover the next enemy or turn it into a mandatory scoring exploit.
21. **P2 — Change musical tension, not just volume.** Prototype a calm base, pursuit percussion and a short extraction resolution. Use a small number of synchronized layers or prepared arrangements and test Android audio/memory cost. Different instruments should signal state before the player reads text.
22. **P2 — Give zoom a threat-awareness rule.** Slight look-ahead toward travel, bounded camera movement and a directional cue for a shooting guard outside the viewport. Test on the actual phone aspect ratio. Close framing is only better when players can still understand danger.
23. **P1 — Make retry nearly immediate.** One retry action should return the player to a ready mission, without replaying onboarding, store offers or unnecessary animations. If a failure tip appears, tie it to the actual cause, such as crossing during a sentry's aiming phase.

### Progression and reasons to return

24. **P1 — Separate finishing from mastering.** Keep early campaign completion welcoming, then offer optional, clearly labeled accomplishments such as no damage or no detection. Do not make every casual clear demand perfection. Any change to existing stars/credits needs an explicit migration rather than silently reinterpreting old achievements.
25. **P2 — Let each collected phone remember something.** Its collection entry can show the mission, the player's actual best record and earned mastery marks. This gives existing collectibles meaning. Do not invent dates or statistics that were never recorded.
26. **P2 — Keep the first outfit attainable through play.** Preserve the current known first-clear credit path toward the starter outfit, roughly five to six missions. Show the remaining amount plainly. More premium skins will not compensate for weak moment-to-moment play.
27. **P2 — Build weekly challenges from familiar rules plus one twist.** Example: a known cover layout with a drone patrol that changes the best route. Players can transfer campaign skills and still discover something. Freeze the seed, enemy rules and scoring for everyone during that week.
28. **P3 — Add an optional personal-best ghost.** After a completed mission, a faint, non-colliding replay can show the player's earlier route. It should help improve a run without obscuring guards or offering hidden information during a first attempt. Requires trustworthy replay and version compatibility.
29. **P2 — Keep spending understandable and competition fair.** Sell identifiable cosmetic items at visible SKR/SOL prices, with the exchange-rate context already needed by checkout. Avoid paid random rewards, paid stat advantages or difficulty engineered to sell relief. These are product constraints, not additional store screens to build now.
30. **P3 — Add brief, characterful escape reactions.** A guard reaches the empty pedestal and looks toward the departing courier; the courier gives a quick relieved glance after extraction. Put humor after the tactical payoff, with no interruption of movement or retry. This fits the cute heist identity better than another generic reward animation.

## Proposed twelve-mission learning curve

These are encounter objectives, not final maps or promised win rates. Preserve existing mission identities where possible. Keep the tutorial reliable before tuning difficulty.

| Mission | Main lesson / decision | Intended pressure |
|---|---|---|
| 1 — First Pickup | Tap movement, one safe rear attack and extraction. Demonstrate the rules through play. | Very forgiving; early success. |
| 2 — Blind Corner | Observe a drone, cross behind its scan and break sight around one corner. | Easy; one readable threat. |
| 3 — Crossfire | Two guards watch different lanes around one cover island. Choose timing or the longer flank. | First deliberate route decision. |
| 4 — Loading Lockdown | Scout the return route; pickup starts an announced response at one doorway. | Moderate, with an open escape loop. |
| 5 — Skybridge | Cross short exposed gaps between safe pockets while a drone changes the timing. | Movement timing; no constant crossfire. |
| 6 — Heavy Watch | Use a Heavy's directional weakness and recovery; an outer bypass remains possible but slower. | Enemy-role understanding. |
| 7 — Split Route | Commit to the short watched route or longer covered route, then react to one support guard. | Risk versus speed. |
| 8 — Twin Relay | Choose pickup order for two phones; the first theft changes the second trip. | Planning and resource preservation. |
| 9 — Dark Circuit | Read a switch/gate connection and use the changed route to separate a patrol. | Environmental reasoning, not switch hunting. |
| 10 — Vault Window | Reach a safe extraction pocket and time the final opening. | Execution under a readable deadline. |
| 11 — Security Grid | One observer and a bounded responder test breaking contact across connected rooms. | Combining stealth, pursuit and cover. |
| 12 — Last Seeker | Read the Warden's opening, choose a pickup route and escape a coordinated response. | Final exam of established rules; no surprise new mechanic. |

Progression should not mean every later mission contains more enemies. A threatening pair with useful geometry can demand more attention than six guards who never intersect the route. Mission 8 deserves special attention because the simple probe took substantially more damage there than on the finale; that is a hypothesis about pacing, not a human difficulty ranking.

## What to build and validate first

1. **Repair control ambiguity and verify the existing tutorial on a physical phone.** A harder game magnifies unreliable taps and crashes. Capture input acknowledgment, frame timing and failure logs on the target hardware.
2. **Prototype three missions using existing art:** mission 3 for lane/flank choices, mission 7 for pursuit/return-route pressure, and mission 12 for a readable final encounter. Compare each with its unchanged version. Do not redesign all twelve before seeing whether the behavior improved.
3. **Test simple strategies against the revised missions:** objective-only taps, edge hugging, frontal shooting and deliberate flank routes. An easy tutorial can permit a straight run; advanced missions should not all be trivialized by the same strategy. Prove at least one reasonable route remains possible across sampled patrol phases.
4. **Observe a small mix of new and experienced players without coaching.** Record first-attempt clears, damage locations, intentional waits/route changes, mistaken taps, why they say they lost and whether they voluntarily retry. Include the reviewer if they are willing. A small cohort is directional evidence, not a statistically established retention result.
5. **Ask whether difficulty became interesting.** A lower completion rate alone is not success. Look for understandable mistakes, improved second attempts, several workable strategies and voluntary replay. Reject changes that mainly add waiting, damage from unseen threats or input frustration.
6. **Roll the successful encounter pattern through the remaining campaign.** Then add adaptive music and refine impacts. Generate UI concepts before implementing any genuinely new screen, following the existing project workflow; none are needed for the first encounter prototypes.

## Weekly compatibility

The current weekly generator uses the legacy combat definition/revision 6, while the revised local campaign uses revision 9 for missions 2–12. Campaign changes therefore must not be described as automatically changing the live weekly challenge.

Any future change to ranked rules needs coordinated client simulation, server replay validation, rule-bundle compatibility and a new frozen weekly manifest. Keep the active week's rules intact. Never give different players hidden difficulty adjustments within the same ranked challenge. Cosmetic sound/camera changes should remain separate from simulation and score rules.

## What to postpone

More outfits, further 3D polish, a runtime language-model guard service, more purchase screens and copying twelve reference maps are lower priorities than proving three interesting encounters. None of those directly fixes the objective-only strategy. The next update should have a testable gameplay claim rather than simply a larger feature list.

## Reproduce the diagnostic

From `seeker-game`, with the project's Node runtime and dependencies available:

```sh
npx tsx docs/research/2026-09-24-game-design/objective-only-check.ts
npx tsx docs/research/2026-09-24-game-design/objective-only-check.ts 30
```

The script writes `objective-only-results.json` beside itself; the second command writes `objective-only-30ticks-results.json` with taps limited to once per second. Results describe the code installed at execution time; the accompanying `sources.json` records the research snapshot's core-file hashes. Re-running after a game change intentionally updates the result file.
