# Mission chase loader — 2026-10-04

## Implemented

- Generated four-frame running strips for the courier carrying the Seeker, and Toly, Mert, Chase, Lily, Vibhu, Akshay and Beeman. Sources and prompts are in `assets/loading-chase-v1`.
- Native Reanimated sprite clipping, staggered strides, bobbing, scrolling city/road, and indeterminate loading shimmer. No video decoder or per-frame React state updates. Eight strips total 501,452 bytes; source PNGs are not imported into the app.
- Decorative assets warm during the splash/map. Mission readiness never waits on them.
- Uses the existing 650 ms mission intro window, followed by handoff once the React overlay unmounts. Reduced effects skip that intro animation. Game simulation and taps stay gated during loading.
- Local-only actual-component preview: `http://127.0.0.1:8787/?loaderLab=1`.

## Validation

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | Pass | `npm run typecheck` |
| Web export + rules hash | Pass | `npm run export:web` |
| Existing regression tests | Pass | `npm test`: 389 passed, zero failures |
| Eight image strips | Pass | Browser image natural sizes: all 1024×256, all complete |
| Portrait layout | Pass | Real component at 390×844; all characters visible |
| Compact error layout | Pass | Fixture at 320×568; Retry and Back to missions fit |
| Reduced motion | Pass | Fixture freezes sprite, bobbing, road and shimmer transforms |
| Error retry UI | Pass | Fixture Retry returns to animated state |
| Actual mission startup/restart | Pass | Mission 1 loads; Pause → Restart shows the new loader then gameplay; repeated successfully |
| Controls after handoff | Pass | Tapped floor, courier moved right; Pause remained functional |
| Browser errors | Pass | No error entries during tested gameplay |
| Android device performance | Not tested | No APK built in this change |
| Actual network-failure retry | Not tested | Error UI tested via fixture; no forced asset network failure |

Local screenshot: `screenshots/mission-restart.png`. Screenshot files remain local per repository QA policy.
