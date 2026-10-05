# Prompt for the boss presentation pass

Copy everything below the line into the agent that will do the work. It assumes the agent has the repository checked out at `main` on or after commit `8dce4b8` (5 October 2026) and can run Node 22, the web preview and an Android emulator.

---

You are working in the Steal a Seeker repository (Expo 55, React Native 0.83, Reanimated 4 worklets, Skia 2.4, TypeScript). Your task is the boss presentation pass: make a boss look and feel like a boss without changing a single game rule.

## What exists today

- Boss levels are every third published level from 15 (`isBossLevel`, `bossFor` in `shared/campaign-levels.ts`). Seven bosses rotate: `toly`, `mert`, `chase`, `lily`, `vibhu`, `akshay`, `beeman` (`BOSSES`, `BOSS_NAMES`).
- Since 5 October a boss level uses one of three authored arenas in `shared/campaign-arenas.ts` (Pillar Court, Long Hall, Vault Ring). The boss is the warden guard placed at the arena anchor; escorts stand at the posts. You do not touch these files.
- Boss behaviour lives in the simulation, `src/game/heist-guards-v17.ts`, as `BOSS_TRAITS`: toly spots faster and radios in 8 tiles, mert radios the whole room, chase pursues 1.4 times faster with a narrow cone and quick turns, lily has a very wide slow cone, vibhu has 200 hp and takes 50 rear damage, akshay slashes in bursts of 3 then recovers for 15 ticks, beeman shares sight with his escorts. `bossTrait(level,index)` returns the trait for a patrol. These are the signatures you will visualise. Do not change them.
- Rendering of a guard, including a boss, is `src/components/GuardLayer.tsx`. A boss draws from `bossSprite` and the walk atlas `bossWalk` (`src/components/bossMotionAssets.ts`, frames selected by `bossWalkFrame` in `src/components/boss-motion.ts`). The boss art scale is `ENEMY_ART_SCALE.heavy*1.12` (`src/components/enemy-presentation.ts`, heavy is 1.28). Death frames for a boss come from `DEFEAT_SPRITES[bossId]`.
- Health bars and the boss name tag are `src/components/ActorHealthBars.tsx` (`Bar`, `bossName`, Skia `Text` with `useFont`).
- The entrance card is `src/components/BossEntrance.tsx`, shown by `src/GameScreen.tsx` while `bossEntrance` is true (state at line 103, render near line 399, `finishBossEntrance`). It shows the boss portrait (`BOSS_MOTION`) and the name, then fades.
- Haptics: `src/feedback/haptic-policy.ts` already has a `bossKill` cue with the highest priority. Cues are fired from the frame worklet in `GameScreen.tsx` through `runOnJS(callEvent)`. Do not add haptic calls anywhere else.
- Combat audio: `src/audio/useCombatAudio.ts` plays cues from the HUD snapshot diff (`knockout`, `heavyKO`, `droneKO`, and so on). Music: `src/audio/useLevelMusic.ts`.
- Portraits: `assets/bosses-v1/<id>.webp` (sprites), `assets/boss-motion-v2/<id>.webp` (walk and portrait sheets), `assets/defeats-v2/<id>.webp`. Generated art in this repo is made with the Codex CLI image tool (gpt-image-2); see `docs/plans/HUNTER-STEALTH-2026-10-04.md` section 5 for the prompt pattern and `scripts/pack-topdown-courier.mjs --boss` for packing.

## Hard constraints

1. No simulation change. Nothing under `src/game/`, `shared/campaign-*.ts`, `shared/replay.ts` or `server/replay.ts` may change. These files feed the rules hash; a change forces a new verifier bundle and a server deploy, which is out of scope. Run `npm run rules:check` before every commit; it must pass without `rules:generate`.
2. No per-frame React state. Anything that moves every frame is a Skia node driven by `useDerivedValue` or `usePathValue` over the `game` shared value and `alpha`, exactly like the existing layers. No `useState` updated from the frame loop, no `setInterval`.
3. No new allocations in worklets per frame beyond what the existing layers do. Reuse paths, precompute constants outside the worklet.
4. Display time only. A slow motion effect must not change `game.value.ticks` or the recorded replay. If you cannot do slow motion as presentation (for example by scaling the frame accumulator for a few hundred milliseconds only on the display side), skip it and say so.
5. Reduced effects (`settings.reducedEffects`) must disable pulses, auras and slow motion.
6. Keep the files under 500 lines. Prefer extending `GuardLayer.tsx`, `ActorHealthBars.tsx` and `BossEntrance.tsx` over new files. A new file is acceptable only for the boss health band, which is a new HUD element.
7. Commit rules: single author (the repository owner), no `Co-Authored-By`, lowercase imperative subject, no prefixes, no emojis, no em dashes anywhere in code, comments or docs. Never amend, never skip hooks, never force push.

