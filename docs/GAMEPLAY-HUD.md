# Compact gameplay HUD — 12 September 2026

The board is the main content. Removed the brand heading, separate mission/back row, always-visible decoy explainer, repeated FIND objective, generic hint line, FPS/footer and immediate reset link.

One 48px header contains back, mission name, timer and pause. Charge appears only while carrying; delivery count appears only on multi-phone missions. Full-sized joystick and three labelled actions remain below the board. Decoy count stays on the button. ACT replaces TAKE near a switch.

Action prompts and security feedback overlay the top edge of the board only when relevant. Relay countdowns have priority. Red alarm effects and guard behavior remain unchanged. Restart and performance details are in Pause; sound and controls help are in Pause → Settings. Level 11 adds a specific walkthrough there.

Measured board areas (isolated browser, normal text size):

| Viewport | Previous board height | New board height | Board area increase |
| --- | --- | --- | --- |
| 320×568 | 242px | 396px | 167% |
| 390×844 | 506px | 625px | 53% |
| 430×932 | 594px | 692px | 36% |

The full board keeps its existing aspect ratio so gameplay geometry and input coordinates are unchanged. No controls sit on top of the playable lanes. Evidence: `verification/compact-hud.json` and associated screenshots. Browser fit, joystick, decoy, pause/settings/restart and mission return tested. Android runtime testing remains deferred.
