# First outside playtest

Status: instrumented; no outside-player findings collected in this sprint. Automated route success does not establish fun, fairness or retention.

Recruit 10–20 willing testers (the builder must send invitations). Include several who have never seen the game, several Seeker users, and ordinary Android owners. Label their device/OS only with their permission. Do not request wallet keys or real token payment. Use the separate judge APK for gameplay and the web preview for browser feedback. Browser timing is not evidence of Android performance.

Give each tester the APK and only this task: “Recover a phone and escape. Try three missions if you want.” Watch silently for the first attempt. Record whether they discover movement, understand TAKE, notice the alarm, and find Retry. Ask them to turn on optional Local playtest recording in Settings before starting. Do not coach until they ask for help. Return visits must be observed on a later day; retries in one sitting are not retention.

After 10 minutes ask:
- What do you think a decoy does? Show where you would throw one.
- On your last loss, what caught you? What would you try differently?
- Which mission felt different? Which obstacle felt unfair?
- Would you choose another run now? Why?
- What would make this worth paying for? Do not suggest a price first.

Settings → Export playtest report lets them choose whether and where to share. It contains up to 100 local attempts, outcomes, used tools, last grid cell and a recent FPS/p95 snapshot. It has no wallet address, replay input, contact information or automatic network upload. FPS is a recent sample, not a full-run benchmark. Recording starts only after opt-in, so partial sessions must be labelled.

Analyze voluntarily supplied exports with `node scripts/summarize-playtests.cjs path/to/*.json`. Keep raw feedback outside the repository. Check rules hashes before comparing runs. Separate campaign, daily and trial attempts. Do not rank players by these unverified reports.

Decision rules (hypotheses, not measured results):
- If multiple new players cannot start moving or pick up the phone without help, fix the coach/control signal before adjusting guards.
- If players understand a loss but immediately retry, preserve that challenge.
- If multiple players fail in the same tile without understanding why, inspect sight lines, cover clearance and warning time with their replay/video before reducing difficulty.
- Re-test one changed variable at a time. Keep a before/after table with sample size, device, rules hash and raw comments.

Minimum evidence before claiming PMF: dated outside-player observations, voluntary return behavior and the questions above. A handful of enthusiastic comments or simulated wins is not PMF.
