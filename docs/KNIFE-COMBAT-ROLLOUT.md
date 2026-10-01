# Knife combat — 1 October 2026

Campaign revision 15 replaces courier bullets with contact attacks. Tap an enemy to follow it, stop within reach and slash; tap the floor to cancel. Guards retain guns. New tutorial storage key shows the changed controls once to returning players.

## Rules

- 30 Hz authoritative simulation: 4-tick wind-up, impact recheck, 11-tick attack cycle. Renderer callbacks never award damage.
- Reach: 0.85 tiles for normal enemies/drones, 1.05 for heavy guards. Small 0.08 contact tolerance; walls/gates must still allow direct sight.
- Normal alerted hit: 35 damage. Unaware rear hit: one takedown. Drone: 25 (one contact hit). Heavy/Warden: front blocks, side 20, rear 75.
- A blocked front attack cancels targeting and signals a flank. Survivors cannot be repeatedly stun-locked.
- Melee sound radius 1.5 tiles; armor clang 2.5. Guards get 10 extra aim ticks and 8 extra recovery ticks. Final 12 aim ticks are committed. Drone report: 36 ticks in levels 1–3, 30 later; charging drones hold position.
- Original synthesized swing/contact/clang sounds, separate Android hit/block cues, small shared knife texture across all skins. No new runtime dependency.

## Performance

Retargeting is bounded; an unreachable target gets an eight-tick failed-route cooldown. Contact navigation rejects distant boxes before exact sampled collision checks. The new optimization is revision-gated and tested against the previous collision sampler. Rendering uses Skia/Reanimated; no React per-frame animation state.

Replay workers now load hash-verified, precompiled bundles directly instead of starting TypeScript in each worker. The two-worker capacity and five-second verification budget remain. This removes avoidable claim latency without accepting client scores or weakening bundle integrity checks.

## Backend and weekly rollout

Current rules hash: `4b7b58c7d103f80006d3ba55381bfb75ec3f7175127b29cb73ffd10f72b122f4`.

Revision 14 is archived and verified against its actual bundled campaign definitions. Earlier weekly engines remain compatible; archived runs keep their original guns and revision-aware instructions. Credits remain deduplicated by campaign mission/stars.

`KNIFE_WEEKLY_START=YYYY-MM-DD` enables knife contracts for an unfrozen week at or after that Monday UTC. Leave unset until the updated client is available. `LeagueService.manifest()` always returns an already-published pack unchanged. Do not replace active manifests or compare gun and knife runs in one competition. Test previews use local campaign state and are not ranked evidence.

Deploy matching backend bundles before releasing an APK that claims the new rules hash. This task builds only the browser preview and pushes source; it does not build an APK or activate the weekly switch.

## Verification and remaining limits

See `verification/knife-v15/index.html`. Automated campaign/weekly wins are recorded ordinary input, not health or position overrides. Browser interaction covered tutorial movement, contact drone defeat, targeting, pause/resume, mission entry and phone-sized lesson controls. It does not substitute for a human completion of all 12 missions or physical Android performance/haptics QA. Existing dated promotional footage remains archived; it has not been relabeled as knife gameplay.
