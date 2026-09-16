# Combat revision 3 — pressure, cover and sound

16–17 September 2026. Implementation and test notes for this difficulty pass.

## Reference review

Reference: [Hunter Assassin — Gameplay Walkthrough Part 3, New 2025 Update](https://www.youtube.com/watch?v=raDBMEIr6Uo), Pryszard Android iOS Gameplays, approximately 10:49.

Reviewed sampled gameplay frames and short sequences across the video, not every frame continuously. YouTube's direct media download returned HTTP 403. Browser playback exposed visual frames but no reliable audio audition through the available tools. No soundtrack-specific claims or copied audio assets are made.

Observed examples:

- Around 0:13: a compact corridor junction, blue cover pieces, a visible vision cone and an enemy counter. Most of the screen remains the play area.
- Around 0:54: connected rooms and offset cover break long sight lines. The visual distinction is geometry, not just a recolored floor.
- Around 2:33: a bonus encounter shows 9/30 targets, close contact attacks and immediate reward effects. This is not evidence that every normal mission has thirty guards.
- Around 4:29: a narrow parallel corridor, an orange attack line and 3/4 targets. The approach angle and corner matter.
- Around 7:34: offset passages and obstacle islands, with question-mark awareness feedback visible above guards.
- At 9:44, after the frame finished buffering: tall parallel barriers, 1/6 targets and short side corridors. Cover blocks direct pursuit.

The reference's close-range assassin attacks differ from our courier's ranged dart weapon. Keep its readable sight lines, short decisions and immediate feedback. Do not copy its maps, characters, reward UI or audio. Its quick clears do not prove that making our game punishing will improve retention.

## Problems found in our previous build

1. Guards paced only about 0.6 tile at the edges. Several rooms reused four cover patterns.
2. Patrol speed was 0.6–1 tile/s against a courier moving at 3.4. Alarm speed still left a large gap.
3. A guard shot from behind could keep facing away while being repeatedly hit.
4. Shooting, receiving damage and hitting armor were not distinct enough in the sound mix. Routine taps added noise.
5. A generous 240-second timer did little to distinguish fast escapes. Straight runs could finish most rooms quickly.

## Changes

- Author eleven distinct later-room layouts; retain the eight-step teaching room as mission 1. The tutorial keeps its slower movement and aim timing.
- Later missions: movement 4.1 tiles/s; 3.15 carrying the phone. Responsive tapping remains the only required movement control.
- Patrols: Scouts 1.45, Sentries 1.2, Heavy/Warden 1.05 tiles/s. Alarm pursuit starts at 2× and increases to 2.35× over twelve seconds.
- Guards receive spaced location snapshots every 1.4–1.7 seconds. Cover blocks shots and sight. Pursuit uses walkable paths, not movement through walls.
- Weapon recovery allows repositioning after a brief pause. Aim remains visible for 0.6–1 seconds depending on the enemy. Bullets are finite-speed projectiles.
- Surviving guards react to hits. A clean rear opening before the alarm deals 50 instead of 25 damage, determined at firing time.
- Extraction takes 1.2 seconds. The courier must hold the exit while surviving. A phone pickup takes 0.55 seconds; repeated phone taps no longer cancel that hold.
- Reinforcements remain finite and marked before spawning. Never spawn a guard on the courier. No purchased combat advantage.

## Twelve mission roles

| Mission | Layout / decision |
|---|---|
| 1 First Pickup | Guided move, attack, dodge, theft and escape. Deliberately forgiving. |
| 2 Blind Corner | An elbow blocks the direct route. Take a rear opening instead of fighting head-on. |
| 3 Crossfire | Parallel cargo lanes and a cross-patrol at either end. Clear one lane before changing sides. |
| 4 Loading Lockdown | S-shaped barriers force a return detour; reserves enter behind the player. |
| 5 Skybridge | Three long rooftop lanes with staggered blocked sides. Choose when to cross the middle. |
| 6 Heavy Watch | Machinery creates a ring around armored opposition. Circle instead of trading shots. |
| 7 Split Route | A central divider gives two routes with different patrol timing. |
| 8 Twin Relay | Two separated phone rooms; one health pool must last across both trips. |
| 9 Dark Circuit | Reach a switch, open the enclosed vault, then escape through offset barriers. |
| 10 Vault Window | Obstacle islands, heavy opposition and a three-second exit opening every eight seconds. |
| 11 Security Grid | Three staggered barriers, six initial guards and three reserves. |
| 12 Last Seeker | Warden and Heavy hold the central approaches; side lanes offer a risky bypass. |

All levels keep the existing Warehouse, Rooftops and Powerworks art families and phone collection. Later-room time limits are 100–150 seconds. Different difficulty does not require different control schemes.

## Sound design

Twelve new original cues generated with ElevenLabs `eleven_text_to_sound_v2` using the canonical private credential file. [Official SFX API](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert). Prompts and provenance are in `assets/audio-combat-v3/manifest.json`; no credential is stored in the repository.

- Two courier-shot variations; light and heavy enemy shots.
- Armor hit, player damage, knockout and aiming warning are different cues.
- Pickup, escape, caught and a restrained alarm loop.
- Mono 32 kHz PCM runtime files, trimmed onset, short fades, final peak normalized to -6 dBFS.
- Aim cues have a cooldown. A knockout replaces the extra hit cue. Repeated movement taps are silent.
- Quiet chase/ambience layers leave space for warning sounds. Playback is paused on suspension and stale asynchronous audio starts are rejected.

The reference soundtrack was not reliably auditioned. These are designed improvements, not an exact match. A human listening pass on phone speakers remains important.

## Verification and release gates

- TypeScript, combat rules, audio events and full backend suite.
- Every guard's complete patrol segments must be physically walkable, not merely have a path between endpoints.
- Winning recordings contain only ordinary sequenced tap commands. Server verification and restored game state must agree.
- A blind-rush test should lose on most later rooms. A dodge/route-selection test must find a valid win on every room. Neither is a human difficulty rating.
- The live test week may be updated only if it has no completed, pending or recoverable runs. Previous manifest and all attempts are retained. Historical replay bundles stay immutable.
- Export the browser build, verify actual controls/rendering, build a signed APK and deploy matching replay rules to the existing API service.
- No payment, treasury, cosmetic pricing or real prize setting changes in this task.

Use `/design/combat/playtest/index.html` for all twelve launch links and sound comparisons. Local test links are restricted to localhost/127.0.0.1 and do not grant Android entitlements or submit ranked runs.


## Verified release

- TypeScript check passed. Full client suite: 150/150. Full backend suite: 65/65. Focused combat/audio (15) and replay-worker (2) checks passed again after the final source formatting change.
- All twelve campaign missions and the three weekly missions have legal winning input recordings verified against server replay and restored state. Blind rushing loses on nine of eleven later missions; training stays forgiving. These are automated feasibility checks, not user-retention evidence.
- All patrol segments and 52 weekly rotations pass deterministic/reachability checks. Twelve WAV files pass duration, non-silence and final peak checks.
- Actual browser testing covered tap movement, phone pickup, alarm pursuit, being caught, retry, pause/resume and the final mission's rendering. Retrying reset health to 100 and time to zero. Browser frame stats were about 30 FPS with a 34.1 ms p95 frame time; no physical-phone performance claim is made.
- Browser testing found a worklet declaration-order startup error that TypeScript did not catch. Moving the layout helper before its worklet caller fixed the exported bundle. Both browser and Android were rebuilt afterwards.
- The first gallery's native media controls triggered an in-app-browser renderer crash. Its replacement uses one shared Web Audio context and simple play/stop buttons. Alarm decoding, playing state and automatic stop were verified; no console errors appeared on the replacement gallery. A phone-speaker listening pass remains outstanding.
- Signed arm64 Android APK built successfully. No physical Android device was connected, so this release was not installed or exercised on a phone.
- Existing Railway API deployment succeeded. The empty test week was migrated with its former manifest backed up and all attempts retained. Live `/health` and `/league` match the release; see `verification/difficulty/deployment.json` for the deployment ID, rules hash and APK checksum.

Start with missions 2, 4, 8 and 12 in the local test gallery. A useful difficulty test is whether a player can explain why they lost and improve on the next run. More deaths alone do not establish better gameplay.
