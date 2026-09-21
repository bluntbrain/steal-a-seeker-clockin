# Credit claim and tactile feedback

## Shipped flow

Campaign win → full-screen earned credits → Claim → 12 minted credit coins
arc into the top balance → previous win actions (Next / Replay), or the
campaign-complete card after the final mission. Claim takes about 1.7 seconds
including a short collected confirmation. The user cannot double-claim.

The coins are procedural, bevelled mint artwork bearing the existing credit
diamond. They are not SOL, SKR or cash. The display counts up when coins arrive.
The target uses the actual reward-screen layout and safe-area insets.

Rewards are unchanged: 50/55/60 credits for a first 1/2/3-star campaign clear;
a better replay awards only the missing 5 or 10 credits; equal/worse replays
show +0 and Continue. Weekly/practice competition results retain their existing
submission flow and do not claim campaign credits or delay ranked submission.

## Persistence and failure behavior

- Local rewards are atomically persisted before Claim is enabled. Claim is
  presentation, never another credit write. Closing the app cannot undo a
  successfully saved reward. Local write failures show Retry save.
- Android connected-wallet rewards require a server-verified replay. The
  existing campaign transaction now returns `creditAward: {mission, credits}`;
  only the request actually granting credits reports a positive value.
- Wallet row locking, star high-water marks and ledger rules are unchanged.
  Concurrent/duplicate submissions do not create another reward.
- Missing/older/offline receipts show sync pending, not an invented amount.
  The replay outbox is preserved. After 8 seconds the user can continue while
  verification is pending. An unsaved replay retains the existing retry UI.
- The real balance is already saved; only this modal's balance presentation
  is held back until the coin animation. There is no artificial economy balance.
- Backgrounding stops audio and flight animations. Unmount cancels timers.
- Reduced effects skips flights and shows a short collected confirmation.
  Sound and vibration preferences are independent. Browser haptics are a no-op.

## Haptic map

| Event | Android feedback | Guardrail |
|---|---|---|
| Courier fires | Frequent segment tick | At most once / 140 ms |
| Courier takes damage | Reject, stronger than fire | Once / 180 ms; suppresses same-update shot |
| Guard eliminated | Virtual key | Once / 180 ms |
| Seeker picked up | Confirm | Once / 350 ms |
| Dash | Gesture start | Once / 250 ms |
| Switch activates | Toggle on | Once / 250 ms |
| Guard alert | Long press | Once / 1.5 s |
| Victory / defeat | Confirm / reject | Once / 700 ms |
| Claim | Gesture start | Once per claim |
| Coins land | Segment tick | Grouped; at most once / 110 ms |
| All credits collected | Confirm | Distinct ending |
| Tabs, mission selection, outfit selection, credit button, result actions | Segment tick | Once / 100 ms |
| Equip / unlock saved, payment fulfilled | Confirm | Only after successful action |
| Store action fails | Reject | No false success cue |

Global 90 ms priority arbitration stops unrelated cues stacking. Damage can
interrupt a light shot/UI tick. No enemy-shot or footstep vibrations. The
existing damage glow and sound share the same start callback as damage haptics,
including a mute-safe visual/haptic path. Disabled preferences and inactive
app state suppress all native cues. Hardware failures never block actions.

## Audio

Original 1.5-second coin collection cue generated using ElevenLabs
`eleven_text_to_sound_v2`: soft lift, ascending coin clinks, short confirmation
ping. Prompt and checksum: `assets/audio-rewards/manifest.json`.
Mono 32 kHz PCM, normalized to -19 LUFS / -3 dB true-peak limit. Played once per
claim at 75% of the selected effects volume. Secrets stay outside the repo.
API reference: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert

## Verification

- 200 game/unit tests passed, including haptic cadence and priority tests.
- 73 backend tests passed with an actual local PostgreSQL test database,
  including concurrent campaign awards and exact award receipt assertions.
- Actual pointer-input tutorial clear: +60 saved before Claim, old balance
  shown first, animated arrivals increment display, duplicate click adds nothing,
  then finale and downloadable card still work. This uses eleven prefilled
  completion records to exercise the finale; it is not twelve human clears.
- 390×844 and 360×640 reward layouts fit. Isolated sample checks cover muted
  sound, reduced motion, zero-credit replay and pending receipt.
- Android Hermes bundle export and TypeScript checks passed. No USB device was
  attached: physical motor feel and Android speaker balance remain unverified.
- Backend deployment `9702e5a4-4db0-4e23-85d6-60e8e4454ec9` succeeded; mainnet
  `/health` returned OK. No on-chain payment was made for these tests.

Interactive sample (does not alter game data):
http://127.0.0.1:8787/design/credit-claim/index.html
