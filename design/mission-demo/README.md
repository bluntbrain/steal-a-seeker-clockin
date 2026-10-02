# Mission teaching screen

Generated with Codex's built-in image generation tool on 25 September 2026. No Higgsfield was used. `concept.png` is the design reference, not a screenshot of the implemented game.

Design brief: a portrait Android screen in the game's dark forest/mint palette. Back, mission number and Skip across the top; “Watch. Then make your move.” above an illustrated top-down demo. Show the off-white courier, steel floor, cover, robot, phone and exit; a finger tap and mint route explain movement. Provide Move / Shoot / Escape tabs, a short synchronized caption, a compact mission-specific tip, and a fixed Play Mission button above a separate Android navigation safe area. The attached Mission 02 screenshot supplied the palette and existing app context. Avoid giant collection art and long introductory copy.

Implemented in `src/components/MissionIntro.tsx` and `MissionDemo.tsx`. The live demonstration reuses the actual floor, wall, phone and courier atlases and a native-view version of the robot guard. It is a 12.8-second looping presentation, not a playable mission or a recorded video. It works offline, pauses in the background, supports Pause and step replay, and shows static teaching frames when Reduced effects is enabled.

The generated concept remains here; the large reference PNG is not required by the app or bundled in the APK.

Safe-area implementation follows the library's modal-root guidance:
- https://appandflow.github.io/react-native-safe-area-context/api/safe-area-provider/
- https://reactnative.dev/docs/modal
