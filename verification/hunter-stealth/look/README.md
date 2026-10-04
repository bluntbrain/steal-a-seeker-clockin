# Look pass, 4 October 2026 (night)

Web preview evidence for the look pass (wall caps regenerated, continuous wall frames, route start, blood pool removed, loader floor).

- `wall-caps-v6.png`: the three regenerated caps (warehouse ribbed decking, rooftop vent slats, powerworks bolted plates) before packing.
- `web-walls-before.png` and `web-walls-after.png`: levels 1, 5 and 9 in the web preview before and after. Before, every two world units carried its own frame and centrepiece. After, each wall carries one frame and a tiled interior.
- `web-route-starts-at-courier.png`: after a tap, the route line begins under the courier. Codex's courier clearance clip (commit 78aba39) is removed.
- `web-loader.png`: the mission loader. Measured in the browser from the Play tap: shown at 31 ms, hidden at 2,081 ms, with the 2,000 ms floor in `src/GameScreen.tsx`.
- Guard blood pool: removed from `src/components/GuardLayer.tsx`; the body still stays on the floor for discovery.

- Start button spinner (commit after 3de2627): browser DOM check on the pause sheet, `{"spinnerShown":true,"sheetGoneAfter400ms":true}` 15 ms after pressing Restart.

Web preview on 127.0.0.1:8787, `?build=free-campaign-store`, viewport 390 x 844. 389 client tests pass.
