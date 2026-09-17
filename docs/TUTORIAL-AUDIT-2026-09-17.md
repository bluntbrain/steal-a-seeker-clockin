# First tutorial audit — 17 September 2026

## Reproduced failures

1. An off-centre tap inside the teaching ring was accepted (1.1 world units), but the courier walked to that raw touch position. Completion required being within 0.2 units of the authored waypoint. The visible cover lesson stayed on screen with the timer running after the courier stopped. The existing test only tapped exact coordinates, so it missed this.
2. Opening Missions and starting again recreated the level while retaining the tutorial stage. Later instructions could refer to guards already defeated or a phone not yet collected in the reset state.
3. Checkpoint persistence depended on an effect that ran before GameScreen populated a ref. Once the guide paused there might be no further render to save it.

## Changes

- Accepted teaching movement taps resolve to the lesson's actual waypoint. Ordinary campaign/ranked controls are unchanged.
- The target ring follows the living guard instead of showing its original spawn point.
- Starting the guided mission restores the teaching checkpoint and stage together. Replay tutorial explicitly starts over.
- The hook captures and writes paused checkpoints together; writes are ordered. Initial storage loading keeps teaching simulation paused.
- Recovery clears stale commands and frame accumulation. Invalid taps do not release the teaching pause.
- Completing or skipping the guide clears its saved checkpoint. A checkpoint-restored run remains local and cannot submit a spliced replay for wallet credits or ranking.

## Verification

- TypeScript passes.
- 189 game/client tests pass, including three new regression cases.
- Tests play all eight lessons with taps offset in eight directions, observe completion at UI-like cadence, and verify the resulting complete input replay on the server verifier.
- Every serialized teaching checkpoint can finish extraction. Invalid taps and a nearby stop command are covered.
- Visible local browser checks reproduced the old stuck cover step, then passed off-centre movement/cover taps and menu return after the fix.
- A fresh browser save reached the win screen: 17 seconds, 100 health, three stars, 9,822 points, +60 credits. Next mission opened Blind Corner. Browser values are local demo values, not a wallet payout.
- APK 0.3.4 / code 7 built with the existing release certificate and installed on the connected Realme RMX5033. Package manager and cold-launch checks passed; no errors appeared in the sampled AndroidRuntime/ReactNativeJS log output.
- The physical phone was asleep/locked. This does not establish a physical touch walkthrough, sound quality or Phantom transaction success.

## Retest on the phone

Open Missions → Settings → Replay first-mission tips, or pause a campaign run → Replay tutorial. Tap near the edge of the rings, leave for Missions halfway through, then start mission 1 again. Finish the tutorial, check the credit increase and open mission 2. The current first-clear reward is 50 credits plus 5 for each additional star (60 for three stars).