## What to build

### 1. Presence in the room
- Boss art scale 1.5 times a normal guard (`ENEMY_ART_SCALE.guard*1.5`), with a soft elliptical ground shadow under the sprite and a slow idle "breathing" scale of plus or minus 2 percent driven from `clock` (skip when reduced).
- The boss shows above other guards in draw order when sprites overlap.

### 2. Signature tells, one per boss, drawn only while the boss is alive
Read the trait through `bossTrait(stateLevel(game.value),index)` inside a derived value. All drawing goes in `GuardLayer.tsx` (or a small boss group inside it).
- toly: when the boss is hunting or has noticed (`guard.brain` fields `noticed`, `suspicious`, or `mode`), draw two expanding radio rings from the boss, period 0.9 s, fading out at 8 tiles. Rings stop when the boss loses sight.
- mert: on the first frame the boss spots the courier, a full room flash: a white rectangle over the level at 35 percent opacity that fades in 250 ms. Reuse the alarm wash pattern from `GameScreen.tsx` if it is cheaper, but keep it inside the Skia canvas.
- chase: a short motion trail (three ghost copies of the sprite at decreasing opacity) while his speed exceeds walking speed, plus a narrow bright cone edge.
- lily: her cone is drawn with a softer, wider fill and a slow sweep highlight so the width reads at a glance.
- vibhu: armour glow (a thin gold stroke around the sprite) that flares when a hit lands from the front; a spark burst only on rear hits. Detect from `guard.hp` dropping and the courier position relative to the guard facing.
- akshay: during a slash burst (three swings in quick succession), draw three fading arc marks; during his recover window, show a short "winded" dim over his sprite.
- beeman: draw thin dashed lines from the boss to each escort whose sight he shares while any of them sees the courier.

### 3. Boss health band
A new HUD element at the top of the screen under the mission counter: portrait on the left (`BOSS_MOTION` portrait frame or `assets/bosses-v1`), name, and a wide health bar in Skia or a plain Reanimated view fed by a derived value from `game.value.guards[bossIndex].hp` over `hp` max from the level patrol spec. The band turns red under 50 percent. It hides when the boss dies. It must not re-render React on every frame; use `useAnimatedStyle` or a Skia rect width derived from the shared value.

### 4. Entrance card
Keep `BossEntrance.tsx`. Add under the name one line from a new `BOSS_TAGLINES` record in `src/components/boss-motion.ts` or a sibling presentation file (not in `shared/`): toly "Hears everything within eight tiles.", mert "One shout and the whole room knows.", chase "Runs you down. Do not run.", lily "Sees wide and slow. Cross behind her.", vibhu "Armoured front. Only the back bleeds.", akshay "Three quick cuts, then he breathes.", beeman "His escorts see what he sees." Add a second line with the stakes using the existing credit constants from `shared/store.ts` (boss clear credits and star bonus). Keep the Skip button.

### 5. Payoff
- On the tick the boss hp reaches zero: fire the existing `bossKill` haptic cue (it already exists; only make sure the classification in `GameScreen.tsx` treats the boss death as `bossKill`, which it already does through `definition.patrols[i].boss`), play a boss defeat stinger in `useCombatAudio.ts` (reuse `heavyKO` if no new audio file is available; if you add audio, put it under `assets/audio-boss-v1/` with a README stating how it was made), and show a two second "BOSS DOWN" ribbon over the canvas as a Reanimated view that mounts once (React state is fine here because it changes once per level).
- Slow motion is optional and display only (see constraint 4).

## Verification you must do and report

1. `npm run typecheck`, `npm test`, `npm run rules:check` all pass. Add tests only where logic is pure (for example a function that maps a trait to a tell configuration).
2. Web preview: `npm run export:web && npm run preview`, open `http://127.0.0.1:8787/?build=free-campaign-store` with a 390 by 844 viewport, seed progress in `localStorage['seeker.campaign.progress.v1']` so level 15 is unlocked (keys are the twelve authored ids plus `campaign:13`, `campaign:14`, each `{stars:3,seconds:60,score:900,battery:80,completions:1}`), start level 15, and take screenshots of: the entrance card, the boss with its health band, at least one signature tell firing, and the defeat ribbon. `window.__SEEKER_MVP__.snapshot()` gives the live state; `window.__SEEKER_MVP__.camera` gives the camera.
3. Confirm no new console errors and that `window.__SEEKER_MVP__.metrics` still reports a 95th percentile frame under 10 ms on the boss level in the browser.
4. Save the screenshots under `verification/hunter-stealth/boss-presentation/` with a README that lists what each shows and the exact measurements.
5. Build the APK with `npm run build:apk` only if asked; otherwise stop after the web verification and report.

## Report format

Lead with what is done and verified, then what is skipped and why. Name files only where the reader has to go there. Give the screenshot paths. Do not describe your process.
