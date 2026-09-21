# Follow camera

The reference is [Hunter Assassin gameplay](https://www.youtube.com/watch?v=raDBMEIr6Uo). Inspected the saved 6:08 frame and live video frames at 3:20 and 3:25. These show a densely filled portrait playfield; they do not reveal an engine zoom constant. Our 1.3× setting is an initial playtest choice, not a claimed match to its implementation.

- Default: 1.3× scale. The courier, walls, shots and tap route are 30% larger.
- Smooth, frame-rate-independent follow with map-edge clamping. No camera shake or rotation.
- Map / Follow toggles the original overview during play. Taps work in either mode.
- Tutorial and Reduced effects use the original fixed full-map camera.
- Gold edge arrows point toward the phone or exit. Red chevrons identify off-screen guards that see the courier or are firing; they do not reveal every patrol.
- The HUD stays still. Switch labels, gates and security entrances follow their world positions.
- Camera is presentation only: no changes to speeds, difficulty, input replay format, scores or server rules.

## Configuration and rollback

In the build environment or local `.env`:

```dotenv
EXPO_PUBLIC_FOLLOW_CAMERA=1
EXPO_PUBLIC_CAMERA_ZOOM=1.3
```

Set `EXPO_PUBLIC_FOLLOW_CAMERA=0` to restore the old full-map presentation and hide the toggle. Zoom accepts 1–1.6; invalid values fall back to 1.3. These are Expo build-time variables, not Railway backend variables. Re-export the web bundle or rebuild the APK after changing them.

```sh
EXPO_PUBLIC_FOLLOW_CAMERA=0 npm run export:web
```

## Validation

Tests cover projection/inverse taps across all 12 maps, full-map rollback, bounds, frame-rate independence, native overlay alignment and edge indicators. Browser checks cover visible zoom, Map/Follow and movement. Physical Android performance and motion comfort still need device testing. A closer camera is not automatically better: compare guard readability, missed taps and deaths before increasing the zoom further.
