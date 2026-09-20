# Mission feedback and campaign ending — v0.3.5 (8)

## UX decisions

- Successful run: Replay on the left, Next mission on the right. Paused run: Restart on the left, Resume on the right. Failure: Retry on the left. There is no next mission after mission 12.
- Tapping a wall or building resolves to the nearest reachable floor point, including clearance at the edge. The route and destination marker use that resolved point. A sealed barrier never sends the courier through a wall. A tap on an enemy behind solid cover becomes a move toward reachable floor; tap the enemy again when there is a clear shot.
- Input assistance happens before replay recording. The server still receives ordinary move/attack commands. Existing simulation files, weekly engine hash, scoring, and archived replay bundles are unchanged. No backend deployment is necessary for this patch.
- Reinforcement points look like small security doors. No spawn countdown or plus box. In the last four seconds before a door can open, it pulses amber; the contextual warning says “Security door opening · keep clear.” The marker disappears when the guard enters.
- The active phone pulses slowly in gold. Two-phone missions explicitly say “Take phone 1 of 2,” then “Return phone 1 of 2 to EXIT,” then “One secured. Take phone 2 of 2.” A new objective chime accompanies the second phone. Completed phones are no longer drawn.
- The final missing campaign win reveals “Every Seeker. Secured.”, a gold card glow, a brief mint/gold confetti burst, and a campaign-completion sound. The portrait uses the equipped costume. The card contains actual saved best scores, best times, stars, and completed-mission count. It does not claim a weekly rank, cash reward, or server verification.
- Android shares a PNG through the system share sheet; choose X, Telegram, or another installed app. Browser downloads the PNG, then offers an X composer link with text; attach the downloaded image. No automatic posting. Opening a share target does not replace the completed result with a pause sheet.
- Reduced effects turns animated pulses into steady highlights and removes falling confetti. Sounds obey sound and volume settings.

## Assets

Two original ElevenLabs `eleven_text_to_sound_v2` effects, generated with the shared private credentials file:

- `assets/audio-milestones/campaign-complete.wav`: 4 seconds.
- `assets/audio-milestones/next-phone.wav`: 1.2 seconds.

Prompts, provider, duration, and hashes are in `assets/audio-milestones/manifest.json`. The API key is not in the repository. API reference: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert

## Verification

- TypeScript check passed.
- All 196 tests passed, including the additional guided-input regression.
- Input tests cover every blocker center, map corners, and a floor grid on all 12 maps; resolved routes remain collision-safe. Separate tests cover disconnected regions, nearest wall-edge projection, deterministic commands, and server replay parity.
- Campaign tests require all twelve wins, handle a missing earlier mission, preserve best records, remove the final Next action, and check the exported card labels and each two-phone instruction stage.
- Actual browser pointer input completed the eight tutorial steps, with no page errors.
- `scripts/playtest-objective-polish.cjs` verifies a real wall tap, movement to its resolved destination, mission 8's two-phone instruction, door markers, and restart-left/resume-right layout.
- `scripts/playtest-mission-polish.cjs` uses an explicitly labelled 11-win local fixture, then completes the missing tutorial with pointer inputs to exercise the real finale. It checks share-right/replay-left order, no Next action, 390×844 and 360×640 layouts, PNG download, and retaining the result on window blur. This fixture is not a claim of twelve human-played wins.
- Browser screenshots, PNG export, and reports: `verification/mission-polish/`.
- Production Android build: `releases/steal-a-seeker-mainnet-v0.3.5-code8.apk`. It keeps `com.bluntbrain.stealaseeker` and the existing release signing certificate. Build receipt contains exact source hashes.

## Delivery limits

The USB device was absent during final checks, so the new APK has not been installed or tested on the physical Realme. Native image sharing still needs that device check. No store submission was made and no backend/pricing setting changed. The previously submitted v0.3.4 remains a separate artifact.
