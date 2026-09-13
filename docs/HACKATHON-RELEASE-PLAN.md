# Hackathon completion sprint — September 13

Scope authorized: 1 (onboarding/ending), 2 (playtest/balance), 4 (daily competition), 5 (physical Android), 6 (submission). Current renderer: 2D Skia; 3D phone inspection only.

1. Teach movement, pickup and escape through one compact contextual coach, with dismissal and replay. Finish all 12 missions with a collection-complete state and useful replay/daily actions.
2. Add bounded device-local playtest logs, an explicit export/delete workflow and a tester protocol. Measure starts, outcomes, retries, tools and failure locations without wallet addresses or automatic uploads. Real tester recruitment/feedback must not be represented by synthetic runs. Tune only where evidence supports a change.
4. Share the daily mission rotation between browser and server. Show reset time, personal best and the nearest better verified score. Keep browser practice visibly local; verify online ranking with independently signed test identities on the local backend. A deployed service and physical wallet round trip depend on item 3, which was not selected in this sprint.
5. Build a current Android artifact, exercise native controls/navigation/background/audio/settings, measure release performance, and record hardware and build evidence. No physical device was connected at the initial check; user is connecting one. Emulator checks remain separate from physical checks.
6. Prepare a reproducible build, protected distribution signing, APK checksum, judge guide, privacy/support draft, pitch deck and a three-minute demo script/recording where evidence is available. Never submit the final agreement, invent traction, or present browser/local/devnet evidence as mainnet or physical evidence.

Acceptance: current web flow and native build checked; tests appropriate to new logic; source commit and exact limitations recorded. Keep unrelated native recovery diagnostic changes intact. Final registration, physical wallet payment, public API and store publication remain explicit gates if unavailable.

## September 13 outcome

| Item | Delivered | Open evidence / dependency |
|---|---|---|
| 1 | Contextual first-mission coach, persistent dismissal/replay, completion screen after 12 missions, collection/daily/star replay actions | Human comprehension test. Collection UI was tested with an explicit fixture. |
| 2 | Opt-in last-100 local run records; export/delete; retry, tools, outcomes, failure tiles and recent FPS/p95; analysis script; outside-tester protocol | No outside tester feedback yet. Do not tune by invented retention. Current pointer harness cleared 1–3 but exhausted nine tested phases in mission 4; all 12 simulation routes still pass. |
| 4 | Shared browser/server UTC rotation; reset timer; personal best and nearest better verified rank, including outside top 50; exact ties preserved | Public backend and physical signed daily submission need the excluded deployment/service work. |
| 5 | Private distribution signing; separate offline judge package; normal devnet package; standalone Android emulator checks; fixed native map/shortcut and Settings-close layouts | Physical USB never appears in ADB or macOS USB tree despite user confirmation. Physical performance, sound/haptics, full campaign and wallet checks remain unverified. |
| 6 | Six-slide editable deck; reproducible release scripts; signing/source/checksum manifests; judge guide; privacy/support draft; timed 3-minute demo script | Final physical-device/wallet demo, actual support/retention details, reviewer access, registration and final submission agreement. |

Validation: 83 client/game tests and 52 server tests passed; current typecheck, rules hash and three compact viewport checks passed. Release UI test covers report lifecycle, tutorial replay, daily selection and complete collection layout. Native evidence is in `verification/release-native/report.json`; read its `physical` field and limitations. The normal devnet APK intentionally has no public API configured. Do not call it a working live purchase demo.

Balance decision: keep the existing rules while gathering real-player evidence. The current pointer test failure is preserved in `verification/release-browser-routes/pointer-run.log`; it is not overwritten by historical successful reports. Next diagnose mission 4 with a focused actual-input playthrough before recording the final campaign demo.
