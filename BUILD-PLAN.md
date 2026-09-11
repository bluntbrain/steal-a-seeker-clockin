# Steal a Seeker — build plan

Updated 12 September 2026. The complete requested game is now planned as **12 levels with an angled overhead 3D view**, simple touch controls, Phantom/Mobile Wallet Adapter on devnet, purchases, saved progress and verified daily play.

- [Complete implementation plan](docs/COMPLETE-GAME-PLAN.md): current audit, screens, all levels, items, backend, commerce, testing and execution gates.
- [Selected 3D gameplay direction](docs/3D-GAMEPLAY.md): camera, controls, reactive guards, pickup-triggered escape, assets and native renderer prototype.
- [Historical v0.2 plan](docs/BUILD-PLAN-v0.2-history.md): preserved for context; its four-room release scope is superseded.

## Next milestone

Build one small room using the selected angled 3D view. Prove camera-relative movement, cover readability, robot investigation and an escape after phone pickup on Android before making the remaining maps. Preserve the current playable prototype while testing the native renderer. Then prove Phantom connect and the devnet buy → play → save → restore flow.

## Current status

For implementation evidence and unfinished requirements, use [IMPLEMENTATION-STATUS.md](docs/IMPLEMENTATION-STATUS.md). The snapshot below describes the start of implementation.

The current implementation still has one 2D warehouse layout and two modes. Full 3D, the additional levels, wallet, backend, shop and rewards are planned work. Four levels are an intermediate milestone; all twelve belong to the requested final campaign. Devnet uses clearly labelled test tokens, never real SKR disguised as a test balance.
