# Gate and switch clarity — 20 September 2026

Dark Circuit (mission 9) previously rendered the switch and gate as flat amber rectangles. They now use vector artwork shared by the mission preview and gameplay: a raised power terminal, a mechanical lock, sliding door panels, and status lights. The current game's slate, amber and mint palette is retained.

The matching A labels and cable connect the two devices visually. Amber means locked; mint means open. The brief and in-game objective explain the action. Tapping the switch, its label or the locked gate routes the courier to the switch; activation still requires physically reaching it. Opening the gate changes the objective to taking the phone. Animations respect reduced effects.

No simulation, economy or server rules changed. Gate collision is still driven by the existing engine. The new assistance produces ordinary switch commands before recording.

Verification:
- TypeScript and web export passed.
- All 197 tests passed. The new test checks both gate and switch-label taps, movement, activation, collision removal and objective changes on the mission's real map (guards omitted in this isolated input test).
- Browser test uses a clearly stated progress-unlock fixture, then actual pointer input and the live mission with guards. Tapping the gate successfully moved the courier to the terminal, opened the gate and updated both labels. Health remained 100; no browser exceptions.
- Screenshots and report: `verification/mechanisms/`.

This is available in the local web preview. The existing v0.3.5-code8 APK was built before this change and does not contain it. No new Android build, physical-device verification or store submission was made for this patch.
