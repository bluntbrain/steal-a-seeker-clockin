# Minimal intro and defeat FX verification

- TypeScript check and production web export passed.
- Full test suite: 396 passed. Includes all twelve authored missions' defeat detection, archived replay compatibility, reset/remount/paused detection, bounded burst pool, spin frames, curve continuity, live collection endpoint, arrival timing, reduced effects and uncompressed defeat frames.
- Browser gameplay: targeted and defeated the mission-1 drone. Counter changed 0/7 to 1/7; generated broken-rotor wreck remained visible. Pause showed normal controls; Restart returned to loading without console errors.
- Browser intro: level-13 detail → Play opened the illustrated lesson with only Back and Play controls. No Watch Demo, pause, step chips or paragraph cards remained. Console warnings/errors were empty.
- Local production-layer inspection: `http://127.0.0.1:8787/?defeatLab=1` provides role selection and held impact/scatter/flight/collection frames, reduced effects and sound.

No physical Seeker performance measurement, native audio listening test, APK build, payment or backend deployment was performed for this visual-only update. Mobile viewport override produced a corrupted browser capture; reset the override and verified with the normal browser canvas instead. Do not treat that capture as native-layout evidence.

- Held-flight browser checkpoint: ten spinning coins visibly have gold/ivory trails, aimed at the moving courier. Normal robot and Toly collapse frames inspected; no console warnings/errors.
- Collection checkpoint leaves no stray coins or trails. Reduced effects show a settled boss without the flying-coin trails. Full-height intro visually verified at the normal browser size: only the scene, back icon and Play button.
