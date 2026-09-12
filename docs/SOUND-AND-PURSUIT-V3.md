# Sound and pursuit v3

## Sound direction

A playful but urgent heist: tactile phone theft, recognizable robot detection, dry mechanical interactions, and a rewarding escape. Ten new original ElevenLabs effects replace the gameplay pack. Generated through the [sound effects API](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert); prompts, durations and mastering are recorded in `assets/audio-v3/manifest.json`. Credentials remain outside the repository.

| Moment | Sound | Mix relative to user volume |
| --- | --- | --- |
| Before theft | Quiet vault ambience | 18% |
| Phone picked up | Latch, electronic rise, alarm impact | 100% |
| Alarm active | Rounded repeating alarm | 22% |
| Escape / being seen | Clockwork chase texture | 26% / 36% |
| Detection | Short radar double pip | 65%; 1.3s retrigger limit |
| Dash / decoy / relay | Air burst / clack and chirps / power clack | 70% |
| Caught | Clamp and power-down | 80% |
| Extraction | Dock and reward flourish | 90% |

The ambient bed becomes silent after theft. Alarm and pursuit loops stop on pause, loss or extraction. Mute covers all layers. Foreground playback checks the current pause/mute state after asynchronous seeking, preventing a buffered sound from starting after the player pauses. Existing purchase/UI sounds are outside this gameplay replacement.

Runtime audio is mono 44.1kHz PCM with peak headroom and trimmed one-shot tails. The new pack and isolated audition are available at `/design/sound-v3/index.html`. The audition mix is an arrangement for comparison, not recorded gameplay. Final speaker/headphone taste testing remains subjective.

## Stronger pursuit

- Mobile guards use 2.2× their normal speed immediately after theft, ramping to 2.8× after 20 seconds.
- Theft triggers a radio report of the courier's location. Further reports occur every four seconds; this is a snapshot, not continuous knowledge behind cover.
- A visible courier is actively pursued. Path updates are capped at one every 0.45 seconds, rather than solving a path every frame.
- Walls, crates and closed gates remain real obstacles. If a report cannot be reached, guards retry later.
- Decoys override hidden phone reports while the lure is active. A guard that sees you follows the sighting instead. Stationary scanners sweep faster but never move.
- The final two-delivery mission has six decoys, three per escape; the Warden mission has three. The speed and pursuit increase should still allow deliberate counterplay.

Simulation changes require a new pinned rules bundle. Historical bundles are retained for previously issued tickets. Campaign route fixtures must be regenerated; old winning routes and the earlier level-11 browser run are not proof of the new difficulty.

## Verification

- TypeScript typecheck and production web export passed.
- 79 gameplay/client tests and 51 backend tests passed, including pinned replay verification.
- All 12 campaign missions have winning deterministic routes under the new rules (`verification/campaign-routes.json`). These prove solvability, not human difficulty balance.
- `scripts/playtest-sound-v3.cjs` passed with real joystick and keyboard inputs in an isolated 390×844 Chrome profile. Pickup, audible loop playback, pause, mute, resume, pursuing-guard capture and failure audio were checked; no browser runtime errors occurred.
- The gallery and all 11 audio files (ten cues plus the audition mix) served successfully.
- Android speaker playback, physical controls and subjective listening are still to be tested on a device.
