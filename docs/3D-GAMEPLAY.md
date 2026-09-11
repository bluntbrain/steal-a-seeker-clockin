# A more dynamic 3D heist

Direction selected by the user on 12 September 2026: **angled overhead view with 3D depth and simpler controls**. Use real 3D models and rooms with an isometric-like perspective camera. The current game remains a flat 2D Skia prototype; this upgrade is planned, not implemented.

## The strongest direction

A compact stylized 3D heist with an angled overhead camera close enough to read the courier and robots. Keep the room small and the objective obvious. The Roblox inspiration is physical characters, readable obstacles, reactive situations and funny near misses. It does not require a multiplayer lobby or copying another game's characters/maps.

Keep portrait orientation initially. Start around 45–55 degrees above the floor with a fixed diagonal heading and a restrained perspective. These are tuning values, not a true orthographic requirement. The camera follows gently; the player does not need to rotate it. Joystick movement is relative to the visible floor axes, so dragging up moves toward the top of the screen. Test corners, safe areas and cover visibility before locking camera distance. Fade obstructing foreground walls while keeping their collision boundaries visible. Small pickup/extraction emphasis must not steal control during danger.

Controls: left thumb moves; right thumb has the contextual pickup/interact action and carry-dash. Add a tool button only when a mission introduces a tool. Quiet movement comes from partial joystick travel; full travel makes more noise if that rule is enabled. Avoid requiring simultaneous camera rotation, movement and an action. Use authored ramps or marked vaults later, rather than free jumping in the first prototype.

## The key change: pickup starts the escape

The approach lets the player watch patrols and choose cover. Grabbing the phone wakes nearby security: a robot investigates the last known position, a gate begins closing, and a second route becomes relevant. Telegraph that change before committing the pickup. The courier becomes slower while carrying but can spend battery to sprint/dash. Breaking sight lets the player hide and the robot search rather than immediately failing every exposed run.

Use a fixed pickup-triggered event in the first prototype. Randomness comes later, only through tested published variants. Fairness matters when a run has an entry cost.

## Mechanics worth prototyping

| Change | Player decision | Bound the scope |
| --- | --- | --- |
| Cover and hiding | Wait behind a crate or risk crossing now | Crouch/hide only where readable; hiding is not automatic invulnerability |
| Noise and investigation | Sprint loudly, walk quietly, or throw a decoy | One noise radius and reachable last-known point; show guard suspicion |
| Search and escape | Break sight, change route, then leave | Patrol → investigate → search → return, with short readable chase |
| Contextual vault | Take a fast route over marked low cover | One authored vault animation; no free jumping or complex parkour |
| Moving security | Time a shutter or scanner crossing | Predictable cycles and safe waiting pockets |
| Physical comedy | Watch the courier scramble after a near miss | Recovery animation preserves controls; no random slapstick that takes a paid run away |
| Pickup reaction | Plan the return route before grabbing the phone | One announced security change per early level |
| Visible collection | Put recovered phones and outfits in a hideout | Small collection scene; no sprawling base-building system |

Do not add all of these at once. Prototype movement, cover, investigation and pickup-triggered escape first. Vaulting and chase need new collision/AI rules; they are not existing features.

## One-room proof

One 3D courier, one robot, four crates, one phone pedestal and one exit. A 45–90 second run: enter, watch the guard, cross to the phone, trigger the alarm, break sight behind cover and escape. Supply a clear losing route and a retry. No shop expansion or twelve final-art maps until this feels better than the baseline.

Acceptance: the user can identify the exit, distinguish hiding from exposure, move around corners without fighting the camera and recover from an alarm. Camera cannot pass through walls or hide the next obstacle. Touch input stays responsive on physical Android, with a measured frame profile. Rendered animation and collision stay aligned.

## Implementation choices to verify

**First candidate: React Native app shell with a native 3D renderer.** This preserves the current app/wallet direction and much of the horizontal game simulation. [React Native Filament](https://margelo.github.io/react-native-filament/docs/guides) is a candidate, not an approved dependency yet. Its [camera API](https://margelo.github.io/react-native-filament/docs/guides/camera) exposes perspective cameras. Verify Android build compatibility, animated model loading, camera control and frame timing in our Expo/RN version before choosing it. Do not assume its React Native integration has browser parity because the underlying engine supports multiple platforms.

Keep movement/guard logic controlled and reproducible. Filament's documented [physics API](https://margelo.github.io/react-native-filament/docs/guides/physics) is marked work in progress; do not make a new physics wrapper responsible for ranked outcomes. A floor-plane collision model with authored vault/door transitions is enough for the first room.

**If a full 3D engine is needed:** evaluate Godot or another dedicated engine against the same room and wallet round trip. That is a gameplay/rendering rewrite with asset and build pipeline costs. Godot supports [Android plugins](https://docs.godotengine.org/en/stable/tutorials/platform/android/android_plugin.html); MWA can use the [official Android client](https://github.com/solana-mobile/mobile-wallet-adapter), but an integration bridge still needs implementation and device tests. No claim that switching engines gives a finished Phantom integration.

## Required 3D assets

The current PNG courier sheet helps define the character but cannot rotate into a 3D model. Need a low-poly courier mesh, UVs/materials, rig, idle/walk/run/carry/pickup/caught animations, and a robot model with simple animation. Start with proxy meshes, then final art after the camera works. Outfits share the courier rig; avoid building a separate skeleton for every costume.

Environment: modular floor, wall, crate, doorway, gate and pedestal meshes. Use few materials, restrained lighting and a shared texture atlas where useful. Separate visual meshes from simple collision proxies. Use existing location sheets for mood and staging, not as a substitute for geometry. New location sheets still use Soul/Soul Cinema as requested.

## What carries over

Game premise, districts, mission decisions, economy, backend order design and MWA requirement remain. The Skia renderer, sprite animation, camera, controls and some collision/AI need changes. Keep the working prototype available until the replacement proves itself. Revise the full-game schedule after this experiment; do not quietly label a full 3D rewrite a small visual update.
