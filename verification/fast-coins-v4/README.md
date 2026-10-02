# Faster defeat pickup — 2026-10-02

## Timing and visual changes
- Total presentation lifetime: 0.68 s, down from 1.12 s.
- Ten coins instead of six. Radius 0.90–1.44 world units, versus 0.48–0.70; still capped at eight bursts / 80 sprites.
- Outward pop in 0.12 s. Accelerating attraction starts at 0.15 s with 7 ms per-coin staggering; all coins arrive by 0.56 s.
- Small gold collection ring from 0.43–0.68 s. Overlapping kills share one capped pulse.
- Existing ElevenLabs source clips reprocessed at 1.7× tempo, about 0.66 s, to match the return. No additional API generation or spend.
- Existing cosmetic-only reward semantics, pause/restart handling and reduced effects remain intact.

## Validation
TypeScript, five defeat-loot tests and production web export/rule hash checks passed. Tests include all guard slots in twelve campaign maps, moving courier attraction, continuous launch positions, wide burst, arrival deadlines, bounded pools and reduced effects. No simulation changes.

Real browser tap-to-defeat at 390 × 844 captured in sequence.jpg. Read left to right then down: approach, contact, outward burst, attraction, collection pulse, clear. Pause UI reports 60 FPS / p95 17.5 ms / 0 slow frames; no warnings/errors in inspected console. This is desktop-browser evidence, not physical Android verification. APK not built. Sound duration checked; subjective sound quality left for user audition.
